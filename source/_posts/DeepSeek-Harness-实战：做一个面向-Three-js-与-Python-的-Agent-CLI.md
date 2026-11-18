---
title: DeepSeek Harness 实战：做一个面向 Three.js 与 Python 的 Agent CLI
date: 2026-11-18 22:05:35
tags:
  - DeepSeek Harness
  - Three.js
  - Python
  - Agent CLI
  - npm
categories:
  - AI 开发
description: 从 npm 安装和模型配置开始，为 Three.js 与 Python 项目接入 web3d-agent-cli，实践规则编写、任务规划、文件编辑与验证。
---

一个 Three.js 页面，切换几次场景以后越来越卡。前端需要检查动画循环、事件监听和 GPU 资源释放，后端又有一个等待上游响应的 Python 接口，迟迟没有结束。把这两段代码交给模型，往往能得到一些建议。真正进入项目时，还需要模型自己找到文件、读懂调用关系、修改实现，再运行项目已有的检查。

运行时与工具调度的实现原理见{% post_link DeepSeek-Harness-原理解析：一次任务如何从模型走到工具执行 'DeepSeek Harness 原理篇' %}。

<!--more-->

这也是 `web3d-agent-cli` 的目标。它把 Three.js 和 Python 后端的开发约定带进终端，让模型通过受控工具操作当前工作区。本文从安装、规则配置和一次真实文件修改讲起，再回到 DSH 的集成代码。项目使用 TypeScript 与 Node.js 22+，固定接入 DeepSeek Harness 核心插件 `0.2.1-rc.5` 和 Cordis `4.0.5`。本文按 CLI `0.1.0` 编写，对应项目源码提交 `c613337`。[项目源码](https://github.com/hujinbin/web3d-agent-cli/tree/c6133371b83f99477fd9278b164babf2279eea5d)

DSH 承担模型与工具之间的循环、会话事件和插件生命周期。这个 CLI 补上终端输入、兼容接口、文件操作、审批和领域规则。模型看到工具定义以后，可以请求读取 `scene.ts`，读取结果进入下一次模型请求，模型再决定编辑文件或继续查找。每次工具执行产生的结果，都会成为后续决策的依据。

<picture>
  <source media="(max-width: 640px)" srcset="/images/deepseek-harness/dsh-practice-flow-mobile.svg">
  <img class="not-gallery-item" src="/images/deepseek-harness/dsh-practice-flow.svg" alt="开发任务、项目规则、DSH AgentLoop、模型与工作区工具的执行流程" loading="lazy" decoding="async">
</picture>

这种结构适合前后端共用一个仓库的项目。场景生命周期、接口字段和资源路径经常需要一起调整，把相关文件放在同一工作区，模型就能沿着实际代码逐步处理。领域规则提前写清楚后，也减少了每次任务重复交代框架、坐标单位和验证方式的成本。

## 安装与配置第一个模型

`web3d-agent-cli@0.1.0` 已发布到 npm。下面的安装命令固定使用这个版本，便于复现本文对应的功能。[npm 包页面](https://www.npmjs.com/package/web3d-agent-cli)

可以全局安装，也可以用 `npx` 临时运行。包名是 `web3d-agent-cli`，安装后的命令叫 `web3d-agent`；第一次启动跟着向导选择接口和模型即可。

```powershell
npm install -g web3d-agent-cli@0.1.0
web3d-agent

# 也可以临时运行
npx web3d-agent-cli@0.1.0
```

源码方式可以直接复现本文对应实现。Python 由目标项目按需准备，CLI 自身通过 Node.js 启动。

```powershell
git clone https://github.com/hujinbin/web3d-agent-cli.git
cd web3d-agent-cli
git checkout c6133371b83f99477fd9278b164babf2279eea5d
npm ci
npm run build
node dist/src/cli.js --help
```

第一次在交互终端启动，会进入模型配置向导。先选择自定义兼容接口、DeepSeek、OpenAI 或本地 Ollama，再输入隐藏显示的 API Key，最后从接口返回的模型列表中选择模型。模型列表请求失败时，仍可以直接填写提供方给出的模型 ID。选择模型以后，CLI 保存用户默认设置，切换到另一个项目也可以复用。[向导实现](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/setup.ts)

聊天中可以继续修改连接和模型。

```text
/model                   查看当前接口的模型列表
/model your-model-id     直接指定模型 ID
/setup                   修改接口地址和 API Key
```

也可以独立执行 `web3d-agent setup`。配置页面属于 CLI 的交互流程，输入的密钥直接交给凭据模块，随后启动普通开发任务。模型列表说明接口返回了哪些 ID，具体模型还需要支持 `tools` / `tool_calls`，才能参与文件操作。

自定义服务填写 API 根地址，例如 `https://gateway.example.com/v1`。程序会补齐 `/chat/completions`，已经带有该后缀的地址也能识别。本机服务可以使用 HTTP，远程连接使用 HTTPS，免认证接口可以留空密钥。脚本运行仍可显式覆盖连接配置。

```powershell
web3d-agent run "解释场景初始化流程" --base-url http://localhost:11434/v1 --model your-model

# 服务没有实现 SSE 时使用 JSON 响应
web3d-agent run "解释场景初始化流程" --no-stream
```

普通设置保存在用户目录的 `.web3d-agent/config.json`。密钥按规范化后的接口地址绑定，切换主机或 API 路径时，会查找新地址对应的凭据。Windows 使用当前用户 DPAPI，macOS 和 Linux 优先调用钥匙串与 Secret Service。系统存储不可用时，回退到用户目录里的 AES-GCM 加密文件，随机主密钥也在该用户目录中，保护能力取决于目录访问权限。Windows 的系统调用通过标准输入接收密钥，命令参数和错误信息中不会拼接密钥。[凭据实现](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/credentials.ts)

## 把项目约定写进规则

先把 CLI 带进一个现有项目。下面假定工作目录为 `E:\projects\web3d-lab`，前端使用 Three.js，后端使用 Python。框架和目录可以沿用项目现状。

```powershell
web3d-agent init -C E:\projects\web3d-lab
web3d-agent chat -C E:\projects\web3d-lab
```

初始化会创建空对象形式的项目配置，以及补充规则模板。已有文件会被保留。一个足够小的目录可以这样组织，`sessions` 在保存会话时生成。

```text
web3d-lab/
├── frontend/src/scene.ts
├── backend/api.py
├── AGENTS.md
├── web3d-agent.json
└── .web3d-agent/
    ├── rules/project.md
    └── sessions/
```

根目录 `AGENTS.md` 和 `.web3d-agent/rules/` 下的 Markdown 文件，会与内置工程、Three.js、Python 规则共同进入系统提示词。项目规则适合写具体约定，例如下面这些内容。

```markdown
# 项目开发规则

- 前端沿用当前 Three.js 集成方式，后端沿用现有 Python 框架。
- 世界坐标以米为单位，Y 轴向上，资源路径沿用当前资源服务。
- 场景卸载需要停止动画、移除监听，独占资源由创建者释放。
- 共享 geometry、material 和 texture 由其所有者统一释放。
- Python 上游请求设置超时，接口错误沿用现有状态码和响应结构。
- 修改前端字段时同步检查后端响应模型。
- 验证使用项目已有脚本，结果中列出实际执行的检查。
```

“所有资源都调用一次 dispose”很容易写，却忽略了共享材质仍被其他场景使用的情况。把资源所有权写进规则，模型才有依据区分组件卸载和全局资源回收。Python 也类似，超时数值需要结合业务，异步路由里的阻塞请求还涉及客户端选择和取消传播，任务描述应保留这些上下文。

规则启动时加载，修改以后重新启动 CLI。可以用 `web3d-agent rules` 或聊天里的 `/rules` 查看来源。希望某个项目单独使用一个模型时，在 `web3d-agent.json` 中只写需要覆盖的字段。实际优先级从高到低为命令行、环境变量、项目配置、用户默认设置和内置默认值，`doctor --json` 能显示模型与地址来自哪里。

保存的凭据与环境变量可以一起使用。启动时先读取 `apiKeyEnv` 指定的变量，再读取 `OPENAI_API_KEY`，最后查找地址绑定的保存凭据。因此，终端已经设置过密钥变量时，需要留意它仍会优先生效。交互配置解决日常切换项目的重复输入，环境变量继续服务于 CI 和临时脚本。需要隔离两套用户设置时，可以用 `WEB3D_CONFIG_DIR` 指定另一处目录。

在请求模型以前，还可以先运行本地检查。这条路径直接检查源码，适合确认 CLI 找到的项目范围。

```powershell
web3d-agent check -C E:\projects\web3d-lab
web3d-agent check -C E:\projects\web3d-lab --json
web3d-agent doctor -C E:\projects\web3d-lab --json
```

`check` 的结果包含文件、行号和匹配证据。例如，某个文件里出现 Three.js 动画调用，却找不到清理线索，会得到资源清理复核建议。Python 文件中同时出现异步定义和阻塞调用，也会进入人工复核范围。输出还记录实际扫描数量、跳过原因和采样上限，便于判断模型接下来需要继续读取哪些文件。`doctor` 则检查运行时与配置，能够看到 DSH 版本、模型和凭据设置状态，执行时不会发送模型任务。

## 先规划，再编辑和验证

处理场景销毁和接口超时，先用只读任务确定问题范围。

```powershell
web3d-agent run "读取 frontend/src/scene.ts 和 backend/api.py，梳理场景挂载、切换和销毁路径，找出动画与资源的所有者，检查 Python 上游请求的超时和阻塞调用，给出修改计划" -C E:\projects\web3d-lab --mode plan
```

`plan` 可以列目录、搜索、读文件和运行内置源码检查，文件修改与外部命令都会被拒绝。它适合先确认模型找对了生命周期入口。接着允许文件编辑，模型就能沿着前一轮发现落实修改。

这里值得把验收条件写进任务。前端可以要求定位谁创建了 renderer、谁启动动画、路由切换时由谁调用清理函数，同时检查迟到的资源加载回调。后端可以要求定位具体的上游客户端、超时设置和异常映射，沿用当前接口的错误结构。这样，模型需要把建议落到调用路径上，读者也更容易评估它给出的计划。

```powershell
web3d-agent run "按计划修复场景销毁与 Python 上游请求超时。沿用现有框架，共享资源由所有者释放，说明修改文件和验证情况" -C E:\projects\web3d-lab --resume latest --mode auto-edit
```

`auto-edit` 会自动批准工作区文件修改，每条外部命令仍需要交互确认。对已经信任的项目，可以在本次运行中允许命令，让模型调用现有构建和测试。

```powershell
web3d-agent run "检查刚才的改动，运行项目已有的前端构建和后端测试，处理失败项。记录未完成的浏览器和 GPU 验证" -C E:\projects\web3d-lab --resume latest --mode auto-edit --allow-run
```

| 模式 | 文件读取 | 文件修改 | 外部命令 |
| --- | --- | --- | --- |
| 默认 `ask` | 直接执行 | 每次询问 | 每次询问 |
| `auto-edit` | 直接执行 | 自动批准 | 每次询问 |
| `plan` | 直接执行 | 拒绝 | 拒绝 |

`--allow-run` 只放开命令执行，`plan` 的只读限制始终优先。命令工具使用 `command` 加 `args` 数组，以 `shell: false` 启动程序。Windows 下执行 npm 脚本，需要明确调用 PowerShell，或者用 Node 启动包管理器的实际 JS 入口。获准运行的外部程序拥有当前用户的文件和网络权限，选择这个参数时需要了解项目脚本会做什么。[工具与执行入口](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/tools/index.ts)

## 复现一次真实文件修改

这几个命令描述了面向真实项目的工作流。仓库里的自动化测试采用更小的文件，便于精确断言工具链是否生效。`scene.ts` 含有 `const pixelRatio = 4;`，`api.py` 含有 `timeout = None`。本机 HTTP 假服务先返回两次读文件调用，再返回两次编辑调用，最后返回结束消息。真实 Node CLI 经过 Provider、DSH 和文件工具，把它们分别改成 `2` 和 `30`。

```text
第 1 次模型请求 → read_file(scene.ts)、read_file(api.py)
第 2 次模型请求 → edit_file(scene.ts)、edit_file(api.py)
第 3 次模型请求 → 最终说明
```

这个用例还检查请求中确实带有七个工具和 Three.js 规则，并用每轮重复的工具 ID 验证适配层的处理。模型响应由测试代码控制，目录、请求、消息与文件修改都真实发生。读者可以在源码目录复现，不需要模型密钥。

```powershell
npm run build
node --test --test-name-pattern "真实 CLI 经本机模型接口" dist/tests/cli.test.js
```

前端像素比和后端超时的断言，证明了读取、精确修改和下一轮请求能够贯通。场景卸载后的 GPU 资源变化，需要在目标项目中反复挂载、切换、卸载并观察。Python 超时行为也要通过项目的客户端和接口测试检查。本文的场景销毁任务给出了使用方法，自动化用例的实际修改范围见上述断言。[完整贯通用例](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/tests/cli.test.ts)

模型是否真正利用了工具结果，可以从第二次请求观察。此时消息中已经带有前一轮读取结果，编辑工具还会检查旧文本与磁盘文件是否一致。修改完成以后，下一次请求又能收到写入结果。测试把这几步固定下来，便于发现“终端打印了工具名，文件却没有变化”之类的接线错误。日常开发时，终端中的工具开始、结束和错误信息，也提供了同样的观察入口。

## 把现有工具接到 DSH

打开运行时代码，DSH 的接入由一个 Cordis Context 开始。模型、会话、消息投影、系统提示词、工具、Agent 注册和循环分别作为插件挂载。以下是源码中的关键连接，省略了事件处理和清理代码。

```typescript
await ctx.plugin(LlmRuntime);
await ctx.plugin(SessionStore);
await ctx.plugin(SessionProjectionRegistry);
await ctx.plugin(SystemPrompt);
await ctx.plugin(ToolRuntime, { mode: 'native' });
await ctx.plugin(AgentRegistry);
await ctx.plugin(AgentLoop, { agents: [], maxParallelToolCalls: 1 });

ctx.llm.registerAdapter(['web3d'], new ProviderBridge());
ctx.systemPrompt.section({
  name: 'web3d', order: 0, text: options.systemPrompt, complete: true,
});
```

`ProviderBridge` 继承 DSH 的 `LlmAdapter`，把 DSH 请求转换成项目已有的 `ModelProvider.complete()` 调用，再将普通文本、思考内容和工具调用映射回 DSH 内容块。网络层处理 OpenAI 兼容的 JSON 或 SSE，工具参数会先完整组装并校验。`finish_reason` 为 `length` 或 `content_filter`、缺少有效的 `finish_reason`，以及 SSE 缺少结束标记或完成原因时，本轮工具调用都会被拒绝，避免把半截参数交给文件系统。[运行时适配](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/src/runtime/dsh.ts)

已有工具继续保留名称、JSON Schema、`kind` 和执行函数。适配层通过 `ctx.tools.register()` 注册它们，在 `tools/pre-execute` 中检查只读模式和审批，再把工作目录、取消信号、文件读取状态交给实际工具。工具并发数固定为一，读取、编辑和校验按顺序推进，减少文件状态相互覆盖的复杂度。

当前七个工具覆盖列目录、读文件、文字搜索、创建文件、精确编辑、运行命令和项目检查。新增业务能力时，可以沿用这个接口，例如接入项目已有的场景清单校验器，返回结构化结果供模型继续判断。工具的 `kind` 要按真实副作用填写，是否允许执行由运行时判断。项目 Markdown 规则负责说明约定，审批和路径检查在工具入口落实。

文件工具记录完整读取时的 SHA-256，修改前检查文件有没有被其他程序改过。大文件需要按 `nextOffset` 翻页，同一版本全部行都返回以后，才能取得完整读取状态。恢复会话后重新读文件，也就能够基于当前磁盘状态编辑。这个约束很适合编辑器、Git 操作和 Agent 同时参与开发的情况。

DeepSeek 的 `reasoning_content` 也需要保留。Provider 收集这个字段，适配层将完整原始消息放入 DSH 的回放元数据，保存会话和构造下一轮请求时再恢复。终端显示普通正文，后续工具轮保留协议所需的思考字段。直接丢弃该字段可能破坏接口兼容，这也是适配层需要认真处理的部分。

## 恢复会话与自动化运行

会话放在目标项目的 `.web3d-agent/sessions/<UUID>.json`，每轮保存都检查工具调用与结果的对应关系。任务执行期间按 Ctrl+C，会通过同一个取消信号终止网络或命令执行。运行时等待当前工具收敛，为尚未完成的调用保存中断结果，再释放 Context。已经完成的文件修改会保留，继续之前应查看工作区差异。

```powershell
web3d-agent sessions -C E:\projects\web3d-lab
web3d-agent chat -C E:\projects\web3d-lab --resume latest
web3d-agent run "读取当前文件，继续处理未完成项" -C E:\projects\web3d-lab --resume latest
```

聊天里也可以使用 `/sessions`、`/resume latest` 和 `/new`。请求超出字符预算时，适配层只移出较早的完整用户轮次，本地历史继续保留。当前单个任务已经过大时会停止，需要缩小任务或开始新会话。

自动化场景使用 `run --json` 获取 JSONL 事件。在非交互终端或 `--json` 模式下，需要询问批准的操作会被拒绝，并作为工具错误返回模型。允许自动修改文件需要显式使用 `--mode auto-edit`，允许外部命令需要 `--allow-run`。`plan` 的只读限制始终优先，即使同时传入 `--allow-run`，也会拒绝文件修改和外部命令。

集成脚本可以同时检查事件和退出码。`0` 表示执行循环正常结束，`1` 表示配置或运行错误，`2` 表示达到模型调用轮次上限，`130` 表示取消。是否通过前端构建和 Python 测试，仍要读取对应工具输出。任务中有用户拒绝或测试失败时，保留这些结果也能帮助下一次继续处理。

持久化继续使用项目自己的 Session v1 格式。每次用户任务会建立一份进程内 DSH 会话，结束后将消息投影回本地文件，下次任务再带入历史。这样既能沿用已有文件，也保留了兼容接口的原始消息字段。使用 DSH 的更多插件时，还需要为新增状态确定保存与恢复方式。遇到工具报错或用户拒绝，错误结果也会返回模型，由下一轮决定调整计划还是结束。

## 构建可独立安装的命令

最后还要让 npm 安装出来的命令可以独立工作。构建先执行 TypeScript 编译，再用 esbuild 将 CLI、DSH 和其实际使用的依赖编入 ESM 入口。构建脚本检查产物的外部引用，仅允许 Node 内建模块。DSH 内部读取自身包版本的位置也需要固化，避免单文件移动以后查错 `package.json`。发布包随带第三方许可证，DSH 依赖作为构建依赖维护。[构建脚本](https://github.com/hujinbin/web3d-agent-cli/blob/c6133371b83f99477fd9278b164babf2279eea5d/scripts/build-cli.mjs)

这一步有独立目录测试支撑。测试把构建入口复制到临时目录，启动 DSH，执行离线 `list_files` 和 `check_project`，确认命令能够脱离项目依赖启动。开发时可以依次运行下面的检查，查看类型、行为和发布文件清单。

```powershell
npm run typecheck
npm test
npm pack --dry-run
```

当前验证覆盖了本机假 HTTP 接口、真实文件修改、工具审批、会话恢复、取消和 Windows DPAPI。macOS 钥匙串与 Linux Secret Service 已验证命令协议，对应系统的实际读写仍待补充。离线 `--demo` 使用固定脚本决定调用哪些工具，`check` 提供带路径和行号的源码线索。连接自己的模型以后，可以从 `plan` 小任务开始，检查工具参数、修改差异和项目测试输出，再逐步扩大允许执行的范围。
