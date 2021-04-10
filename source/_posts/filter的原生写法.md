---
title: filter的原生写法
date: 2020-03-21 22:35:03
tags: [javascript]
---



### filter

作用: filter筛选数组，筛选出新的数组。
特点: 筛选的值由return来决定，会放在一个新的数组中返回。

源码实现

```
Array.prototype.myFilter = function(func) {
  var len = this.length,
      newArr = [];
  for(var i = 0; i < len; i++) {
      if(func(this[i], i)) {
          newArr.push(this[i]);
      }
  }
  return newArr;
}
```