---
title: node版本切换工具n的使用介绍
date: 2021-09-12 17:33:33
tags: [javascript,node]
---


### node版本切换工具n的使用介绍

#### 全局安装
```
npm install -g n
```

mac的安装目录/usr/local/n/versions/node/13.2.0
因此首先在/usr/local/创建目录n，修改权限为普通访问权限，这样后续操作就不需要使用sudo

#### 基本操作

```
n x.x.x 安装某个版本
n latest 安装最新版本
n stable 安装稳定版本lts
n rm x.x.x 删除某个版本
n use 7.10.0 some.js 用制定的版本执行脚本
n 可以查看所有已安装的node版本，可以根据上下和回车选择要使用的版本
n help 帮助信息
n ls 查看已经安装的版本
n ls-remote --all 查看服务器上所有可用的版本
```