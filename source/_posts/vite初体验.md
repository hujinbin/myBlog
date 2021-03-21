---
title: vite初体验
date: 2021-03-20 20:57:00
tags: [javascript]
---



Vite —— 一种新的、更快地 web 开发工具。



## vite 是什么

vite —— 一个由 vue 作者尤雨溪开发的 web 开发工具，它具有以下特点：

1. 1.快速的冷启动
2. 2.即时的模块热更新
3. 3.真正的按需编译

### Vite介绍

Vite，一个基于浏览器原生 ES imports 的开发服务器。利用浏览器去解析 imports，在服务器端按需编译返回，完全跳过了打包这个概念，服务器随起随用。同时不仅有 Vue 文件支持，还搞定了热更新，而且热更新的速度不会随着模块增多而变慢。针对生产环境则可以把同一份代码用 rollup 打包。



- [英文文档](https://vitejs.dev/)
- [中文文档](https://cn.vitejs.dev/)
- [GitHub](https://github.com/vitejs/vite)

<!--more-->

## 搭建第一个 Vite 项目

兼容性注意

Vite 需要 [Node.js](https://nodejs.org/en/) 版本 >= 12.0.0。

使用 NPM:

```
npm init @vitejs/app
```

使用 Yarn:

```
yarn create @vitejs/app
```



通过如下命令搭建

```
npm init vite-app <project-name>
cd <project-name>
npm install
npm run dev
```



搭建后的项目目录结构如下：

![img](http://cdn.leheavengame.com/jue/images/b8f1d830-8a0c-11eb-b6d5-ed05833f6b84.jpg)



因为 Vite 是一个基于原生 ESM 的开发服务器，所以可以看出是秒启动的。



![img](http://cdn.leheavengame.com/jue/images/968f3e30-8a0d-11eb-b6d5-ed05833f6b84.jpg)



初始化搭建的demo也比较简单



![img](http://cdn.leheavengame.com/jue/images/f748e690-8a0d-11eb-b6d5-ed05833f6b84.jpg)



看下package.json里的代码：



```
{
  "name": "vite-app",
  "version": "0.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "vue": "^3.0.4"
  },
  "devDependencies": {
    "vite": "^1.0.0-rc.13",
    "@vue/compiler-sfc": "^3.0.4"
  }
}
```



可以看出vite 是和 vue 3 搭配使用的。

vue 3 无论性能、包大小还有 ts 加持方面，vue 3 都远优于 vue 2的。 

而build的过程，是利用 Rollup 进行构建的。