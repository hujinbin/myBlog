---
title: Web3.js v4 完整使用指南
date: 2025-08-09 23:19:06
tags: ['Web3.js', '以太坊', 'DApp开发', '智能合约', '区块链']
---


# Web3.js v4 完整使用指南
***

## 一、什么是 Web3.js？

Web3.js 是以太坊官方维护的 JavaScript 库，让前端/Node.js 应用能够：

*   连接以太坊节点（本地或远程）
*   读取链上数据（区块信息、账户地址）
*   调用智能合约只读方法，查询链上状态
*   使用内置工具函数处理地址、哈希、编码等

v4 是一次重大重写，完全用 TypeScript 实现，支持 ES Module，体积更小，API 更现代化。

***

## 二、安装

```bash
npm install web3
```

> **注意**：v4 不再捆绑 `web3-providers-http` 等子包，所有提供者均已内置。

***

## 三、连接节点（Provider）

Web3 需要一个"提供者"来与以太坊网络通信，常见的有以下三种：

### 3.1 浏览器钱包（MetaMask）

这是 DApp 开发中最常用的方式，MetaMask 会在 `window.ethereum` 上注入提供者。

```typescript
import Web3 from 'web3';

async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error('请先安装 MetaMask');
  }

  // 实例化 Web3，传入 MetaMask 提供者
  const web3 = new Web3(window.ethereum);

  // 弹出授权弹窗，请求用户账户权限
  const accounts: string[] = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  console.log('已连接账户:', accounts[0]);
  return accounts[0];
}
```

### 3.2 HTTP RPC 节点

适合服务端脚本或只读查询（不需要签名）。

```typescript
import Web3 from 'web3';

// 使用公共节点（Infura / Alchemy / 本地 Hardhat）
const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');
// 或本地开发节点
// const web3 = new Web3('http://127.0.0.1:8545');
```

### 3.3 WebSocket 节点

实时监听链上事件时使用 WebSocket 提供者：

```typescript
const web3 = new Web3('wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID');
```

***

## 四、获取账户地址

### 4.1 获取当前连接账户

```typescript
const accounts = await web3.eth.getAccounts();
const myAccount = accounts[0];
console.log('当前账户:', myAccount);
// 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

### 4.2 获取网络信息

```typescript
// 获取当前链 ID（v4 返回 BigInt）
const chainId = await web3.eth.getChainId();
console.log('Chain ID:', chainId.toString()); // 例：1n（以太坊主网）

// 获取当前节点的网络 ID
const networkId = await web3.eth.net.getId();
console.log('Network ID:', networkId.toString());
```

***

## 五、查询区块信息

### 5.1 获取最新区块

```typescript
const latestBlock = await web3.eth.getBlockNumber();
console.log('最新区块高度:', latestBlock.toString());
// 例：19800000n  (v4 返回 BigInt)

const block = await web3.eth.getBlock(latestBlock);
console.log('区块时间戳:', block.timestamp);
console.log('区块哈希:', block.hash);
console.log('矿工地址:', block.miner);
console.log('交易数量:', block.transactions.length);
```

### 5.2 按区块号或哈希查询

```typescript
// 按区块号查询
const block = await web3.eth.getBlock(19000000n);

// 按哈希查询
const blockByHash = await web3.eth.getBlock('0xabc123...');

// 获取特定区块中的交易哈希列表
const blockWithTxs = await web3.eth.getBlock('latest', false);
console.log('交易哈希列表:', blockWithTxs.transactions);
```

***

## 六、与智能合约交互（只读）

合约只读查询需要：

1.  **合约地址**：已部署合约在区块链上的地址
2.  **ABI**：合约接口描述（JSON 格式）

### 6.1 实例化合约

```typescript
import Web3 from 'web3';
import PetCoinABI from './abis/PetCoinABI.json';

const web3 = new Web3(window.ethereum);
const CONTRACT_ADDRESS = '0x1234567890abcdef...';

// 创建合约实例
const contract = new web3.eth.Contract(PetCoinABI as any, CONTRACT_ADDRESS);
```

### 6.2 调用只读方法（call）

`call` 不消耗 Gas，不改变链上状态，适合所有数据查询场景：

```typescript
// 查询代币余额
const balance = await contract.methods.balanceOf(myAccount).call();
console.log('代币余额:', balance);

// 查询代币名称
const name = await contract.methods.name().call();
console.log('代币名称:', name); // 'PetCoin'

// 查询代币总量
const totalSupply = await contract.methods.totalSupply().call();
console.log('总发行量:', totalSupply);
```

### 6.3 并发查询多个数据

使用 `Promise.all` 并发请求，减少等待时间：

```typescript
const [name, symbol, decimals, totalSupply] = await Promise.all([
  contract.methods.name().call(),
  contract.methods.symbol().call(),
  contract.methods.decimals().call(),
  contract.methods.totalSupply().call(),
]);

console.log(`${name} (${symbol})，精度: ${decimals}，总量: ${totalSupply}`);
```

### 6.4 查询历史事件日志

通过 `getPastEvents` 读取合约过去发出的事件（只读，无需签名）：

```typescript
// 查询所有历史事件（指定区块范围）
const events = await contract.getPastEvents('PetAdopted', {
  filter: {
    owner: myAccount, // 按字段过滤
  },
  fromBlock: 0,
  toBlock: 'latest',
});

events.forEach((event) => {
  const { petId, name, owner } = event.returnValues as any;
  console.log(`宠物 #${petId} "${name}" 被 ${owner} 领养`);
  console.log('所在区块:', event.blockNumber);
});
```

***

## 七、实用工具函数

Web3.js 内置了大量工具函数，无需引入额外依赖：

```typescript
const { utils } = web3;

// 地址校验与格式化
utils.isAddress('0xabc...');          // 检查是否合法以太坊地址
utils.toChecksumAddress('0xabc...');  // 转换为 EIP-55 校验和地址

// 哈希计算
utils.keccak256('Hello Web3');        // Keccak-256 哈希
utils.sha3('Hello Web3');             // 同上（别名）

// 十六进制编解码
utils.utf8ToHex('Hello');             // '0x48656c6c6f'
utils.hexToUtf8('0x48656c6c6f');      // 'Hello'
utils.numberToHex(255);               // '0xff'
utils.hexToNumber('0xff');            // 255
utils.hexToBytes('0xff');             // Uint8Array([255])

// 大数运算（避免 JavaScript 精度问题，v4 原生支持 BigInt）
const a = BigInt('999999999999999999');
const b = BigInt('1');
console.log((a + b).toString());      // '1000000000000000000'
```

***

## 八、React + TypeScript 中的最佳实践

在 React 项目中使用 Web3.js，推荐封装为自定义 Hook 或 Redux Slice：

```typescript
// hooks/useWeb3.ts
import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';

interface Web3State {
  web3: Web3 | null;
  account: string | null;
  chainId: bigint | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWeb3() {
  const [state, setState] = useState<Web3State>({
    web3: null,
    account: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState((s) => ({ ...s, error: '请安装 MetaMask' }));
      return;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      const web3 = new Web3(window.ethereum);
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const chainId = await web3.eth.getChainId();

      setState({
        web3,
        account: accounts[0],
        chainId,
        isConnecting: false,
        error: null,
      });
    } catch (err: any) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: err.message ?? '连接失败',
      }));
    }
  }, []);

  // 监听账户/网络切换
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      setState((s) => ({ ...s, account: accounts[0] ?? null }));
    };

    const handleChainChanged = () => {
      // 官方建议网络切换后刷新页面
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  return { ...state, connect };
}
```

使用示例：

```tsx
import { useWeb3 } from './hooks/useWeb3';

function App() {
  const { account, chainId, isConnecting, error, connect } = useWeb3();

  return (
    <div>
      {account ? (
        <p>已连接：{account}（Chain ID: {chainId?.toString()}）</p>
      ) : (
        <button onClick={connect} disabled={isConnecting}>
          {isConnecting ? '连接中...' : '连接钱包'}
        </button>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

***

## 九、常见错误与解决方案

| 错误信息                             | 原因                         | 解决方案                          |
| -------------------------------- | -------------------------- | ----------------------------- |
| `window.ethereum is undefined`   | 未安装 MetaMask 或在 Node.js 环境 | 检测环境后给用户提示                    |
| `User rejected the request`      | 用户点击了"拒绝"                  | catch 后给出友好提示，不要重复弹出          |
| `execution reverted`             | 合约 require 条件不满足           | 检查合约方法参数是否正确                  |
| `Cannot read properties of null` | web3 未初始化就调用方法             | 确保先 `await connect()` 后再调用    |
| `invalid address`                | 传入地址格式有误                   | 使用 `utils.isAddress()` 校验后再传入 |

***

## 十、安全注意事项

1.  **绝不在前端存储私钥**：前端代码对用户可见，私钥一旦暴露资产即丢失。
2.  **校验地址格式**：使用 `web3.utils.isAddress()` 验证用户输入的地址，防止注入攻击。
3.  **校验网络 ID**：合约只部署在特定网络，连接前验证 `chainId` 防止在错误网络操作。
4.  **避免信任链下数据**：链上 `call()` 返回的数据是可信的，但前端显示时仍需做基础类型校验。

```typescript
// 网络校验示例
const EXPECTED_CHAIN_ID = 11155111n; // Sepolia 测试网

const chainId = await web3.eth.getChainId();
if (chainId !== EXPECTED_CHAIN_ID) {
  throw new Error(`请切换到正确的网络（当前 Chain ID: ${chainId}）`);
}

// 地址输入校验示例
function safeGetContract(address: string) {
  if (!web3.utils.isAddress(address)) {
    throw new Error('非法合约地址');
  }
  return new web3.eth.Contract(ABI, address);
}
```

***

## 总结

| 功能          | API                                                   |
| ----------- | ----------------------------------------------------- |
| 连接 MetaMask | `new Web3(window.ethereum)`                           |
| 请求账户        | `ethereum.request({ method: 'eth_requestAccounts' })` |
| 获取账户列表      | `web3.eth.getAccounts()`                              |
| 获取链 ID      | `web3.eth.getChainId()`                               |
| 查询区块        | `web3.eth.getBlock(blockNumber)`                      |
| 合约实例化       | `new web3.eth.Contract(ABI, address)`                 |
| 只读调用        | `contract.methods.xxx().call()`                       |
| 查询历史事件      | `contract.getPastEvents(name, options)`               |
| 地址校验        | `web3.utils.isAddress(addr)`                          |
| 哈希计算        | `web3.utils.keccak256(data)`                          |

Web3.js v4 配合 TypeScript 使用体验极佳，ABI 类型推断、BigInt 原生支持，让 DApp 数据查询更安全可靠。

***

*参考资料：[Web3.js 官方文档](https://docs.web3js.org/) | [以太坊开发文档](https://ethereum.org/developers)*
