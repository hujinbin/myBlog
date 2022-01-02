---
title: pm2的基本使用
date: 2021-12-26 20:35:50
tags: [javascript,node]
---

### PM2

PM2 是一个带有负载均衡功能的 Node 应用进程管理器。

主要特性：

- 内建负载均衡（使用 Node cluster 集群模块）
- 后台运行
- 0 秒停机重载
- 具有 Ubuntu 和 CentOS 的启动脚本
- 停止不稳定的进程（避免无限循环）
- 控制台检测
- 提供 HTTP API
- 远程控制和实时的接口 API（Nodejs 模块，允许和 PM2 进程管理器交互）

<!--more-->

#### 全局安装pm2


```
npm install -g pm2
```

#### 启动进程

```javascript
pm2 start app.js
//重命名进程
pm2 start app.js --name wb123
//监听代码变化
pm2 start app.js --watch
```

#### 结束进程
```javascript
pm2 stop app.js
//结束所有进程
pm2 stop all
```


#### 删除进程
```javascript
pm2 delete www
//删除所有进程
pm2 delete all
```

#### 查看进程

```
//列出所有进程
pm2 list
//查看某个进程情况
pm2 describe app.js
//查看进程资源消耗情况
pm2 monit
```

#### PM2日志
```
pm2 logs
//查看某个进程的日志
pm2 logs app.js
```


#### 重启进程
```
pm2 restart app.js
//重启所有进程
pm2 restart all
```


#### PM2下使用 执行npm命令

```
npm run dev  等同于  pm2 start  npm -- run dev

npm start  等同于 pm2 start npm -- start 
```


#### 命名进程名
```
 pm2 start npm --name test -- run dev

 pm2 start npm --name test -- start 
```


语法： `pm2 start npm --watch --name <taskname> -- run <scriptname>`

其中 -- watch监听代码变化，-- name重命名任务名称，-- run后面跟脚本名字