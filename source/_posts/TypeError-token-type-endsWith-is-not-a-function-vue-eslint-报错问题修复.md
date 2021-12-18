---
title: 'TypeError: token.type.endsWith is not a function vue eslint 报错问题修复'
date: 2021-12-18 13:51:17
tags: [javascript]
---



### **问题现象**


维护了很久的vue项目，发现 eslint 会报错

token.type.endsWith is not a function

<!--more-->



![img](http://cdn.leheavengame.com/jue/images/9e67d3f0-5a79-11ec-a8c0-0bcf79155200.jpg)



### 问题原因

babel-eslint npm包已被弃用，我们无法在下载到这个包，导致项目缺少依赖报错

### ![img](http://cdn.leheavengame.com/jue/images/17b91c00-5a7a-11ec-a8c0-0bcf79155200.jpg) 





### 问题解决

将弃用的babel-eslint 换成@babel/eslint-parser即可



移除 babel-eslint

添加：

```
"eslint": "7.30.0",
"eslint-plugin-vue": "6.2.2",
"@babel/eslint-parser": "7.15.8",
```



在.eslintrc.js文件内添加

```
parserOptions: {
   parser: '@babel/eslint-parser'
},
```



最后这个问题成功解决



issue上也有讨论过这个问题， #[issue](https://github.com/vuejs/eslint-plugin-vue/issues/349) 链接
