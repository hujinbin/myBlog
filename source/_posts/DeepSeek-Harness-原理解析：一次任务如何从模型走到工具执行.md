---
title: DeepSeek Harness 原理解析：一次任务如何从模型走到工具执行
date: 2026-10-02 17:05:33
tags:
  - DeepSeek Harness
  - AI Agent
  - TypeScript
  - 源码解析
categories:
  - AI 开发
description: 结合 web3d-agent-cli 源码，追踪 DeepSeek Harness 的模型桥接、工具审批、任务取消、会话恢复与请求预算，理解一次开发任务的执行过程。
---

给编程智能体接上一个模型接口，很快就能看到它回答问题。真正值得追问的部分发生在回答之后。模型要求修改文件时，谁决定这次修改可以执行？用户按下 Ctrl+C 时，正在写入的工具会怎样结束？下一次恢复对话，程序又凭什么判断某个工具已经运行过？

安装、规则配置与项目接入见{% post_link DeepSeek-Harness-实战：做一个面向-Three-js-与-Python-的-Agent-CLI 'DeepSeek Harness 实战篇' %}。

<!--more-->

这些问题落在 Harness 负责的运行过程里。DeepSeek Harness，简称 DSH，把模型请求、工具调度、会话记录和扩展策略组织成一套可组合的服务。本文结合 `web3d-agent-cli` 的实际实现，沿着一次“检查 Three.js 场景并修改代码”的任务往下看。项目固定使用 DSH `0.2.1-rc.5` 和 Cordis `4.0.5`，下文涉及 DSH 的接口与源码链接均以这个标签为依据。[DSH 固定版本架构文档](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/docs/architecture.zh.md)

我更关心一套智能体框架怎样处理执行过程中的状态变化。工具返回错误、模型输出半截参数、用户取消任务，都可能发生在正常工作中。把这些情况放进流程一起考虑，才能判断框架替应用承担了多少工作。

## 把运行过程组装成服务

先看本项目实际组装出的调用关系。图中虚线表示记录与投影，实线表示任务执行方向。

<picture>
  <source media="(max-width: 640px)" srcset="/images/deepseek-harness/dsh-principles-flow-mobile.svg">
  <img class="not-gallery-item" src="/images/deepseek-harness/dsh-principles-flow.svg" alt="DeepSeek Harness 服务、模型适配、工具执行与会话投影的调用关系" loading="lazy" decoding="async">
</picture>

理解这张图，可以从前端熟悉的请求中间件入手。应用有一个共享上下文 `ctx`，服务挂在 `ctx.llm`、`ctx.tools`、`ctx.sessions` 等位置。插件既可以注册能力，也可以在事件入口检查请求或返回决策。Cordis 还管理这些注册的生命周期，释放上下文时，对应的注册和监听会随之撤销。[固定版本 Cordis 入门](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/docs/cordis-primer.zh.md)

项目的 `runDshAgent()` 直接在进程内挂载核心服务，入口摘录如下。这里的 `agents: []` 表示启动时先保留空的声明式 Agent 列表，随后通过代码创建本次任务的 Agent。

```ts
await ctx.plugin(LlmRuntime);
await ctx.plugin(SessionStore);
await ctx.plugin(SessionProjectionRegistry);
await ctx.plugin(SystemPrompt);
await ctx.plugin(ToolRuntime, { mode: 'native' });
await ctx.plugin(AgentRegistry);
await ctx.plugin(AgentLoop, { agents: [], maxParallelToolCalls: 1 });
ctx.llm.registerAdapter(['web3d'], new ProviderBridge());
```

这些服务各自保存一部分职责，读源码时可以按下表定位。[项目运行时源码](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts#L168)

| 服务 | 在这次任务里负责什么 |
| --- | --- |
| `AgentRegistry` | 提供创建 Agent、查找活跃 Agent 的接口 |
| `AgentLoop` | 推进模型请求、工具调用和下一步 |
| `LlmRuntime` | 按 provider 路由找到模型适配器 |
| `SystemPrompt` | 组装提示词片段与工具声明 |
| `ToolRuntime` | 注册工具，运行调用前后的策略与执行流程 |
| `SessionStore` | 保存当前进程中的会话事件，派生模型消息 |
| `SessionProjectionRegistry` | 根据事件更新已注册的状态投影 |

其中，`SessionProjectionRegistry` 服务于状态折叠，`session.deriveMessages()` 则提供模型消息视图。项目再把这个消息视图转换成自己的 Session v1。它们处理的对象和用途各有侧重，跟踪代码时要看清楚当前拿到的是事件、状态，还是请求消息。[固定版本会话文档](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/packages/core/session/README.zh.md)

## 一次任务经过几个步骤

用户输入任务后，项目通过 `ctx.agents.create()` 创建 Agent，把模型路由和工作目录传进去，然后提交一条用户消息。

```ts
agent.followup(createUserMessage({
  content: [{ type: 'text', text: options.prompt }],
  source: { kind: 'user' }
}));
await agent.whenIdle();
```

`followup()` 将输入放入队列并唤醒驱动器。接下来，一个 turn 打开，其中可以包含多个 step。一个 step 包括一次模型请求及其要求执行的工具。例如，第一次请求读取 `scene.ts`，第二次请求调用 `edit_file`，第三次请求说明修改结果，这个用户任务就经历了三个步骤。DSH 会围绕这些边界记录 `turn/start`、`step/start`、`step/end` 和 `turn/end`。[固定版本生命周期说明](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/docs/agent-lifecycle.md)

一次工具调用至少包含调用 ID、工具名称和原始参数字符串。模型给出这些信息后，程序执行工具，再用相同的调用 ID 关联结果。下一次请求会同时带上助手的调用和工具的返回值，模型才能根据文件内容决定继续编辑、重新读取，还是结束任务。工具报出的“旧文本未匹配”也会进入这条反馈路径，让下一步决策基于实际文件状态。

`whenIdle()` 等待驱动器停稳。调用方还要检查结束原因。模型失败、取消和正常完成都可能让 Agent 回到 idle，所以项目会同时读取 `turn/end`，保留 `agent/error` 报告的异常，最终向 CLI 返回 `completed`、`max_steps` 或 `aborted`，错误则继续向上抛出。[项目结束状态判断](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts#L245)

## 模型协议怎样接到循环里

模型请求真正离开进程前，要经过 `ProviderBridge`。这个类继承 DSH 的 `LlmAdapter`，把 DSH 的消息和内容块转换成项目已有的 `ModelProvider.complete()` 接口。HTTP 请求、SSE 解析、超时与上游响应检查由 `OpenAICompatibleProvider` 实现。这里的 `web3d` 是注册给 DSH 的内部路由名，具体模型 ID 和接口地址来自应用配置。[DSH 适配器接口](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/packages/llm/llm/src/index.ts)，[项目 ProviderBridge](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts#L99)

桥接有一个容易忽略的细节。Provider 收到普通文本增量时，项目立即通过 `onText` 展示到终端。等完整响应通过校验，桥接层才把文本、思考字段和工具调用组成 DSH 的内容块，再以 `StreamChunk` 序列交回循环。因此，这个实现中，用户看到的文字增量走 Provider 回调，DSH 收到的工具块经过完整响应检查。理解这个时间顺序，才能准确判断某段参数什么时候具备执行资格。[项目响应转换](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts#L115)

假设模型输出了一次 `edit_file` 调用，参数流只到 `{"path":"scene.ts","old_text":` 就断开。项目的 SSE 解析器要求同时收到完整结束标记和结束原因，响应缺失时直接报错。运行时还会拒绝 `length`、`content_filter` 以及同一批次重复的工具 ID。这些检查发生在工具调度之前。历史批次复用 `call_0` 的兼容接口，则由桥接层重新生成冲突 ID，让后续结果仍能对应到当前调用。[项目 SSE 完整性检查](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/providers/openai.ts)，[运行时批次校验](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts#L124)

## 工具执行前怎样判断权限

有了完整调用，下一步才是决定是否执行。`ToolRuntime` 公开工具名称、描述与参数 schema，并提供 `tools/pre-execute`、`tools/execute`、`tools/post-execute` 等入口。前置策略可以返回允许或拒绝，环绕执行层可以包装实际分发，后置策略可以检查结果。这样的扩展方式让策略跟工具主体之间有明确的接口。[固定版本工具文档](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/packages/core/tools/README.zh.md)

本项目把 `ask`、`auto-edit` 和 `plan` 的含义写在 `tools/pre-execute` 中。下面这段代码直接摘自运行时，展示其中的决策部分。

```ts
if (options.mode === 'plan' && tool.kind !== 'read')
  return { kind: 'deny', reason: 'plan 模式仅允许读取与检查' };
if (tool.kind !== 'read') {
  const automatic = (tool.kind === 'write' && options.mode === 'auto-edit')
    || (tool.kind === 'command' && options.allowRun);
  if (!automatic && !await options.approve({
    tool: tool.name, kind: tool.kind,
    input: input as Record<string, unknown>
  })) return { kind: 'deny', reason: '用户未批准此操作' };
}
return next();
```

`next()` 会把调用交给下游，提前返回拒绝则结束这次策略判断。这与常见的服务端中间件很接近。项目另外保留原始参数字符串并重新执行 `JSON.parse()`，要求参数为对象。具体工具继续校验字段、范围和文件路径。批准解决的是这次操作是否可以继续，参数与文件状态检查则决定操作能否正确执行。[项目审批入口](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts#L204)

以编辑文件为例，工具要求当前进程已经完整读取目标文件，并检查读取版本的 SHA-256。文件被其他编辑器改动后，旧的读取证据失效，需要重新读取。大文件按行分页时，只有同一版本的全部行都实际返回，才会获得完整读取状态。这些逻辑位于项目的工具层。DSH 负责把调用送进执行流程，项目负责定义工作区操作的具体条件。[项目文件工具](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/tools/index.ts#L74)，[写入前版本检查](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/tools/workspace.ts#L150)

这份读取证据保存在进程内的 `readState` 中。恢复对话能够找回此前讨论的内容，重新读取文件则用来确认当前磁盘状态。两者分别回答“我们之前谈到了什么”和“现在允许依据哪个文件版本写入”。对编程工具来说，旧对话里的代码片段可能已经过期，把写入检查交给程序能够减少这类误覆盖。[项目工具上下文](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/types.ts)，[会话恢复入口](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/cli.ts)

Three.js 的资源清理要求、Python 的异步边界和 API 约定，则通过规则进入系统提示词。它们让模型知道实现应满足什么要求。是否可以运行命令、读取哪个路径、覆盖哪个文件，仍由运行时和工具代码判断。命令得到批准后，以当前用户的系统权限运行，这个项目采用的进程内工具组合需要应用自己承担执行范围设计。[项目规则组装](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/rules/index.ts#L125)，[命令工具定义](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/tools/index.ts)

同一批工具按 `maxParallelToolCalls: 1` 顺序执行，也是这个应用的明确选择。编程任务经常涉及先读、后改、再检查，文件读取状态还会影响覆盖条件。当前实现优先让这些状态变化容易追踪。固定版本 DSH 支持并行安全调用的有界调度，具体并发策略应结合工具的副作用判断。[固定版本 AgentLoop 配置](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/packages/core/agent-loop/README.zh.md)

## 取消后怎样收尾

工具执行后，结果会进入 `tool/result`。这条记录使下一次请求能把“模型要求做什么”和“程序实际返回什么”关联起来。它也解释了为什么取消需要认真处理。若模型同批请求两个操作，用户在第一个操作运行期间取消，剩余调用仍要获得明确结果，否则保存后的历史会留下悬空的工具请求。

固定版本 DSH 的调度器收到取消后，会停止启动后续调用，等待已经启动的调用结束，并为跳过的调用记录错误结果。步骤内部发生调度错误时，也有缺失结果恢复逻辑。工具主体需要响应或转发 `AbortSignal`，并在自己持有的工作结束后才返回。[固定版本工具调度源码](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/packages/core/agent-loop/src/tool-calls.ts)，[工具结果恢复源码](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/packages/core/session/src/repair.ts)

项目在 `finally` 中继续等待 `whenIdle()`，投影和保存消息，然后释放 Agent 句柄与 Cordis 生命周期。这样保存下来的结果才有机会反映已经结束的工具。这里还需要承认副作用本身的性质。文件一旦写入，取消只能终止后续工作，恢复记录要准确描述已经发生的事情。进程被强制终止时，JavaScript 的清理逻辑也受操作系统中断边界影响。[项目清理顺序](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts#L255)

终端显示和保存文件也可能失败。项目对 `onEvent` 的异常单独留存，并取消当前 Agent，结束时把异常交还调用者。上一批工具结束后，下一次模型请求前还会先保存投影，保存失败就停止继续推进。这些安排让界面、持久化和执行过程保持可追踪的先后关系。排查任务为何中断时，可以分别检查模型错误、工具结果和应用回调。[项目事件回调处理](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts#L78)，[保存失败测试](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/tests/dsh.test.ts)

## 会话恢复与请求预算

说到恢复，就要看清这个项目采用的存储方式。DSH 的 `SessionStore` 维护追加式事件，`deriveMessages()` 从记录中派生模型历史，磁盘持久化需要额外接入后端。本项目每次用户任务创建一个新的 DSH 运行时，已经保存的 Session v1 历史留作 Provider 请求前缀，当前任务的 DSH 消息再投影回 v1 文件。[固定版本 Session 文档](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/packages/core/session/README.zh.md)，[项目投影函数](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts#L90)

因此，追踪本项目最终发给 HTTP 接口的完整请求，需要结合旧历史、当前 DSH 消息，以及桥接层的预算处理。磁盘中的 v1 文件保存用户、助手和工具消息。DSH 当前运行的完整事件记录与它有不同的内容范围。这个适配保留了已有会话格式，也意味着以后接入更多 DSH 事件型插件时，需要继续设计对应的持久化方式。

投影还要保留协议语义。`reasoning_content` 缺失、`null`、空字符串和有内容时，项目会保留各自状态。原始助手消息放在 DSH 的 `replayState.response` 中，回到兼容接口或磁盘格式时再恢复。终端只展示普通 `content`。这种处理让后续工具轮次能够沿用原始协议字段，同时让展示层保持清晰的输入范围。[项目消息投影](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts#L23)，[DSH 内容块与回放类型](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/packages/llm/llm/src/types.ts)

上下文长度也属于项目自己的策略。当前实现用 `JSON.stringify(messages).length` 计算字符预算，超出时逐个移出较早的完整用户轮次，并向模型加入一条说明。当前任务里的工具调用与结果保持完整，本地历史继续保存。单个当前任务仍然过大时，程序会停止并要求缩小任务。字符数量与模型 token 数量存在差异，调整预算时需要考虑所用模型和实际输入内容。[项目 boundContext 实现](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/agent.ts#L22)

单次工具结果还受到 24,000 字符上限约束。过大的结果会变成包含预览与截断提示的 JSON，模型据此缩小读取范围。输出长度控制还会影响文件工具返回了哪些行，因此读取证据只统计已经送回的完整内容。消息预算、工具输出和文件覆盖条件，需要沿同一次调用一起检查。[项目结果大小处理](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/agent.ts#L35)

`maxSteps` 则在模型调用前累计次数，并通过 `agent/pre-step` 阻止下一次请求。假设上限为两次，第二次响应要求执行工具，当前批次仍会完成并保存，随后返回 `max_steps`。如果第二次已经给出最终回答，就返回 `completed`。这个区别直接影响 CLI 应向用户报告什么，也是读框架时应当沿真实控制流核对的细节。[项目步骤限制](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts#L178)

## 怎样验证运行过程

DSH 提供 Agent 驱动、模型适配接口、工具流水线和事件化会话能力。本项目在这些接口上定义 OpenAI 兼容协议、工作区工具、领域规则、审批交互、字符预算和 v1 存储。模型负责提出下一步调用，程序根据当前状态决定能否执行，再把结果交回模型。

本文采用的是核心服务的进程内组合。DSH 官方应用还有 profile 与组合包的启动流程，负责组装更完整的应用能力。选择直接嵌入之后，项目需要维护所选服务的依赖关系和版本适配。固定依赖版本、保留适配层测试，能够让升级时需要重新检查的地方具体到接口和行为。[固定版本应用组装说明](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/docs/architecture.zh.md#应用启动)

检验这种组合时，我会优先看失败路径。项目的 `tests/dsh.test.ts` 挂载真实 DSH 核心服务，用可控的模型返回值检查步骤计数、协议字段、取消等待、保存失败和结果配对。Provider 测试另用本机 HTTP 服务验证 JSON 与 SSE。每组测试能证明的范围都可以顺着实际调用链说明，Three.js 画面和 Python 接口的业务正确性仍需要在目标项目中执行相应验证。[项目 DSH 测试](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/tests/dsh.test.ts)，[项目 Provider 测试](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/tests/provider.test.ts)

对准备自己写 Agent CLI 的前端或全栈开发者，我建议先追踪一个小任务的完整状态。它读取了哪个文件，凭什么获得编辑资格，拒绝怎样进入下一次请求，取消后又留下什么记录。沿着这些问题阅读 `runDshAgent()`，再跳到固定版本的 `AgentLoop` 和 `ToolRuntime`，框架提供的机制与应用需要自己承担的决策就会逐渐清楚。
