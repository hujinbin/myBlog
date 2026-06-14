---
title: 深入理解 Model Context Protocol：从零构建 AI 知识库服务
date: 2026-01-23 22:21:48
tags: [AI, MCP, Server, Node.js]
---


# 深入理解 Model Context Protocol：从零构建 AI 知识库服务

> 本文通过一个真实的 MCP Server 项目，详细介绍 Model Context Protocol 的核心概念、架构设计和最佳实践。

## 引言：AI 交互的新范式

在与 ChatGPT、Claude 等 AI 助手交互时，我们常常遇到一个问题：AI 无法访问我们的私有数据、企业知识库或实时信息。虽然 RAG（Retrieval-Augmented Generation）技术提供了一种解决方案，但实现起来往往需要复杂的向量数据库、Embedding 模型和检索系统。

**Model Context Protocol (MCP)** 提供了一个更加优雅的解决方案——一个开放的标准协议，让 AI 应用能够安全、可控地访问外部数据源和工具。

## 什么是 MCP？

Model Context Protocol（模型上下文协议）是由 Anthropic 推出的开放标准，用于连接 AI 应用与外部数据源。它的核心思想很简单：

    AI 应用 ←→ MCP 协议 ←→ MCP Server ←→ 数据源

**核心优势：**

1.  **标准化通信**：统一的协议规范，无需为每个 AI 应用单独开发接口
2.  **工具化能力**：将复杂的数据查询封装为简单的工具调用
3.  **安全可控**：Server 端控制数据访问权限和范围
4.  **可扩展性**：轻松添加新的数据源和功能

## 实战：构建一个知识库 MCP Server

让我以一个真实项目为例——**Jue 知识库 MCP Server**，展示如何从零构建一个功能完整的 MCP 服务。

### 项目架构

    Claude Desktop / AI Agent
          ↓
       MCP Protocol (stdio)
          ↓
       MCP Server (Node.js)
        ├── Tools Router         # 工具路由
        ├── Services Layer       # 业务逻辑层
        │   ├── articleService   # 文章服务
        │   ├── userService      # 用户服务
        │   └── analyticsService # 分析服务
        └── HTTP Client          # 远程 API 调用

### 第一步：初始化 MCP Server

首先安装 MCP SDK：

```bash
npm install @modelcontextprotocol/sdk dotenv
```

创建服务器实例：

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// 创建 MCP 服务器
const server = new Server(
  {
    name: 'jue-knowledge-base',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},  // 声明支持工具能力
    },
  }
);
```

**关键点：**

*   使用 `StdioServerTransport` 进行标准输入输出通信
*   MCP 采用 JSON-RPC 协议进行消息传递
*   服务器通过 stdio 与 AI 应用通信，无需网络端口

### 第二步：定义工具（Tools）

MCP 的核心概念是"工具"——AI 可以调用的函数。每个工具需要定义：

1.  **名称**（name）：工具的唯一标识符
2.  **描述**（description）：告诉 AI 这个工具能做什么
3.  **参数模式**（inputSchema）：使用 JSON Schema 定义参数

示例：定义"按作者搜索文章"工具：

```javascript
const TOOLS = [
  {
    name: 'search_articles_by_author',
    description: '根据作者昵称或用户ID查找该作者发表的所有文章，支持分页',
    inputSchema: {
      type: 'object',
      properties: {
        author: {
          type: 'string',
          description: '作者的昵称或用户ID',
        },
        page: {
          type: 'number',
          description: '页码，默认为1',
          default: 1,
        },
        limit: {
          type: 'number',
          description: '每页数量，默认为20',
          default: 20,
        },
        sortBy: {
          type: 'string',
          enum: ['latest', 'popular', 'views'],
          description: '排序方式: latest(最新), popular(最受欢迎), views(阅读量)',
          default: 'latest',
        },
      },
      required: ['author'],
    },
  },
];
```

**设计技巧：**

*   描述要清晰明确，让 AI 能理解何时使用这个工具
*   使用 `enum` 限制参数值范围，避免无效调用
*   合理设置 `default` 值，简化 AI 的调用
*   标注 `required` 字段，确保必要参数不缺失

### 第三步：注册请求处理器

MCP Server 需要处理两类请求：

#### 1. 工具列表请求（List Tools）

当 AI 需要知道有哪些可用工具时：

```javascript
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});
```

#### 2. 工具调用请求（Call Tool）

当 AI 实际调用某个工具时：

```javascript
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_articles_by_author': {
        const result = await articleService.searchByAuthor(
          args.author,
          args.page || 1,
          args.limit || 20,
          args.sortBy || 'latest'
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      // ... 其他工具的处理逻辑
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            stack: error.stack,
          }),
        },
      ],
      isError: true,
    };
  }
});
```

**最佳实践：**

*   使用 `switch` 语句清晰地路由不同的工具调用
*   统一的错误处理，返回结构化的错误信息
*   返回 JSON 格式数据，便于 AI 理解和处理

### 第四步：实现业务逻辑层

将数据获取逻辑封装到独立的服务模块：

```javascript
// services/articleService.js
import * as http from './httpClient.js';

export async function searchByAuthor(author, page = 1, limit = 20, sortBy = 'latest') {
  try {
    // 1. 获取用户信息
    const userData = await http.get('/view/users', {});
    const user = userData.users.find(u => 
      u.nickname.toLowerCase().includes(author.toLowerCase()) || 
      u._id === author
    );

    if (!user) {
      return {
        success: false,
        message: '未找到该作者',
        data: [],
      };
    }

    // 2. 获取文章列表
    const articleData = await http.get('/user/getArticleList', {
      userId: user._id,
      page,
    });

    // 3. 排序处理
    let articles = articleData || [];
    switch (sortBy) {
      case 'popular':
        articles.sort((a, b) => (b.likeNum || 0) - (a.likeNum || 0));
        break;
      case 'views':
        articles.sort((a, b) => (b.readNum || 0) - (a.readNum || 0));
        break;
      case 'latest':
      default:
        articles.sort((a, b) => 
          new Date(b.meta?.updatedAt || 0) - new Date(a.meta?.updatedAt || 0)
        );
        break;
    }

    return {
      success: true,
      data: {
        author: {
          id: user._id,
          nickname: user.nickname,
          headImg: user.headImg,
          articleNum: user.articleNum,
          totalLikes: user.like,
        },
        articles: articles.slice(0, limit),
        pagination: {
          page,
          limit,
          total: articles.length,
          pages: Math.ceil(articles.length / limit),
        },
      },
    };
  } catch (error) {
    console.error('searchByAuthor error:', error);
    return {
      success: false,
      message: error.message,
      data: [],
    };
  }
}
```

**架构优势：**

*   **分层清晰**：MCP Server 只负责协议处理，业务逻辑在 Service 层
*   **易于测试**：Service 函数可以独立单元测试
*   **可复用**：业务逻辑可以被其他接口复用

### 第五步：HTTP 客户端封装

为了访问远程 API，我们需要一个简洁的 HTTP 客户端：

```javascript
// services/httpClient.js
const BASE_URL = 'https://jue.leheavengame.com/api';

async function request(method, path, data = null) {
  const url = `${BASE_URL}${path}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'MCP-Server/1.0',
    },
  };

  if (data && method === 'GET') {
    const params = new URLSearchParams(data);
    const fullUrl = `${url}?${params}`;
    const response = await fetch(fullUrl, options);
    return await handleResponse(response);
  } else if (data) {
    options.body = JSON.stringify(data);
    const response = await fetch(url, options);
    return await handleResponse(response);
  }
  
  const response = await fetch(url, options);
  return await handleResponse(response);
}

async function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (result.code !== 200) {
    throw new Error(result.message || 'API request failed');
  }
  
  return result.data;
}

export async function get(path, params = null) {
  return request('GET', path, params);
}

export async function post(path, data = null) {
  return request('POST', path, data);
}
```

**设计考虑：**

*   统一的错误处理和响应格式
*   自动处理 GET 参数和 POST body
*   添加自定义 User-Agent 标识

### 第六步：启动 MCP Server

```javascript
async function main() {
  try {
    console.error('🚀 Jue MCP Server starting...');
    console.error('📡 Using API endpoint: https://jue.leheavengame.com/api');

    // 创建 stdio 传输层
    const transport = new StdioServerTransport();
    
    // 连接服务器和传输层
    await server.connect(transport);
    
    console.error('✅ Jue MCP Server running on stdio');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.error('\n⏹️  Shutting down...');
  process.exit(0);
});

main();
```

**注意事项：**

*   日志输出使用 `console.error`，因为 `stdout` 用于 MCP 通信
*   监听 `SIGINT` 信号，实现优雅关闭
*   使用 async/await 处理异步操作

## 配置 Claude Desktop 使用 MCP Server

### 1. 配置文件位置

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

### 2. 添加配置

```json
{
  "mcpServers": {
    "jue-knowledge-base": {
      "command": "node",
      "args": ["E:\\D盘\\github\\mcp-server-jue-article\\index.js"]
    }
  }
}
```

### 3. 重启 Claude Desktop

配置完成后重启 Claude，就可以看到新的工具出现在界面上。

## 实际使用场景

### 场景 1：研究作者内容

    用户：帮我查找"张三"写的所有文章，按阅读量排序

    Claude：
    [调用 search_articles_by_author 工具]
    参数：
    - author: "张三"
    - sortBy: "views"
    - limit: 20

    结果：
    找到该作者共发表 25 篇文章，按阅读量排序前 5 篇为：
    1. 《深入理解 React Hooks》- 5.2万阅读
    2. 《前端性能优化实战》- 4.8万阅读
    ...

### 场景 2：内容趋势分析

    用户：分析一下这周的内容表现如何

    Claude：
    [调用 get_content_summary 工具]
    参数：
    - timeRange: "week"

    [调用 get_trending_tags 工具]
    参数：
    - limit: 10

    综合分析：
    本周共产出 156 篇文章，总阅读量达到 280万...
    热门标签包括：前端开发、人工智能、架构设计...

### 场景 3：用户画像分析

    用户：查询用户"李四"的创作情况

    Claude：
    [调用 get_user_stats 工具]
    参数：
    - userId: "李四"

    该用户是活跃创作者：
    - 累计发表：42 篇文章
    - 总阅读量：15.8万
    - 总获赞数：3,200
    - 粉丝数量：580
    - 最热文章：《微服务架构实践》(1.2万阅读)

## 项目中的高级工具设计

### 1. 多参数智能路由

```javascript
{
  name: 'get_article_recommendations',
  description: '根据文章ID或标签获取推荐的相关文章',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'string',
        description: '参考文章ID',
      },
      tagId: {
        type: 'string',
        description: '标签ID（如果不提供articleId）',
      },
      limit: {
        type: 'number',
        description: '推荐数量，默认为5',
        default: 5,
      },
    },
  },
}
```

这个工具展示了灵活的参数设计：

*   支持两种推荐方式：基于文章或基于标签
*   AI 会根据上下文自动选择合适的参数
*   不强制要求所有参数，提高可用性

### 2. 数据分析工具

```javascript
{
  name: 'analyze_engagement',
  description: '分析文章的互动数据，包括点赞、评论、阅读等指标',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'string',
        description: '文章ID',
      },
    },
    required: ['articleId'],
  },
}
```

返回结构化的分析结果：

```javascript
{
  success: true,
  data: {
    article: { ... },
    metrics: {
      views: 5000,
      likes: 200,
      comments: 50
    },
    rates: {
      engagementRate: 5.0,   // 互动率
      likeRate: 4.0,          // 点赞率
      commentRate: 1.0        // 评论率
    },
    performance: {
      isHot: true,            // 是否热门
      isPopular: true,        // 是否受欢迎
      isActive: true          // 是否活跃
    }
  }
}
```

**设计亮点：**

*   不仅返回原始数据，还提供计算后的指标
*   布尔值判断（isHot、isPopular）让 AI 更容易理解
*   结果分层清晰，便于后续处理

### 3. 时间范围过滤

```javascript
{
  name: 'get_top_articles_by_views',
  description: '获取阅读量最高的文章列表，可按标签筛选，可指定时间范围',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: '返回文章数量，默认为10',
        default: 10,
      },
      tagId: {
        type: 'string',
        description: '标签ID，可选，不填则查询所有标签',
      },
      timeRange: {
        type: 'string',
        enum: ['all', 'today', 'week', 'month', 'year'],
        description: '时间范围筛选',
        default: 'all',
      },
    },
  },
}
```

使用 `enum` 提供预定义的时间范围选项，AI 能够理解用户的自然语言意图（"本周"、"最近一个月"）并映射到正确的参数值。

## MCP vs RAG：何时选择哪种方案？

| 维度        | MCP                 | RAG                     |
| --------- | ------------------- | ----------------------- |
| **适用场景**  | 结构化数据查询、API 调用、工具集成 | 非结构化文本、语义搜索、知识库问答       |
| **实现复杂度** | 低（无需向量化）            | 高（需要 Embedding + 向量数据库） |
| **数据实时性** | 实时（直接调用 API）        | 延迟（需要定期索引）              |
| **精确度**   | 精确匹配                | 语义相似                    |
| **成本**    | 低                   | 高（存储和计算成本）              |

**建议：**

*   **选择 MCP**：API 接口、数据库查询、第三方服务集成、实时数据
*   **选择 RAG**：文档问答、长文本理解、语义搜索、历史数据
*   **组合使用**：先用 RAG 找到相关文档，再用 MCP 获取精确数据

## 开发中的调试技巧

### 1. 使用 MCP CLI 工具测试

安装官方 CLI：

```bash
npm install -g @modelcontextprotocol/cli
```

查看工具列表：

```bash
npx @modelcontextprotocol/cli inspect --stdio -- node index.js
```

调用工具：

```bash
npx @modelcontextprotocol/cli call --stdio -- node index.js \
  search_articles_by_author \
  --arg author="测试用户"
```

### 2. 日志调试

```javascript
// 使用 console.error 输出日志，不干扰 stdio 通信
console.error('📝 Tool called:', name);
console.error('📦 Arguments:', JSON.stringify(args, null, 2));
console.error('✅ Result:', JSON.stringify(result, null, 2));
```

### 3. 错误处理

```javascript
try {
  const result = await someService.getData();
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2),
    }],
  };
} catch (error) {
  // 返回友好的错误信息
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: error.message,
        tip: '请检查参数是否正确或稍后重试',
      }),
    }],
    isError: true,
  };
}
```

## 性能优化建议

### 1. 实现缓存机制

```javascript
const cache = new Map();

export async function getUserStats(userId) {
  const cacheKey = `user_stats_${userId}`;
  
  // 检查缓存
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5分钟
      return cached.data;
    }
  }
  
  // 获取数据
  const data = await fetchUserStats(userId);
  
  // 写入缓存
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
  
  return data;
}
```

### 2. 并发请求优化

```javascript
export async function getContentSummary(timeRange) {
  // 并发获取多个数据源
  const [articles, tags, users] = await Promise.all([
    http.get('/view/articles'),
    http.get('/view/tags'),
    http.get('/view/users'),
  ]);
  
  // 汇总分析
  return {
    success: true,
    data: {
      articleCount: articles.length,
      tagCount: tags.length,
      userCount: users.length,
      ...summarizeData(articles, tags, users)
    }
  };
}
```

### 3. 分页和限制

```javascript
export async function searchByKeyword(keyword, searchIn, page = 1, limit = 20) {
  // 限制每页最大数量
  const maxLimit = 100;
  const safeLimit = Math.min(limit, maxLimit);
  
  // 分页逻辑
  const startIndex = (page - 1) * safeLimit;
  const endIndex = startIndex + safeLimit;
  
  // 只返回当前页数据
  return results.slice(startIndex, endIndex);
}
```

## 安全性考虑

### 1. 参数验证

```javascript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // 验证必需参数
  if (name === 'search_articles_by_author' && !args.author) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: 'Parameter "author" is required',
        }),
      }],
      isError: true,
    };
  }
  
  // 验证参数类型和范围
  if (args.page && (typeof args.page !== 'number' || args.page < 1)) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: 'Parameter "page" must be a positive number',
        }),
      }],
      isError: true,
    };
  }
  
  // 执行工具逻辑
  // ...
});
```

### 2. 限流控制

```javascript
const rateLimiter = new Map();

function checkRateLimit(toolName) {
  const now = Date.now();
  const limit = rateLimiter.get(toolName) || { count: 0, resetAt: now };
  
  if (now > limit.resetAt) {
    // 重置计数
    rateLimiter.set(toolName, { count: 1, resetAt: now + 60000 }); // 1分钟
    return true;
  }
  
  if (limit.count >= 60) { // 每分钟最多60次
    return false;
  }
  
  limit.count++;
  return true;
}
```

### 3. 数据脱敏

```javascript
function sanitizeUserData(user) {
  return {
    id: user._id,
    nickname: user.nickname,
    headImg: user.headImg,
    articleNum: user.articleNum,
    // 移除敏感信息
    // email: user.email,  ❌
    // phone: user.phone,  ❌
  };
}
```

## 扩展思路

### 1. 添加新工具

```javascript
// 定义工具
{
  name: 'export_article_report',
  description: '导出文章数据报告',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['json', 'csv', 'markdown'],
        default: 'markdown'
      },
      includeStats: {
        type: 'boolean',
        default: true
      }
    }
  }
}

// 实现逻辑
case 'export_article_report': {
  const report = await analyticsService.generateReport(
    args.format,
    args.includeStats
  );
  return {
    content: [{
      type: 'text',
      text: report,
    }],
  };
}
```

### 2. 集成更多数据源

```javascript
// services/githubService.js
export async function searchRepositories(query) {
  const response = await fetch(
    `https://api.github.com/search/repositories?q=${query}`,
    {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      }
    }
  );
  return await response.json();
}

// 添加到工具列表
{
  name: 'search_github_repos',
  description: '搜索 GitHub 仓库',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词' }
    },
    required: ['query']
  }
}
```

### 3. 支持 Resources（未来功能）

MCP 协议还支持 Resources 和 Prompts，未来可以扩展：

```javascript
// 提供文章内容作为 Resource
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'jue://articles/123',
        name: '文章标题',
        mimeType: 'text/markdown',
      }
    ]
  };
});

// 提供预设 Prompt
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'analyze_article',
        description: '深度分析文章',
        arguments: [
          { name: 'articleId', required: true }
        ]
      }
    ]
  };
});
```

## 最佳实践总结

### ✅ 做什么

1.  **工具描述要详细**：让 AI 能准确理解工具的用途和场景
2.  **使用 enum 限制参数**：避免无效值，提升调用成功率
3.  **返回结构化数据**：使用一致的 JSON 格式
4.  **错误处理友好**：返回清晰的错误信息和建议
5.  **分层架构**：MCP Server、Service、HTTP Client 职责分离
6.  **添加日志**：使用 `console.error` 输出关键信息
7.  **实现缓存**：减少不必要的 API 调用
8.  **参数验证**：在服务端验证所有输入

### ❌ 不要做什么

1.  **不要用 console.log**：会污染 stdio 通信
2.  **不要返回过大数据**：合理使用分页和限制
3.  **不要暴露敏感信息**：脱敏处理用户数据
4.  **不要阻塞主线程**：使用 async/await 处理异步操作
5.  **不要忽略错误**：所有异常都要捕获和处理
6.  **不要假设参数存在**：使用默认值和可选链
7.  **不要硬编码配置**：使用环境变量
8.  **不要跳过参数验证**：验证类型、范围和格式

## 未来展望

MCP 协议还在快速发展中，未来可能的方向：

1.  **Resources 支持**：让 AI 直接访问文件、数据库记录等资源
2.  **Prompts 功能**：提供预设的 Prompt 模板
3.  **流式响应**：支持大数据量的流式传输
4.  **双向通信**：Server 主动推送通知
5.  **权限系统**：细粒度的访问控制
6.  **监控和日志**：标准化的可观测性

## 总结

Model Context Protocol 为 AI 应用提供了一个优雅的扩展能力框架。通过本文的实战项目，我们看到：

1.  **简单灵活**：相比 RAG，MCP 实现更简单，适合结构化数据
2.  **标准协议**：一套代码，多个 AI 应用复用
3.  **可扩展性**：轻松添加新工具和数据源
4.  **生产就绪**：通过合理的架构设计，可以支撑生产环境

如果你正在构建 AI 应用，需要访问私有数据或第三方 API，MCP 是一个值得尝试的方案。

## 参考资源

*   [MCP 官方文档](https://modelcontextprotocol.io)
*   [MCP SDK](https://github.com/modelcontextprotocol/sdk)
*   [本项目源码](https://github.com/your-username/mcp-server-jue-article)

***

**关注我，获取更多 AI 开发实战内容！**

*本文项目代码已开源，欢迎 Star 和 PR。*

