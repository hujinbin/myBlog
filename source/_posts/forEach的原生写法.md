---
title: forEach的原生写法
date: 2019-12-29 12:20:12
tags: [javascript]
---



### forEach

作用: 循环遍历数组
特点:
不改变原数组，返回值为undefined。
改变不了数组的遍历(return/break不好使，会报错)

源码实现

```
Array.prototype.myForEach = function(func) {
  var len = this.length;
  for(var i = 0; i < len; i++) {
      func(this[i], i);
  }
}
```