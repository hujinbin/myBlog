---
title: 从零打造一个跨框架通用的 AI Agent 插件
date: 2025-12-25 22:02:45
tags: ['AI Agent', '前端开发', '跨框架组件', 'TypeScript', 'UMD']
---


## 📝 前言

在 AI 大模型时代，越来越多的 Web 应用需要集成智能对话功能。然而，前端技术栈的多样性（Vue、React、jQuery 等）给开发者带来了一个难题：如何开发一个**一次编写、到处运行**的 AI 对话插件？

本文记录了 AI Agent Plugin 项目从诞生到完成的全过程，分享技术选型、架构设计、核心实现以及遇到的挑战与解决方案。

***

## 🎯 项目背景与目标

### 痛点分析

在实际项目中，我们遇到以下问题：

1.  **技术栈碎片化**：公司不同项目使用 Vue 2、Vue 3、React、jQuery 等不同技术栈
2.  **重复开发成本高**：每个技术栈都要单独开发一套 AI 对话组件
3.  **维护困难**：功能更新需要同步修改多个版本
4.  **样式冲突**：插件样式容易被宿主项目覆盖

### 设计目标

基于以上痛点，我们确定了以下核心目标：

*   ✅ **跨框架兼容**：一套代码支持 Vue、React、jQuery 等任意前端框架
*   ✅ **零依赖**：不依赖任何第三方框架，纯原生实现
*   ✅ **样式隔离**：避免与宿主项目样式冲突
*   ✅ **TypeScript 支持**：提供完整的类型定义
*   ✅ **主题定制**：支持浅色/深色主题和自定义配色
*   ✅ **灵活配置**：支持流式/普通响应、四角定位等

***

## 🏗️ 技术选型与架构设计

### 1. 模块化规范：UMD

为了实现跨框架兼容，我们选择了 **UMD (Universal Module Definition)** 规范：

```javascript
// UMD 模式可以同时支持多种加载方式
// 1. AMD (RequireJS)
// 2. CommonJS (Node.js)
// 3. 全局变量 (浏览器直接引入)
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory); // AMD
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(); // CommonJS
    } else {
        root.AIAgent = factory(); // 全局变量
    }
}(typeof self !== 'undefined' ? self : this, function () {
    // 插件代码
}));
```

通过 Webpack 的 `output.library` 配置，我们可以自动生成 UMD 格式的代码：

```javascript
// webpack.config.js
output: {
  filename: 'ai-agent.js',
  path: path.resolve(__dirname, 'dist'),
  library: {
    name: 'AIAgent',
    type: 'umd',
    export: 'default'
  },
  globalObject: 'this'
}
```

### 2. 开发语言：TypeScript

使用 TypeScript 开发带来的优势：

1.  **类型安全**：编译时捕获错误，减少运行时 bug
2.  **智能提示**：IDE 提供完整的代码提示和自动补全
3.  **可维护性**：接口定义即文档，代码意图清晰

核心类型定义：

```typescript
export interface AIAgentOptions {
  host?: string;              // 后端域名
  secret?: string;            // API 密钥
  stream?: boolean;           // 流式响应
  theme?: 'light' | 'dark';   // 主题
  colors?: {                  // 自定义配色
    primary?: string;
    background?: string;
    text?: string;
    aiMessageBg?: string;
    // ... 更多颜色配置
  };
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  placeholder?: string;
  title?: string;
}
```

### 3. 样式隔离：命名空间 + CSS 变量

为了避免样式冲突，我们采用了两种策略：

**策略一：命名空间隔离**

所有 CSS 类名添加 `ai-agent-` 前缀：

```css
.ai-agent-panel { /* 面板 */ }
.ai-agent-btn { /* 按钮 */ }
.ai-agent-msg { /* 消息 */ }
```

**策略二：CSS 变量动态主题**

使用 CSS 变量实现主题定制：

```css
:root {
  --ai-agent-primary: #4096ff;
  --ai-agent-primary-hover: #2e80ff;
  --ai-agent-bg: #ffffff;
  --ai-agent-text: #333333;
  /* ... 更多变量 */
}

/* 浅色主题 */
.ai-agent-theme-light {
  --ai-agent-bg: #ffffff;
  --ai-agent-text: #333333;
}

/* 深色主题 */
.ai-agent-theme-dark {
  --ai-agent-bg: #1e1e1e;
  --ai-agent-text: #f0f0f0;
}
```

通过 JavaScript 动态注入自定义颜色：

```typescript
private injectStyles(): void {
  const style = document.createElement('style');
  let colorVars = '';
  
  if (this.options.colors) {
    if (this.options.colors.primary) {
      colorVars += `--ai-agent-primary: ${this.options.colors.primary};\n`;
    }
    // ... 注入更多颜色变量
  }
  
  style.textContent = `
    ${colorVars ? `.ai-agent-theme-${this.options.theme} {\n${colorVars}}` : ''}
  `;
  
  document.head.appendChild(style);
}
```

***

## 🔧 核心功能实现

### 1. 插件生命周期管理

```typescript
class AIAgent {
  constructor(options: AIAgentOptions) {
    // 1. 参数验证
    this.validateOptions(options);
    
    // 2. 配置合并
    this.options = { /* 默认配置 + 用户配置 */ };
    
    // 3. 计算端点 URL
    this.endpoints = this.calculateEndpoints();
    
    // 4. 初始化 UI
    this.init();
  }
  
  private init(): void {
    this.createTriggerButton();  // 创建触发按钮
    this.createChatPanel();      // 创建对话面板
    this.injectStyles();         // 注入样式
  }
  
  public destroy(): void {
    // 清理 DOM 元素
    if (this.buttonEl) this.buttonEl.remove();
    if (this.panelEl) this.panelEl.remove();
    
    // 清理事件监听器
    // 清理内存引用
    this.chatHistory = [];
  }
}
```

### 2. 双模式 API 调用

插件支持**普通模式**和**流式模式**两种 API 调用方式：

**普通模式（一次性返回）**

```typescript
private async sendNormalMessage(text: string): Promise<void> {
  const response = await fetch(this.endpoints.completion, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.options.secret}`
    },
    body: JSON.stringify({
      content: text,
      messages: this.chatHistory
    })
  });
  
  const data: ApiResponse = await response.json();
  this.appendMessage(data.data.content, 'ai');
}
```

**流式模式（SSE 实时推送）**

```typescript
private async sendStreamMessage(text: string): Promise<void> {
  const response = await fetch(this.endpoints.stream, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.options.secret}`
    },
    body: JSON.stringify({
      messages: this.chatHistory
    })
  });
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let aiMessage = '';
  
  const messageEl = this.createMessageElement('', 'ai');
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        aiMessage += data.content;
        messageEl.textContent = aiMessage;
      }
    }
  }
}
```

### 3. 智能端点路由

根据配置自动选择合适的 API 端点：

```typescript
private calculateEndpoints() {
  const baseHost = this.options.host || 'http://localhost:8080';
  const normalize = (path: string) => 
    baseHost.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
  
  const chatBase = normalize('api/ai/chat');
  
  return {
    completion: chatBase + '/completion',  // 普通模式
    stream: chatBase + '/stream',          // 流式模式
    streamSimple: chatBase + '/stream-simple',
    streamConfig: chatBase + '/stream-config',
    session: normalize('api/ai/session'),
    platforms: normalize('api/ai/platforms'),
    fileExtraction: normalize('api/ai/file/extraction')
  };
}

private sendMessage(text: string): void {
  if (this.options.stream) {
    this.sendStreamMessage(text);  // 流式模式
  } else {
    this.sendNormalMessage(text);  // 普通模式
  }
}
```

***

## 🎨 主题定制系统

### 渐进式主题方案

我们设计了三层主题定制方案：

**第一层：预设主题**

```javascript
new AIAgent({
  theme: 'light'  // 或 'dark'
});
```

**第二层：自定义颜色**

```javascript
new AIAgent({
  theme: 'light',
  colors: {
    primary: '#ff6b6b',      // 主色调
    background: '#f0f0f0',   // 背景色
    text: '#2c3e50'          // 文本颜色
  }
});
```

**第三层：完整配色方案**

```javascript
new AIAgent({
  colors: {
    primary: '#ff6b6b',
    primaryHover: '#ff5252',
    background: '#f0f0f0',
    text: '#2c3e50',
    border: '#e0e0e0',
    aiMessageBg: '#e8f5e9',
    userMessageBg: '#ff6b6b',
    headerBg: '#fafafa'
  }
});
```

### CSS 变量的优势

使用 CSS 变量而非直接修改样式的好处：

1.  **性能更好**：浏览器原生支持，无需 JavaScript 逐个修改元素
2.  **优先级明确**：CSS 变量继承机制清晰
3.  **响应式支持**：可以配合媒体查询实现响应式主题
4.  **易于维护**：修改一处，全局生效

***

## 🚀 打包与发布

### Webpack 多产物输出

为了满足不同场景的需求，我们配置了三种输出格式：

```javascript
// webpack.config.js
module.exports = [
  // 1. UMD 格式（未压缩）
  {
    output: {
      filename: 'ai-agent.js',
      library: { name: 'AIAgent', type: 'umd' }
    }
  },
  // 2. UMD 格式（压缩）
  {
    output: {
      filename: 'ai-agent.min.js',
      library: { name: 'AIAgent', type: 'umd' }
    },
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin()]
    }
  },
  // 3. ESM 格式（现代构建工具）
  {
    output: {
      filename: 'ai-agent.esm.js',
      library: { type: 'module' }
    },
    experiments: {
      outputModule: true
    }
  }
];
```

### TypeScript 类型声明

使用 `ts-loader` 自动生成类型声明文件：

```javascript
module: {
  rules: [
    {
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/
    }
  ]
}
```

生成的类型文件结构：

    dist/
    ├── ai-agent.js           # UMD 格式（未压缩）
    ├── ai-agent.min.js       # UMD 格式（压缩）
    ├── ai-agent.esm.js       # ESM 格式
    └── types/
        ├── ai-agent.d.ts     # 主入口类型声明
        └── types/
            └── index.d.ts    # 类型定义

### NPM 包配置

```json
{
  "name": "ai-agent-plugin",
  "version": "0.0.1",
  "main": "dist/ai-agent.js",           // CommonJS 入口
  "module": "dist/ai-agent.esm.js",     // ESM 入口
  "types": "dist/types/ai-agent.d.ts",  // TypeScript 类型
  "files": [
    "dist/",
    "README.md",
    "LICENSE"
  ]
}
```

***

## 🎯 跨框架使用实践

### 1. jQuery 项目

```html
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="path/to/ai-agent.min.js"></script>

<script>
$(document).ready(function() {
  const aiAgent = new AIAgent({
    host: 'http://localhost:8080',
    secret: 'your-api-key',
    theme: 'light'
  });
});
</script>
```

### 2. React 项目

```jsx
import React, { useEffect } from 'react';
import AIAgent from 'ai-agent-plugin';

function App() {
  useEffect(() => {
    const aiAgent = new AIAgent({
      host: 'http://localhost:8080',
      secret: process.env.REACT_APP_AI_SECRET,
      theme: 'dark',
      stream: true
    });
    
    return () => aiAgent.destroy();
  }, []);

  return <div>My App</div>;
}
```

### 3. Vue 3 项目

```vue
<template>
  <div>My App</div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import AIAgent from 'ai-agent-plugin';

let aiAgent = null;

onMounted(() => {
  aiAgent = new AIAgent({
    host: 'http://localhost:8080',
    secret: import.meta.env.VITE_AI_SECRET,
    position: 'bottom-left',
    colors: {
      primary: '#42b883'  // Vue 绿
    }
  });
});

onUnmounted(() => {
  aiAgent?.destroy();
});
</script>
```

***

## 🐛 踩坑与解决方案

### 问题 1：TypeScript 类型不兼容

**现象**：使用 `Required<AIAgentOptions>` 导致可选属性变必选

```typescript
// ❌ 错误写法
private options: Required<AIAgentOptions>;

// 构建报错：colors 是可选的，但 Required 让它变成必选
this.options = {
  host: '...',
  secret: '...',
  // colors 未提供，报错！
};
```

**解决方案**：直接使用原接口类型

```typescript
// ✅ 正确写法
private options: AIAgentOptions;
```

### 问题 2：端口占用导致开发服务器无法启动

**现象**：`Error: listen EADDRINUSE: address already in use :::9000`

**解决方案**：PowerShell 脚本清理占用端口

```powershell
# 查找并停止占用 9000 端口的进程
Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue | 
  Select-Object -ExpandProperty OwningProcess | 
  ForEach-Object { Stop-Process -Id $_ -Force }
```

### 问题 3：CSS 变量在 IE 中不生效

**现象**：IE 11 不支持 CSS 变量

**解决方案**：提供回退方案

```css
.ai-agent-btn {
  background: #4096ff;                    /* 回退值 */
  background: var(--ai-agent-primary);    /* CSS 变量 */
}
```

或者使用 PostCSS 插件自动生成回退：

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-custom-properties')({
      preserve: false  // 移除 CSS 变量，只保留回退值
    })
  ]
};
```

### 问题 4：流式响应解析错误

**现象**：SSE 数据格式不规范导致解析失败

**解决方案**：增强容错处理

```typescript
for (const line of lines) {
  if (!line.trim() || !line.startsWith('data: ')) continue;
  
  try {
    const jsonStr = line.slice(6).trim();
    if (jsonStr === '[DONE]') break;  // 结束标记
    
    const data = JSON.parse(jsonStr);
    if (data.content) {
      aiMessage += data.content;
    }
  } catch (err) {
    console.warn('解析 SSE 数据失败:', line, err);
  }
}
```

***

## 📊 性能优化

### 1. 代码分割与按需加载

虽然插件本身较小（\~20KB），但仍可优化：

```typescript
// 懒加载 Markdown 渲染库
private async renderMarkdown(text: string): Promise<string> {
  const { marked } = await import('marked');
  return marked(text);
}
```

### 2. 防抖与节流

输入框添加防抖，避免频繁触发：

```typescript
private handleInput = debounce((text: string) => {
  // 处理输入
}, 300);

function debounce(fn: Function, delay: number) {
  let timer: number;
  return function(...args: any[]) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

### 3. 虚拟滚动（未来规划）

对话消息过多时，使用虚拟滚动：

```typescript
// 只渲染可视区域的消息
private renderVisibleMessages() {
  const scrollTop = this.messagesEl.scrollTop;
  const visibleHeight = this.messagesEl.clientHeight;
  
  const startIndex = Math.floor(scrollTop / MESSAGE_HEIGHT);
  const endIndex = Math.ceil((scrollTop + visibleHeight) / MESSAGE_HEIGHT);
  
  return this.chatHistory.slice(startIndex, endIndex);
}
```

***

## 🔮 未来规划

### 短期目标（v0.1.0）

*   [ ] 支持 Markdown 渲染
*   [ ] 代码高亮显示
*   [ ] 消息历史持久化（LocalStorage）
*   [ ] 消息重发/编辑功能
*   [ ] 多语言支持（i18n）

### 中期目标（v0.2.0）

*   [ ] 语音输入/输出
*   [ ] 文件上传（图片、文档）
*   [ ] 多会话管理
*   [ ] 自定义快捷指令
*   [ ] WebSocket 支持

### 长期目标（v1.0.0）

*   [ ] 插件市场（第三方扩展）
*   [ ] AI 能力扩展（绘画、搜索、代码执行）
*   [ ] 团队协作功能
*   [ ] 移动端适配（React Native）
*   [ ] Electron 桌面应用

***

## 💡 经验总结

### 技术层面

1.  **选择合适的模块化规范**：UMD 确实能实现跨框架兼容
2.  **TypeScript 提升开发体验**：类型安全减少 80% 的运行时错误
3.  **CSS 变量是主题定制的最佳实践**：灵活、高效、易维护
4.  **流式响应提升用户体验**：实时反馈比加载动画更友好

### 工程层面

1.  **文档优先**：README 写得好，issue 减少一半
2.  **示例丰富**：提供 jQuery/React/Vue 示例，降低使用门槛
3.  **语义化版本**：严格遵循 SemVer，避免破坏性更新
4.  **自动化测试**（规划中）：保证多框架环境下的稳定性

### 产品层面

1.  **保持简单**：不要过度设计，先满足核心需求
2.  **渐进增强**：功能分层，让用户自由选择
3.  **用户反馈驱动**：根据 issue 和 PR 优化功能
4.  **社区运营**：开源项目需要持续的社区互动

***

## 🙏 致谢

感谢以下开源项目的启发：

*   [marked](https://github.com/markedjs/marked) - Markdown 解析器
*   [highlight.js](https://github.com/highlightjs/highlight.js) - 代码高亮
*   [webpack](https://webpack.js.org/) - 现代化构建工具

感谢所有给项目提 issue 和 PR 的开发者！

***

## 📚 参考资料

*   [UMD 模块规范](https://github.com/umdjs/umd)
*   [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
*   [CSS Variables (Custom Properties)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
*   [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
*   [Webpack Output Configuration](https://webpack.js.org/configuration/output/)

***

## 结语

从零打造一个跨框架通用插件是一次有趣的技术实践，它让我们深入理解了：

*   模块化规范的本质
*   TypeScript 的工程化价值
*   CSS 架构的设计思想
*   前端构建工具的工作原理

希望这篇文章能给正在开发跨框架组件的开发者一些启发。如果你有任何问题或建议，欢迎在 [GitHub](https://github.com/hujinbin/ai-agent) 上提 issue 讨论！

**项目地址**：<https://github.com/hujinbin/ai-agent>\
**NPM 包**：`npm install ai-agent-plugin`\
**开源协议**：MIT License

***

**觉得有帮助？给个 ⭐ Star 吧！**
