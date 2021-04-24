---
title: reduce的原生写法
date: 2020-04-19 11:40:44
tags: [javascript]
---



### reduce

特点: reduce() 方法接收一个函数作为累加器，数组中的每个值（从左到右）开始缩减，最终计算为一个值。
源码实现

```
Array.prototype.myReduceRight = function(func, init) {
    var prev = init,
        len = this.length,
        k = len - 1; 
    if(init === undefined) {
        prev = this[k];
        k = len - 2;
    }
    for(k; k >= 0; k --) {
        prev = func(prev, this[k], k);
    }
    return prev;
}
```