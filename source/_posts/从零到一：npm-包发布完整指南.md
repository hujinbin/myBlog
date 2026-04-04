---
title: 从零到一：npm 包发布完整指南
date: 2022-06-25 23:39:29
tags: [javascript,node]
---


# 从零到一：npm 包发布完整指南

> 一篇全面的 npm 包开发与发布教程，带你掌握从创建到维护的完整流程

## 📋 目录

*   [前言](#前言)
*   [环境准备](#环境准备)
*   [创建 npm 包](#创建-npm-包)
*   [配置 package.json](#配置-packagejson)
*   [编写代码](#编写代码)
*   [本地测试](#本地测试)
*   [发布到 npm](#发布到-npm)
*   [版本管理](#版本管理)
*   [最佳实践](#最佳实践)
*   [常见问题](#常见问题)

***


<!--more-->

## 前言

npm (Node Package Manager) 是 JavaScript 生态系统中最大的包管理器。通过发布 npm 包，你可以：

*   🌍 **分享代码**：将你的工具库分享给全世界的开发者
*   🔄 **代码复用**：在多个项目中复用相同的代码
*   🤝 **开源贡献**：参与开源社区，获得反馈和贡献
*   📈 **技术影响力**：建立个人技术品牌

本文将详细介绍如何创建、开发和发布一个 npm 包。

***

## 环境准备

### 1. 安装 Node.js 和 npm

首先确保你的系统已安装 Node.js，npm 会随 Node.js 一起安装。

```bash
# 检查 Node.js 版本
node -v
# 输出示例: v18.16.0

# 检查 npm 版本
npm -v
# 输出示例: 9.5.1
```

**推荐版本**：

*   Node.js: v16.x 或更高
*   npm: v8.x 或更高

### 2. 注册 npm 账号

访问 [npm 官网](https://www.npmjs.com/) 注册账号，或使用命令行注册：

```bash
npm adduser
```

按提示输入：

*   Username（用户名）
*   Password（密码）
*   Email（邮箱，需验证）

### 3. 登录 npm

```bash
npm login
```

验证登录状态：

```bash
npm whoami
# 输出你的用户名
```

***

## 创建 npm 包

### 1. 初始化项目

创建项目目录并初始化：

```bash
# 创建项目目录
mkdir my-awesome-package
cd my-awesome-package

# 初始化 npm 项目
npm init
```

或使用快速初始化（使用默认值）：

```bash
npm init -y
```

### 2. 项目结构

推荐的项目结构：

    my-awesome-package/
    ├── src/                  # 源代码目录
    │   └── index.js         # 主入口文件
    ├── dist/                # 构建输出目录（如果需要）
    ├── test/                # 测试文件
    │   └── index.test.js
    ├── .gitignore          # Git 忽略文件
    ├── .npmignore          # npm 发布忽略文件
    ├── README.md           # 项目说明文档
    ├── LICENSE             # 开源协议
    └── package.json        # 包配置文件

### 3. 创建必要文件

**创建 `.gitignore`**

```bash
echo "node_modules/
dist/
.DS_Store
*.log
.env" > .gitignore
```

**创建 `.npmignore`**

```bash
echo "src/
test/
.gitignore
.eslintrc.js
.prettierrc
*.test.js" > .npmignore
```

***

## 配置 package.json

`package.json` 是 npm 包的核心配置文件，以下是详细配置说明：

```json
{
  "name": "my-awesome-package",
  "version": "1.0.0",
  "description": "一个很棒的 npm 包",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "rollup -c",
    "test": "jest",
    "prepublishOnly": "npm run build && npm test"
  },
  "keywords": [
    "javascript",
    "utility",
    "helper"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/my-awesome-package.git"
  },
  "bugs": {
    "url": "https://github.com/username/my-awesome-package/issues"
  },
  "homepage": "https://github.com/username/my-awesome-package#readme",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=14.0.0"
  },
  "devDependencies": {
    "rollup": "^3.20.0",
    "jest": "^29.5.0"
  },
  "dependencies": {}
}
```

### 重要字段说明

| 字段            | 说明                                   | 必填 |
| ------------- | ------------------------------------ | -- |
| `name`        | 包名称，必须唯一                             | ✅  |
| `version`     | 版本号，遵循 [SemVer](https://semver.org/) | ✅  |
| `description` | 包的简短描述                               | ⭐  |
| `main`        | CommonJS 入口文件                        | ⭐  |
| `module`      | ES Module 入口文件                       | 推荐 |
| `types`       | TypeScript 类型定义文件                    | 推荐 |
| `keywords`    | 关键词，用于搜索                             | ⭐  |
| `author`      | 作者信息                                 | ⭐  |
| `license`     | 开源协议                                 | ⭐  |
| `repository`  | 代码仓库地址                               | 推荐 |
| `files`       | 要发布的文件列表                             | 推荐 |

***

## 编写代码

### 示例 1：简单工具函数库

**src/index.js**

```javascript
/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的日期
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day);
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

### 示例 2：TypeScript 项目

**src/index.ts**

```typescript
/**
 * 格式化日期
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  const clonedObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

/**
 * 防抖函数类型
 */
type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): DebouncedFunction<T> {
  let timeout: NodeJS.Timeout | null;
  
  const debounced = function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debounced as DebouncedFunction<T>;
}
```

**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

***

## 本地测试

### 方法 1：npm link

在你的包目录中：

```bash
# 在包目录中创建全局链接
npm link
```

在测试项目中：

```bash
# 链接到本地包
npm link my-awesome-package
```

使用完毕后解除链接：

```bash
# 在测试项目中
npm unlink my-awesome-package

# 在包目录中
npm unlink
```

### 方法 2：本地安装

```bash
# 在测试项目中
npm install /path/to/my-awesome-package
```

### 方法 3：使用测试框架

**安装 Jest**

```bash
npm install --save-dev jest @types/jest
```

**test/index.test.js**

```javascript
import { formatDate, deepClone, debounce } from '../src/index';

describe('formatDate', () => {
  test('should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('2024-01-15');
  });
});

describe('deepClone', () => {
  test('should deep clone object', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });
});

describe('debounce', () => {
  test('should debounce function calls', (done) => {
    let count = 0;
    const debouncedFn = debounce(() => count++, 100);
    
    debouncedFn();
    debouncedFn();
    debouncedFn();
    
    setTimeout(() => {
      expect(count).toBe(1);
      done();
    }, 150);
  });
});
```

运行测试：

```bash
npm test
```

***

## 发布到 npm

### 1. 预发布检查

在发布前，确保：

*   ✅ 代码已测试通过
*   ✅ README.md 文档完善
*   ✅ package.json 配置正确
*   ✅ 版本号符合规范
*   ✅ .npmignore 配置正确

### 2. 构建项目

如果需要编译或打包：

```bash
npm run build
```

### 3. 发布包

**首次发布**

```bash
npm publish
```

**发布作用域包（scoped package）**

```bash
# 公开发布
npm publish --access public

# 私有发布（需要付费账号）
npm publish --access restricted
```

### 4. 验证发布

访问 npm 官网查看你的包：

    https://www.npmjs.com/package/my-awesome-package

或使用命令查看：

```bash
npm view my-awesome-package
```

### 5. 安装测试

在其他项目中安装测试：

```bash
npm install my-awesome-package
```

***

## 版本管理

### 语义化版本（SemVer）

版本号格式：`主版本号.次版本号.修订号`（如 `1.2.3`）

*   **主版本号**：不兼容的 API 修改
*   **次版本号**：向下兼容的功能性新增
*   **修订号**：向下兼容的问题修正

### 版本更新命令

```bash
# 修订号 +1 (1.0.0 -> 1.0.1)
npm version patch

# 次版本号 +1 (1.0.0 -> 1.1.0)
npm version minor

# 主版本号 +1 (1.0.0 -> 2.0.0)
npm version major
```

### 发布新版本

```bash
# 1. 更新版本号
npm version patch

# 2. 推送到 Git（如果有）
git push && git push --tags

# 3. 发布到 npm
npm publish
```

### 版本标签

```bash
# 发布 beta 版本
npm publish --tag beta

# 发布 next 版本
npm publish --tag next

# 安装特定标签的版本
npm install my-awesome-package@beta
```

***

## 最佳实践

### 1. 文档规范

**README.md 模板**

````markdown
# My Awesome Package

> 一句话描述你的包

[![npm version](https://badge.fury.io/js/my-awesome-package.svg)](https://www.npmjs.com/package/my-awesome-package)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 安装

\`\`\`bash
npm install my-awesome-package
\`\`\`

## 快速开始

\`\`\`javascript
import { formatDate } from 'my-awesome-package';

const date = new Date();
console.log(formatDate(date)); // 2024-01-15
\`\`\`

## API 文档

### formatDate(date, format)

格式化日期

**参数：**
- `date` (Date): 日期对象
- `format` (string): 格式字符串，默认 'YYYY-MM-DD'

**返回值：**
- (string): 格式化后的日期字符串

**示例：**
\`\`\`javascript
formatDate(new Date(), 'YYYY-MM-DD'); // '2024-01-15'
\`\`\`

## 许可证

MIT © [Your Name]
\`\`\`

### 2. 选择合适的开源协议

常见开源协议：

- **MIT**：最宽松，允许商用、修改、分发
- **Apache 2.0**：类似 MIT，但提供专利保护
- **GPL**：要求衍生作品也开源
- **ISC**：类似 MIT，更简洁

### 3. 添加 CI/CD

**GitHub Actions 示例**

`.github/workflows/publish.yml`

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
````

### 4. 包大小优化

```bash
# 查看包大小
npm pack --dry-run

# 分析包内容
npm pack
tar -xvzf *.tgz
```

优化建议：

*   使用 `.npmignore` 排除不必要的文件
*   压缩代码（使用 Rollup、Webpack 等）
*   按需加载（提供 ESM 版本）

### 5. 发布前检查清单

```bash
# 安装发布前检查工具
npm install -g publint

# 检查包配置
publint
```

***

## 常见问题

### 1. 包名已被占用

**错误信息：**

    npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/my-package - You do not have permission to publish "my-package". Are you logged in as the correct user?

**解决方案：**

*   更换包名
*   使用作用域包：`@username/package-name`

```bash
# 修改 package.json
{
  "name": "@myusername/my-package"
}

# 发布作用域包
npm publish --access public
```

### 2. 版本号已存在

**错误信息：**

    npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/my-package - You cannot publish over the previously published versions

**解决方案：**

```bash
# 更新版本号
npm version patch

# 重新发布
npm publish
```

### 3. 未登录或登录过期

**错误信息：**

    npm ERR! need auth This command requires you to be logged in.

**解决方案：**

```bash
# 重新登录
npm login

# 验证登录状态
npm whoami
```

### 4. 发布被拒绝（需要邮箱验证）

**解决方案：**

1.  检查注册邮箱
2.  点击验证链接
3.  重新发布

### 5. 撤销已发布的包

```bash
# 撤销特定版本（发布后 72 小时内）
npm unpublish my-package@1.0.0

# 撤销整个包（慎用！）
npm unpublish my-package --force
```

⚠️ **注意**：撤销包可能影响依赖该包的其他项目，请谨慎操作。

### 6. 更新包信息

```bash
# 废弃某个版本
npm deprecate my-package@1.0.0 "This version has bugs, please upgrade to 1.0.1"

# 废弃所有版本
npm deprecate my-package "*" "Package no longer maintained"
```

***

## 进阶技巧

### 1. 发布 TypeScript 包

**package.json 配置**

```json
{
  "name": "my-ts-package",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc && rollup -c",
    "prepublishOnly": "npm run build"
  }
}
```

### 2. Monorepo 发布

使用 Lerna 或 pnpm 管理多包项目：

```bash
# 使用 Lerna
npx lerna publish

# 使用 pnpm
pnpm -r publish
```

### 3. 自动化发布

**使用 semantic-release**

```bash
npm install --save-dev semantic-release

# .releaserc.json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github"
  ]
}
```

### 4. 生成 CHANGELOG

```bash
# 使用 conventional-changelog
npm install -g conventional-changelog-cli

# 生成 CHANGELOG
conventional-changelog -p angular -i CHANGELOG.md -s
```

***

## 总结

发布 npm 包的完整流程：

1.  ✅ **环境准备**：安装 Node.js、注册 npm 账号
2.  ✅ **创建项目**：初始化项目、配置 package.json
3.  ✅ **编写代码**：实现功能、编写测试
4.  ✅ **本地测试**：使用 npm link 或测试框架
5.  ✅ **发布包**：npm publish
6.  ✅ **版本管理**：遵循语义化版本规范
7.  ✅ **持续维护**：更新文档、修复 bug、发布新版本

### 推荐工具

*   **开发工具**：TypeScript、ESLint、Prettier
*   **构建工具**：Rollup、esbuild、tsup
*   **测试工具**：Jest、Vitest
*   **文档工具**：TypeDoc、VitePress
*   **发布工具**：semantic-release、np

### 学习资源

*   [npm 官方文档](https://docs.npmjs.com/)
*   [语义化版本规范](https://semver.org/lang/zh-CN/)
*   [开源许可证选择](https://choosealicense.com/)
*   [如何写好 README](https://github.com/matiassingers/awesome-readme)

***

## 关于作者

如果这篇文章对你有帮助，欢迎：

*   ⭐ Star 我的 GitHub 项目
*   📝 关注我的技术博客
*   💬 留言交流你的想法

**Happy Coding! 🚀**

***

