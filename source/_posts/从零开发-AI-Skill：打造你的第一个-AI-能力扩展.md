---
title: 从零开发 AI Skill：打造你的第一个 AI 能力扩展
date: 2026-03-25 22:21:39
tags: [AI Skill, OpenAI Functions, MCP, LangChain, 技能开发]
---


# 从零开发 AI Skill：打造你的第一个 AI 能力扩展

> 手把手教你为 AI 系统开发自定义技能，让 AI 助手更懂你的业务

## 引言：AI Skill 是什么？

当你使用 ChatGPT 或 Claude 时，有没有想过：**"如果 AI 能直接查询我的数据库该多好"**、**"要是它能自动发邮件就完美了"**？

这就是 **AI Skill** 的价值所在。

AI Skill（AI 技能）是为 AI 系统开发的**可调用能力模块**，让 AI 能够：

*   📊 访问你的数据源（数据库、API、文件系统）
*   🔧 执行具体操作（发邮件、创建工单、调用服务）
*   🎯 理解特定领域（你的业务逻辑、专业知识）

**本文将教你：**

1.  AI Skill 的技术原理
2.  从零开发一个完整的 Skill
3.  接入主流 AI 平台（OpenAI、Claude、MCP）
4.  生产环境最佳实践

## 一、AI Skill 技术架构

### 1.1 核心组件

    ┌─────────────────────────────────────────┐
    │           AI 系统（LLM）                  │
    │   ChatGPT / Claude / 自建模型            │
    └──────────────┬──────────────────────────┘
                   ↓
    ┌──────────────────────────────────────────┐
    │         Skill 调度层（Router）            │
    │  - 意图识别                               │
    │  - 参数提取                               │
    │  - 权限验证                               │
    └──────────────┬───────────────────────────┘
                   ↓
    ┌──────────────────────────────────────────┐
    │           Skill 执行层                    │
    ├──────────────────────────────────────────┤
    │  Skill 1: 数据查询                        │
    │  Skill 2: 邮件发送                        │
    │  Skill 3: 文档生成                        │
    │  Skill 4: API 调用                        │
    │  ...                                      │
    └──────────────┬───────────────────────────┘
                   ↓
    ┌──────────────────────────────────────────┐
    │        外部系统 / 数据源                  │
    │  数据库 | API | 文件系统 | 第三方服务    │
    └──────────────────────────────────────────┘

### 1.2 实现方式对比

| 方式                               | 技术               | 优势      | 劣势        | 适用场景               |
| -------------------------------- | ---------------- | ------- | --------- | ------------------ |
| **OpenAI Functions**             | Function Calling | 原生支持、简单 | 仅限 OpenAI | OpenAI 用户          |
| **MCP (Model Context Protocol)** | 标准协议             | 跨平台、标准化 | 相对新       | Claude Desktop、多平台 |
| **LangChain Tools**              | Python/JS 框架     | 生态丰富    | 需要框架      | 复杂 Agent 系统        |
| **Custom API**                   | RESTful API      | 灵活、通用   | 需要集成层     | 企业内部系统             |

## 二、实战：开发第一个 AI Skill

### 2.1 场景设计

**业务场景：** 开发一个"客户查询"Skill，让 AI 能够查询 CRM 系统中的客户信息。

**技能定义：**

*   **名称：** query\_customer
*   **描述：** 根据客户名称或 ID 查询客户详细信息
*   **参数：**
    *   customer\_id (可选): 客户 ID
    *   customer\_name (可选): 客户名称
    *   include\_orders (可选): 是否包含订单历史
*   **返回：** 客户信息 JSON

### 2.2 方案一：OpenAI Function Calling

#### Step 1: 定义 Function Schema

```javascript
// skills/customerSkill.js

export const queryCustomerFunction = {
  name: 'query_customer',
  description: '查询 CRM 系统中的客户信息。可以通过客户 ID 或名称查询。',
  parameters: {
    type: 'object',
    properties: {
      customer_id: {
        type: 'string',
        description: '客户的唯一 ID，如果知道客户 ID 优先使用'
      },
      customer_name: {
        type: 'string',
        description: '客户的公司名称或个人姓名'
      },
      include_orders: {
        type: 'boolean',
        description: '是否包含该客户的订单历史，默认为 false',
        default: false
      }
    },
    required: [] // 至少需要 customer_id 或 customer_name 之一
  }
};
```

#### Step 2: 实现 Function 逻辑

```javascript
// skills/customerSkill.js

import db from '../lib/database.js';

export async function queryCustomer({ customer_id, customer_name, include_orders = false }) {
  try {
    // 1. 参数验证
    if (!customer_id && !customer_name) {
      return {
        success: false,
        error: '必须提供 customer_id 或 customer_name 之一'
      };
    }

    // 2. 查询客户基本信息
    let customer;
    
    if (customer_id) {
      customer = await db.customers.findById(customer_id);
    } else {
      // 模糊匹配客户名称
      const customers = await db.customers.findByName(customer_name);
      
      if (customers.length === 0) {
        return {
          success: false,
          error: `未找到名称为 "${customer_name}" 的客户`
        };
      }
      
      if (customers.length > 1) {
        return {
          success: false,
          error: '找到多个匹配的客户，请提供更精确的名称或使用客户 ID',
          candidates: customers.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email
          }))
        };
      }
      
      customer = customers[0];
    }

    if (!customer) {
      return {
        success: false,
        error: '客户不存在'
      };
    }

    // 3. 构建返回数据
    const result = {
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        address: customer.address,
        created_at: customer.created_at,
        last_contact: customer.last_contact,
        status: customer.status,
        tags: customer.tags,
        notes: customer.notes
      }
    };

    // 4. 如果需要，查询订单历史
    if (include_orders) {
      const orders = await db.orders.findByCustomerId(customer.id);
      result.data.orders = orders.map(order => ({
        id: order.id,
        date: order.date,
        amount: order.amount,
        status: order.status,
        items_count: order.items.length
      }));
      result.data.total_orders = orders.length;
      result.data.total_spent = orders.reduce((sum, o) => sum + o.amount, 0);
    }

    return result;

  } catch (error) {
    console.error('Query customer error:', error);
    return {
      success: false,
      error: '查询客户信息时发生错误：' + error.message
    };
  }
}
```

#### Step 3: 注册和调用

```javascript
// app.js

import OpenAI from 'openai';
import { queryCustomerFunction, queryCustomer } from './skills/customerSkill.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function chatWithFunctions(userMessage) {
  // 1. 发送消息，携带 Function 定义
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: '你是一个 CRM 客服助手。你可以查询客户信息来帮助用户。'
      },
      {
        role: 'user',
        content: userMessage
      }
    ],
    functions: [queryCustomerFunction], // 注册 Function
    function_call: 'auto' // 让 AI 自动判断是否调用
  });

  const message = response.choices[0].message;

  // 2. 检查 AI 是否要调用 Function
  if (message.function_call) {
    const functionName = message.function_call.name;
    const functionArgs = JSON.parse(message.function_call.arguments);

    console.log(`🔧 AI 调用 Function: ${functionName}`);
    console.log(`📦 参数:`, functionArgs);

    // 3. 执行 Function
    let functionResult;
    
    if (functionName === 'query_customer') {
      functionResult = await queryCustomer(functionArgs);
    }

    console.log(`✅ 执行结果:`, functionResult);

    // 4. 将结果返回给 AI
    const secondResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '你是一个 CRM 客服助手。'
        },
        {
          role: 'user',
          content: userMessage
        },
        message, // AI 的第一次回复（包含 function_call）
        {
          role: 'function',
          name: functionName,
          content: JSON.stringify(functionResult)
        }
      ]
    });

    return secondResponse.choices[0].message.content;
  }

  // 如果 AI 没有调用 Function，直接返回回复
  return message.content;
}

// 使用示例
const reply = await chatWithFunctions(
  '帮我查一下客户"张三"的信息，包括他的订单历史'
);

console.log('AI 回复:', reply);

// 输出示例:
// 🔧 AI 调用 Function: query_customer
// 📦 参数: { customer_name: "张三", include_orders: true }
// ✅ 执行结果: { success: true, data: {...} }
// 
// AI 回复: 
// 我找到了客户"张三"的信息：
// 
// 基本资料：
// - 公司：ABC 科技有限公司
// - 邮箱：zhangsan@example.com
// - 电话：138****1234
// - 状态：活跃客户
// 
// 订单历史：
// 张三共有 5 笔订单，总消费 ¥125,680
// - 最近订单：2026-02-15，¥35,000
// - 订单状态：4 笔已完成，1 笔进行中
```

### 2.3 方案二：MCP (Model Context Protocol)

#### Step 1: 创建 MCP Server

```javascript
// mcp-server/index.js

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import db from './lib/database.js';

// 创建 MCP Server
const server = new Server(
  {
    name: 'crm-skills',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {}, // 声明支持 Tools
    },
  }
);

// 定义 Tools
const TOOLS = [
  {
    name: 'query_customer',
    description: '查询 CRM 系统中的客户信息。可以通过客户 ID 或名称查询，支持查询订单历史。',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: {
          type: 'string',
          description: '客户的唯一 ID'
        },
        customer_name: {
          type: 'string',
          description: '客户的公司名称或个人姓名'
        },
        include_orders: {
          type: 'boolean',
          description: '是否包含订单历史',
          default: false
        }
      }
    }
  },
  {
    name: 'create_customer',
    description: '在 CRM 系统中创建新客户',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '客户名称（必填）'
        },
        email: {
          type: 'string',
          description: '邮箱地址'
        },
        phone: {
          type: 'string',
          description: '联系电话'
        },
        company: {
          type: 'string',
          description: '公司名称'
        },
        address: {
          type: 'string',
          description: '地址'
        }
      },
      required: ['name', 'email']
    }
  },
  {
    name: 'update_customer',
    description: '更新客户信息',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: {
          type: 'string',
          description: '客户 ID（必填）'
        },
        updates: {
          type: 'object',
          description: '要更新的字段'
        }
      },
      required: ['customer_id', 'updates']
    }
  }
];

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query_customer': {
        const result = await queryCustomer(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'create_customer': {
        const result = await createCustomer(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'update_customer': {
        const result = await updateCustomer(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message
          })
        }
      ],
      isError: true
    };
  }
});

// 实现具体的业务逻辑
async function queryCustomer(args) {
  // 与前面的实现相同
  // ...
}

async function createCustomer({ name, email, phone, company, address }) {
  try {
    // 验证邮箱格式
    if (!isValidEmail(email)) {
      return {
        success: false,
        error: '邮箱格式不正确'
      };
    }

    // 检查是否已存在
    const existing = await db.customers.findByEmail(email);
    if (existing) {
      return {
        success: false,
        error: '该邮箱已被使用'
      };
    }

    // 创建客户
    const customer = await db.customers.create({
      name,
      email,
      phone,
      company,
      address,
      created_at: new Date().toISOString(),
      status: 'active'
    });

    return {
      success: true,
      message: '客户创建成功',
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      }
    };
  } catch (error) {
    return {
      success: false,
      error: '创建客户失败：' + error.message
    };
  }
}

async function updateCustomer({ customer_id, updates }) {
  try {
    const customer = await db.customers.findById(customer_id);
    
    if (!customer) {
      return {
        success: false,
        error: '客户不存在'
      };
    }

    // 更新客户信息
    const updated = await db.customers.update(customer_id, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    return {
      success: true,
      message: '客户信息已更新',
      data: updated
    };
  } catch (error) {
    return {
      success: false,
      error: '更新失败：' + error.message
    };
  }
}

// 启动 Server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 CRM Skills MCP Server running');
}

main();
```

#### Step 2: 配置 Claude Desktop

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "crm-skills": {
      "command": "node",
      "args": ["/path/to/mcp-server/index.js"]
    }
  }
}
```

#### Step 3: 使用

    用户：帮我创建一个新客户，
         名称：李四科技
         邮箱：lisi@example.com
         电话：139****5678

    Claude：
    [调用 create_customer tool]
    参数：
    - name: "李四科技"
    - email: "lisi@example.com"  
    - phone: "139****5678"

    结果：✅ 客户创建成功
    - ID: cust_789012
    - 名称：李四科技
    - 邮箱：lisi@example.com

    客户已成功添加到 CRM 系统中！

### 2.4 方案三：LangChain Custom Tool

```python
# skills/customer_tool.py

from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Optional, Type
import db_client

class QueryCustomerInput(BaseModel):
    """查询客户的输入参数"""
    customer_id: Optional[str] = Field(None, description="客户ID")
    customer_name: Optional[str] = Field(None, description="客户名称")
    include_orders: bool = Field(False, description="是否包含订单历史")

class QueryCustomerTool(BaseTool):
    name = "query_customer"
    description = """
    查询 CRM 系统中的客户信息。
    可以通过客户 ID 或名称查询。
    支持查询客户的订单历史。
    """
    args_schema: Type[BaseModel] = QueryCustomerInput
    
    def _run(
        self,
        customer_id: Optional[str] = None,
        customer_name: Optional[str] = None,
        include_orders: bool = False
    ) -> dict:
        """执行查询"""
        try:
            # 参数验证
            if not customer_id and not customer_name:
                return {
                    "success": False,
                    "error": "必须提供 customer_id 或 customer_name"
                }
            
            # 查询逻辑
            if customer_id:
                customer = db_client.get_customer_by_id(customer_id)
            else:
                customers = db_client.search_customers(customer_name)
                if len(customers) == 0:
                    return {
                        "success": False,
                        "error": f"未找到客户: {customer_name}"
                    }
                if len(customers) > 1:
                    return {
                        "success": False,
                        "error": "找到多个匹配的客户",
                        "candidates": [
                            {"id": c.id, "name": c.name}
                            for c in customers
                        ]
                    }
                customer = customers[0]
            
            result = {
                "success": True,
                "data": {
                    "id": customer.id,
                    "name": customer.name,
                    "email": customer.email,
                    "phone": customer.phone,
                    "company": customer.company
                }
            }
            
            # 查询订单
            if include_orders:
                orders = db_client.get_orders_by_customer(customer.id)
                result["data"]["orders"] = [
                    {
                        "id": o.id,
                        "date": o.date,
                        "amount": o.amount,
                        "status": o.status
                    }
                    for o in orders
                ]
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _arun(self, *args, **kwargs):
        """异步执行（可选）"""
        return self._run(*args, **kwargs)
```

```python
# agent.py

from langchain.chat_models import ChatOpenAI
from langchain.agents import initialize_agent, AgentType
from skills.customer_tool import QueryCustomerTool

# 创建工具实例
tools = [
    QueryCustomerTool(),
    # 其他工具...
]

# 创建 Agent
llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)

agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.OPENAI_FUNCTIONS,
    verbose=True
)

# 使用
response = agent.run(
    "帮我查询客户'张三'的信息，包括订单历史"
)

print(response)
```

## 三、高级特性实现

### 3.1 参数验证和错误处理

```javascript
// utils/validator.js

export class SkillValidator {
  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      throw new ValidationError('邮箱格式不正确');
    }
  }
  
  static validatePhone(phone) {
    const regex = /^1[3-9]\d{9}$/;
    if (!regex.test(phone)) {
      throw new ValidationError('手机号格式不正确');
    }
  }
  
  static validateRequired(value, fieldName) {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError(`${fieldName} 是必填项`);
    }
  }
  
  static validateEnum(value, allowedValues, fieldName) {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} 必须是以下值之一: ${allowedValues.join(', ')}`
      );
    }
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 在 Skill 中使用
async function queryCustomer(args) {
  try {
    // 参数验证
    if (args.email) {
      SkillValidator.validateEmail(args.email);
    }
    
    if (args.phone) {
      SkillValidator.validatePhone(args.phone);
    }
    
    // 业务逻辑...
    
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        error_type: 'validation_error'
      };
    }
    
    // 其他错误...
    throw error;
  }
}
```

### 3.2 权限控制

```javascript
// middleware/auth.js

export class SkillAuthenticator {
  constructor() {
    this.permissions = new Map();
  }
  
  // 定义权限
  definePermission(skillName, roles) {
    this.permissions.set(skillName, roles);
  }
  
  // 检查权限
  async checkPermission(userId, skillName) {
    const user = await this.getUserWithRoles(userId);
    const requiredRoles = this.permissions.get(skillName) || [];
    
    // 如果没有定义权限要求，允许所有人访问
    if (requiredRoles.length === 0) {
      return true;
    }
    
    // 检查用户是否有任一所需角色
    const hasPermission = requiredRoles.some(role => 
      user.roles.includes(role)
    );
    
    if (!hasPermission) {
      throw new PermissionError(
        `您没有权限执行 ${skillName}。需要角色: ${requiredRoles.join(', ')}`
      );
    }
    
    return true;
  }
  
  async getUserWithRoles(userId) {
    // 从数据库获取用户角色
    const user = await db.users.findById(userId);
    return user;
  }
}

// 在 Skill Router 中使用
const authenticator = new SkillAuthenticator();

// 定义权限
authenticator.definePermission('query_customer', ['sales', 'manager', 'admin']);
authenticator.definePermission('delete_customer', ['admin']);
authenticator.definePermission('update_pricing', ['manager', 'admin']);

async function executeSkill(userId, skillName, args) {
  // 1. 检查权限
  await authenticator.checkPermission(userId, skillName);
  
  // 2. 执行 Skill
  const result = await skills[skillName](args);
  
  // 3. 记录审计日志
  await auditLog.record({
    userId,
    action: skillName,
    args,
    result: result.success,
    timestamp: new Date()
  });
  
  return result;
}
```

### 3.3 缓存策略

```javascript
// utils/cache.js

export class SkillCache {
  constructor(ttl = 300000) { // 默认 5 分钟
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  generateKey(skillName, args) {
    return `${skillName}:${JSON.stringify(args)}`;
  }
  
  get(skillName, args) {
    const key = this.generateKey(skillName, args);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // 检查是否过期
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  set(skillName, args, data) {
    const key = this.generateKey(skillName, args);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  invalidate(pattern) {
    // 清除匹配的缓存
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  clear() {
    this.cache.clear();
  }
}

// 使用缓存
const cache = new SkillCache(300000); // 5 分钟缓存

async function queryCustomerWithCache(args) {
  // 1. 尝试从缓存获取
  const cached = cache.get('query_customer', args);
  if (cached) {
    console.log('💾 Cache hit');
    return cached;
  }
  
  // 2. 执行查询
  const result = await queryCustomer(args);
  
  // 3. 缓存结果（仅成功的结果）
  if (result.success) {
    cache.set('query_customer', args, result);
  }
  
  return result;
}

// 更新客户后清除相关缓存
async function updateCustomer(args) {
  const result = await performUpdate(args);
  
  if (result.success) {
    // 清除该客户的所有查询缓存
    cache.invalidate(`query_customer:*customer_id":"${args.customer_id}"`);
  }
  
  return result;
}
```

### 3.4 流式响应

```javascript
// skills/streamingSkill.js

export async function* generateReportStreaming(customerId) {
  yield { type: 'status', message: '开始生成报告...' };
  
  // 1. 查询客户信息
  yield { type: 'status', message: '正在查询客户信息...' };
  const customer = await db.customers.findById(customerId);
  yield {
    type: 'data',
    section: 'customer',
    data: customer
  };
  
  // 2. 查询订单统计
  yield { type: 'status', message: '正在统计订单数据...' };
  const orders = await db.orders.findByCustomerId(customerId);
  const stats = calculateOrderStats(orders);
  yield {
    type: 'data',
    section: 'orders',
    data: stats
  };
  
  // 3. 生成AI分析
  yield { type: 'status', message: '正在生成 AI 分析...' };
  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{
      role: 'user',
      content: `分析客户${customer.name}的消费行为：${JSON.stringify(stats)}`
    }],
    stream: true
  });
  
  let analysis = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    analysis += delta;
    yield {
      type: 'stream',
      section: 'analysis',
      delta
    };
  }
  
  yield {
    type: 'complete',
    message: '报告生成完成',
    summary: {
      customer_name: customer.name,
      total_orders: stats.total_orders,
      total_revenue: stats.total_revenue
    }
  };
}

// 使用流式响应
async function handleStreamingSkill(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const stream = generateReportStreaming('cust_123');
  
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
  
  res.end();
}
```

## 四、生产环境最佳实践

### 4.1 监控和日志

```javascript
// utils/monitoring.js

export class SkillMonitor {
  constructor() {
    this.metrics = {
      executions: new Map(),
      errors: new Map(),
      latencies: []
    };
  }
  
  async trackExecution(skillName, executor) {
    const startTime = Date.now();
    
    try {
      const result = await executor();
      
      // 记录成功指标
      this.recordSuccess(skillName, Date.now() - startTime);
      
      return result;
    } catch (error) {
      // 记录失败指标
      this.recordError(skillName, error);
      
      throw error;
    }
  }
  
  recordSuccess(skillName, latency) {
    // 执行次数
    const count = this.metrics.executions.get(skillName) || 0;
    this.metrics.executions.set(skillName, count + 1);
    
    // 延迟
    this.metrics.latencies.push({
      skill: skillName,
      latency,
      timestamp: Date.now()
    });
    
    // 清理旧数据（保留最近 1000 条）
    if (this.metrics.latencies.length > 1000) {
      this.metrics.latencies.shift();
    }
  }
  
  recordError(skillName, error) {
    const errors = this.metrics.errors.get(skillName) || [];
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    });
    this.metrics.errors.set(skillName, errors);
  }
  
  getMetrics() {
    const latencies = this.metrics.latencies.filter(
      l => Date.now() - l.timestamp < 3600000 // 最近1小时
    );
    
    return {
      executions: Object.fromEntries(this.metrics.executions),
      errors: Object.fromEntries(this.metrics.errors),
      avgLatency: latencies.length > 0
        ? latencies.reduce((sum, l) => sum + l.latency, 0) / latencies.length
        : 0,
      p95Latency: this.calculatePercentile(latencies, 0.95),
      p99Latency: this.calculatePercentile(latencies, 0.99)
    };
  }
  
  calculatePercentile(latencies, percentile) {
    if (latencies.length === 0) return 0;
    
    const sorted = latencies
      .map(l => l.latency)
      .sort((a, b) => a - b);
    
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index];
  }
}

// 使用监控
const monitor = new SkillMonitor();

async function monitoredSkillExecution(skillName, args) {
  return await monitor.trackExecution(skillName, async () => {
    return await skills[skillName](args);
  });
}

// 暴露监控端点
app.get('/metrics', (req, res) => {
  const metrics = monitor.getMetrics();
  res.json(metrics);
});
```

### 4.2 限流和熔断

```javascript
// utils/rateLimit.js

export class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  async checkLimit(userId, skillName) {
    const key = `${userId}:${skillName}`;
    const now = Date.now();
    
    // 获取用户的请求记录
    let userRequests = this.requests.get(key) || [];
    
    // 清理过期记录
    userRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    // 检查是否超限
    if (userRequests.length >= this.maxRequests) {
      const oldestRequest = userRequests[0];
      const retryAfter = this.windowMs - (now - oldestRequest);
      
      throw new RateLimitError(
        `请求过于频繁，请${Math.ceil(retryAfter / 1000)}秒后重试`,
        retryAfter
      );
    }
    
    // 记录本次请求
    userRequests.push(now);
    this.requests.set(key, userRequests);
    
    return true;
  }
}

// 熔断器
export class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold; // 失败阈值
    this.timeout = timeout;     // 熔断时长
    this.failures = new Map();
    this.state = new Map();     // 'closed' | 'open' | 'half-open'
  }
  
  async execute(skillName, executor) {
    // 检查熔断状态
    const state = this.getState(skillName);
    
    if (state === 'open') {
      throw new CircuitBreakerError(
        `${skillName} 服务暂时不可用，请稍后重试`
      );
    }
    
    try {
      const result = await executor();
      
      // 成功，重置失败计数
      this.onSuccess(skillName);
      
      return result;
    } catch (error) {
      // 失败，增加计数
      this.onFailure(skillName);
      
      throw error;
    }
  }
  
  getState(skillName) {
    const state = this.state.get(skillName);
    
    if (!state || state.status === 'closed') {
      return 'closed';
    }
    
    // 检查熔断是否超时
    if (Date.now() - state.openedAt > this.timeout) {
      this.state.set(skillName, {
        status: 'half-open',
        openedAt: state.openedAt
      });
      return 'half-open';
    }
    
    return 'open';
  }
  
  onSuccess(skillName) {
    this.failures.delete(skillName);
    
    const state = this.state.get(skillName);
    if (state && state.status === 'half-open') {
      // 半开状态下成功，关闭熔断器
      this.state.delete(skillName);
    }
  }
  
  onFailure(skillName) {
    const failures = (this.failures.get(skillName) || 0) + 1;
    this.failures.set(skillName, failures);
    
    // 达到阈值，打开熔断器
    if (failures >= this.threshold) {
      this.state.set(skillName, {
        status: 'open',
        openedAt: Date.now()
      });
      
      console.warn(`⚠️  Circuit breaker opened for ${skillName}`);
    }
  }
}

// 使用限流和熔断
const rateLimiter = new RateLimiter(10, 60000); // 每分钟10次
const circuitBreaker = new CircuitBreaker(5, 60000); // 5次失败熔断1分钟

async function protectedSkillExecution(userId, skillName, args) {
  // 1. 检查限流
  await rateLimiter.checkLimit(userId, skillName);
  
  // 2. 通过熔断器执行
  return await circuitBreaker.execute(skillName, async () => {
    return await skills[skillName](args);
  });
}
```

### 4.3 测试

```javascript
// skills/__tests__/customerSkill.test.js

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { queryCustomer, createCustomer } from '../customerSkill.js';
import db from '../../lib/database.js';

// Mock 数据库
jest.mock('../../lib/database.js');

describe('Customer Skills', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('queryCustomer', () => {
    it('应该通过 ID 查询客户', async () => {
      // Arrange
      const mockCustomer = {
        id: 'cust_123',
        name: '张三',
        email: 'zhangsan@example.com'
      };
      
      db.customers.findById.mockResolvedValue(mockCustomer);

      // Act
      const result = await queryCustomer({
        customer_id: 'cust_123'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('cust_123');
      expect(result.data.name).toBe('张三');
      expect(db.customers.findById).toHaveBeenCalledWith('cust_123');
    });

    it('应该通过名称查询客户', async () => {
      // Arrange
      const mockCustomers = [{
        id: 'cust_456',
        name: '李四',
        email: 'lisi@example.com'
      }];
      
      db.customers.findByName.mockResolvedValue(mockCustomers);

      // Act
      const result = await queryCustomer({
        customer_name: '李四'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('李四');
    });

    it('应该在找到多个客户时返回候选列表', async () => {
      // Arrange
      const mockCustomers = [
        { id: 'cust_1', name: '张三丰', email: 'zsf@example.com' },
        { id: 'cust_2', name: '张三疯', email: 'zsf2@example.com' }
      ];
      
      db.customers.findByName.mockResolvedValue(mockCustomers);

      // Act
      const result = await queryCustomer({
        customer_name: '张三'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('多个匹配');
      expect(result.candidates).toHaveLength(2);
    });

    it('应该在客户不存在时返回错误', async () => {
      // Arrange
      db.customers.findByName.mockResolvedValue([]);

      // Act
      const result = await queryCustomer({
        customer_name: '不存在的客户'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('未找到');
    });

    it('应该包含订单历史（当请求时）', async () => {
      // Arrange
      const mockCustomer = {
        id: 'cust_123',
        name: '张三'
      };
      const mockOrders = [
        { id: 'order_1', amount: 1000 },
        { id: 'order_2', amount: 2000 }
      ];
      
      db.customers.findById.mockResolvedValue(mockCustomer);
      db.orders.findByCustomerId.mockResolvedValue(mockOrders);

      // Act
      const result = await queryCustomer({
        customer_id: 'cust_123',
        include_orders: true
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.orders).toHaveLength(2);
      expect(result.data.total_spent).toBe(3000);
    });
  });

  describe('createCustomer', () => {
    it('应该成功创建客户', async () => {
      // Arrange
      const newCustomer = {
        name: '王五',
        email: 'wangwu@example.com',
        phone: '13900000000'
      };
      
      db.customers.findByEmail.mockResolvedValue(null);
      db.customers.create.mockResolvedValue({
        id: 'cust_789',
        ...newCustomer
      });

      // Act
      const result = await createCustomer(newCustomer);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('cust_789');
      expect(db.customers.create).toHaveBeenCalled();
    });

    it('应该拒绝重复的邮箱', async () => {
      // Arrange
      db.customers.findByEmail.mockResolvedValue({
        id: 'cust_existing',
        email: 'existing@example.com'
      });

      // Act
      const result = await createCustomer({
        name: '测试',
        email: 'existing@example.com'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('已被使用');
      expect(db.customers.create).not.toHaveBeenCalled();
    });

    it('应该验证邮箱格式', async () => {
      // Act
      const result = await createCustomer({
        name: '测试',
        email: 'invalid-email'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('格式不正确');
    });
  });
});
```

## 五、部署和维护

### 5.1 部署检查清单

```markdown
## 部署前检查

### 代码质量
- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] 无安全漏洞
- [ ] 性能测试通过

### 配置
- [ ] 环境变量配置正确
- [ ] 数据库连接测试通过
- [ ] API 密钥已设置
- [ ] 日志级别配置合理

### 监控
- [ ] 监控指标已配置
- [ ] 告警规则已设置
- [ ] 日志收集已启用
- [ ] 错误追踪已配置

### 安全
- [ ] 权限控制已启用
- [ ] 限流配置已设置
- [ ] 输入验证完备
- [ ] 敏感数据已加密

### 文档
- [ ] API 文档已更新
- [ ] 部署文档已完善
- [ ] 运维手册已准备
- [ ] 回滚方案已制定
```

### 5.2 监控仪表盘

```javascript
// dashboard/metrics.js

export function generateDashboard(metrics) {
  return {
    overview: {
      total_executions: Object.values(metrics.executions)
        .reduce((sum, count) => sum + count, 0),
      total_errors: Object.values(metrics.errors)
        .reduce((sum, errors) => sum + errors.length, 0),
      error_rate: calculateErrorRate(metrics),
      avg_latency: `${metrics.avgLatency.toFixed(2)}ms`,
      p95_latency: `${metrics.p95Latency.toFixed(2)}ms`,
      p99_latency: `${metrics.p99Latency.toFixed(2)}ms`
    },
    
    by_skill: Object.entries(metrics.executions).map(([skill, count]) => ({
      skill,
      executions: count,
      errors: metrics.errors.get(skill)?.length || 0,
      error_rate: calculateSkillErrorRate(skill, metrics),
      avg_latency: calculateSkillAvgLatency(skill, metrics)
    })),
    
    recent_errors: getRecentErrors(metrics, 10),
    
    slow_requests: getSlowRequests(metrics, 10)
  };
}

function calculateErrorRate(metrics) {
  const total = Object.values(metrics.executions)
    .reduce((sum, count) => sum + count, 0);
  const errors = Object.values(metrics.errors)
    .reduce((sum, errors) => sum + errors.length, 0);
  
  return total > 0 ? ((errors / total) * 100).toFixed(2) + '%' : '0%';
}

// Express 端点
app.get('/dashboard', (req, res) => {
  const metrics = monitor.getMetrics();
  const dashboard = generateDashboard(metrics);
  
  res.json(dashboard);
});

// HTML 仪表盘
app.get('/dashboard/ui', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Skills Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { 
          display: inline-block;
          padding: 20px;
          margin: 10px;
          background: #f5f5f5;
          border-radius: 5px;
        }
        .metric-value { 
          font-size: 2em;
          font-weight: bold;
          color: #333;
        }
        .metric-label { 
          color: #666;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th { background: #f5f5f5; }
      </style>
    </head>
    <body>
      <h1>🤖 AI Skills Dashboard</h1>
      <div id="metrics"></div>
      <div id="skills"></div>
      
      <script>
        async function loadDashboard() {
          const response = await fetch('/dashboard');
          const data = await response.json();
          
          // 渲染概览指标
          document.getElementById('metrics').innerHTML = \`
            <h2>📊 Overview</h2>
            <div class="metric">
              <div class="metric-value">\${data.overview.total_executions}</div>
              <div class="metric-label">Total Executions</div>
            </div>
            <div class="metric">
              <div class="metric-value">\${data.overview.total_errors}</div>
              <div class="metric-label">Total Errors</div>
            </div>
            <div class="metric">
              <div class="metric-value">\${data.overview.error_rate}</div>
              <div class="metric-label">Error Rate</div>
            </div>
            <div class="metric">
              <div class="metric-value">\${data.overview.avg_latency}</div>
              <div class="metric-label">Avg Latency</div>
            </div>
          \`;
          
          // 渲染技能表格
          const skillsTable = data.by_skill.map(skill => \`
            <tr>
              <td>\${skill.skill}</td>
              <td>\${skill.executions}</td>
              <td>\${skill.errors}</td>
              <td>\${skill.error_rate}</td>
              <td>\${skill.avg_latency}</td>
            </tr>
          \`).join('');
          
          document.getElementById('skills').innerHTML = \`
            <h2>🎯 Skills Performance</h2>
            <table>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Executions</th>
                  <th>Errors</th>
                  <th>Error Rate</th>
                  <th>Avg Latency</th>
                </tr>
              </thead>
              <tbody>\${skillsTable}</tbody>
            </table>
          \`;
        }
        
        // 每 30 秒刷新一次
        loadDashboard();
        setInterval(loadDashboard, 30000);
      </script>
    </body>
    </html>
  `);
});
```

## 六、总结与展望

### 6.1 开发 AI Skill 的关键要点

**✅ 必做：**

1.  **清晰的接口定义** - 参数、返回值要明确
2.  **完善的错误处理** - 让 AI 能理解出了什么问题
3.  **详细的文档说明** - description 是 AI 理解的关键
4.  **输入验证** - 永远不要信任输入
5.  **监控和日志** - 了解 Skill 的运行状况

**❌ 避免：**

1.  过于复杂的参数结构
2.  返回过大的数据
3.  长时间阻塞的操作
4.  缺少权限控制
5.  硬编码敏感信息

### 6.2 最佳实践清单

```javascript
// 优秀的 Skill 设计
const excellentSkill = {
  // 1. 清晰的命名
  name: 'query_customer_detailed_info',
  
  // 2. 详细的描述
  description: `
    查询 CRM 系统中的客户详细信息。
    
    使用场景：
    - 需要了解客户基本资料时
    - 查看客户订单历史时
    - 分析客户消费行为时
    
    注意事项：
    - customer_id 和 customer_name 至少提供一个
    - 查询订单历史会增加响应时间
    - 返回结果包含敏感信息，注意权限
  `,
  
  // 3. 明确的参数类型和说明
  inputSchema: {
    type: 'object',
    properties: {
      customer_id: {
        type: 'string',
        description: '客户 ID（优先使用，精确匹配）',
        pattern: '^cust_[a-zA-Z0-9]{6}$'
      },
      customer_name: {
        type: 'string',
        description: '客户名称（模糊匹配，可能返回多个结果）',
        minLength: 2,
        maxLength: 50
      },
      include_orders: {
        type: 'boolean',
        description: '是否包含订单历史（会增加 2-3 秒响应时间）',
        default: false
      },
      order_limit: {
        type: 'number',
        description: '订单历史数量限制（1-100）',
        minimum: 1,
        maximum: 100,
        default: 10
      }
    }
  },
  
  // 4. 统一的返回格式
  responseFormat: {
    success: 'boolean',
    message: 'string (optional)',
    data: 'object | array',
    error: 'string (when success=false)',
    metadata: {
      execution_time: 'number (ms)',
      cached: 'boolean'
    }
  },
  
  // 5. 性能指标
  performance: {
    avg_latency: '150ms',
    p95_latency: '300ms',
    timeout: '5000ms',
    cache_ttl: '300s'
  },
  
  // 6. 权限要求
  permissions: ['customer:read'],
  
  // 7. 限流配置
  rateLimit: {
    requests: 100,
    window: '1m'
  }
};
```

### 6.3 未来趋势

**1. 多模态 Skill**

```javascript
// 未来的 Skill 可能支持多种输入输出类型
{
  name: 'analyze_document',
  inputTypes: ['text', 'pdf', 'image', 'audio'],
  outputTypes: ['text', 'json', 'chart', 'report']
}
```

**2. 组合 Skill**

```javascript
// Skill 可以互相调用，形成工作流
{
  name: 'onboard_customer',
  workflow: [
    'create_customer',      // 步骤 1
    'send_welcome_email',   // 步骤 2
    'create_first_task',    // 步骤 3
    'notify_sales_team'     // 步骤 4
  ]
}
```

**3. 自适应 Skill**

```javascript
// Skill 可以根据执行结果自我优化
{
  name: 'smart_query',
  learningEnabled: true,
  adaptiveCaching: true,
  autoParameterTuning: true
}
```

## 七、资源和参考

### 学习资源

**文档**

*   [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
*   [Model Context Protocol](https://modelcontextprotocol.io/introduction)
*   [LangChain Tools](https://python.langchain.com/docs/modules/agents/tools/)

**开源项目**

*   [mcp-server-examples](https://github.com/modelcontextprotocol/servers) - MCP Server 示例
*   [langchain-tools](https://github.com/langchain-ai/langchain/tree/master/libs/langchain/langchain/tools) - LangChain 工具集
*   [openai-function-calling-examples](https://github.com/openai/openai-cookbook/tree/main/examples) - OpenAI 示例

### 社区

*   🌐 [MCP Discord](https://discord.gg/modelcontextprotocol)
*   🌐 [LangChain Discord](https://discord.gg/langchain)
*   🌐 [OpenAI Forum](https://community.openai.com/)

***

## 附录：完整代码模板

### Skill 项目结构

    ai-skills/
    ├── skills/
    │   ├── customerSkill.js          # 客户相关技能
    │   ├── emailSkill.js              # 邮件相关技能
    │   ├── reportSkill.js             # 报告生成技能
    │   └── __tests__/
    │       ├── customerSkill.test.js
    │       └── emailSkill.test.js
    ├── lib/
    │   ├── database.js                # 数据库客户端
    │   ├── cache.js                   # 缓存工具
    │   └── validator.js               # 参数验证
    ├── middleware/
    │   ├── auth.js                    # 权限验证
    │   ├── rateLimit.js               # 限流
    │   └── monitoring.js              # 监控
    ├── utils/
    │   ├── errors.js                  # 错误类定义
    │   └── helpers.js                 # 辅助函数
    ├── config/
    │   ├── skills.json                # 技能配置
    │   └── permissions.json           # 权限配置
    ├── index.js                       # 入口文件
    ├── package.json
    └── README.md

### 快速启动脚本

```bash
#!/bin/bash
# quick-start.sh

echo "🚀 Creating AI Skill project..."

# 创建目录结构
mkdir -p ai-skills/{skills,lib,middleware,utils,config}
cd ai-skills

# 初始化 npm 项目
npm init -y

# 安装依赖
npm install @modelcontextprotocol/sdk express dotenv

# 创建基础文件
cat > index.js << 'EOF'
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  { name: 'my-ai-skills', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// 在这里添加你的 skills...

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ AI Skills Server running');
}

main();
EOF

echo "✅ Project created! Next steps:"
echo "1. cd ai-skills"
echo "2. Edit index.js to add your skills"
echo "3. node index.js to start"
```

***

**开始构建你的第一个 AI Skill 吧！🎯**

*有问题？欢迎在评论区讨论！*

***

**相关文章：**

*   《AI 时代必备技能指南：从 Prompt 新手到 AI 专家的进阶路线》
*   《深入理解 Model Context Protocol：从零构建 AI 知识库服务》
*   《AI Tools 完全指南：从选择到集成的全链路实践》

