---
title: Git提交规范保护
date: 2021-11-24 20:40:15
tags: [git]
---



### Git 规范

Git 作为现在最流行的分布式管理工具，基本上是每个团队的必备。



### Git Commit格式校验

- 准备commitlint/cli用于格式校验
- 准备husky用于git提交代码时触发校验



### husky

husky 是创建 git 客户端 hooks 的神器。

目前最新版本是 `7.*`，文档在[这里(opens new window)](https://typicode.github.io/husky/#/)

初始化 husky 只需要三步。首先要安装：

```sh
$ npm i husky --save-dev
```

执行下面的脚本，会初始化一个 `.husky` 目录：

```sh
$ npx husky install
```

初始化后，就可以添加 hook 了。

添加一个 `commit-msg` 钩子，并指定一个默认 shell：

```sh
$ npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'
```

现在在执行 `git commit` 之前，就会执行上面指定的 shell。

<!--more-->

### commitlint

上面的 shell 里有一个 `commitlint` 命令，其实它是另一个工具，用来校验 commit 提交信息，这是 `husky + commitlint` 这对黄金搭档的主要功能。

commitlint 的文档在[这里(opens new window)](https://github.com/conventional-changelog/commitlint/#what-is-commitlint)

为了直观的看出 commit 的更新内容，开发者社区诞生了一种规范，将 commit 按照功能划分，加一些固定前缀，比如 `fix:`，`feat:`，用来标记这个 commit 主要做了什么事情。

`commitlint` 命令就是校验 commit 信息是否符合上述规范，不符合，则会配合 husky 阻止提交。

首先安装 commitlint：

```sh
$ npm i @commitlint/{config-conventional,cli} --save-dev
```

然后创建配置文件：

```sh
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
```

这样就好了，然后我们随便改一处代码，试试效果：

```sh
$ git add .
$ git commit -m 'test'
```

因为 “test” 不符合 commit 规范，所以被阻止了，执行结果如下：

![WX20210922](https://cdn.leheavengame.com/jue/images/17d3fee0-4d04-11ec-bd84-7b06f37942db.jpg)

我们再试一下符合规范的提交格式：

```sh
$ git commit -m 'fix: 修复**功能'
```

这样就可以通过了！


### commit前缀

目前主流的前缀包括以下部分：

- build：表示构建，发布版本可用这个
- ci：更新 CI/CD 等自动化配置
- chore：杂项，其他更改
- docs：更新文档
- feat：常用，表示新增功能
- fix：常用：表示修复 bug
- perf：性能优化
- refactor：重构
- revert：代码回滚
- style：样式更改
- test：单元测试更改
