---
title: map的原生写法
date: 2020-03-29 22:36:25
tags: [javascript]
---



### map

特点:
map处理return出来的值，把值放在一个新的数组，默认返回undefined。
浅拷贝，会改变原数组。
浅度map实现

```
Array.prototype.myMap = function(func) {
    var len = this.length,
        newArr = [];
    for(var i = 0; i < len; i++) {
        newArr.push(func(this[i], i));
    }
    return newArr;
}
```

<!--more-->

深度map实现

```
// 深度克隆
function deepClone(target, option) {
    if(option !== null) {
        for(var  prop in option) {
            var src = target[prop],
                copy = option[prop];
            if(typeof(copy) === 'object') {
                if(Object.prototype.toString(copy) === '[object Array]') {
                    src = [];
                }else {
                    src = {};
                }
                target[prop] = deepClone(src, copy);
            }else {
                target[prop] = copy;
            }
        }
    }   
    return target;
}
Array.prototype.myMap = function(func) {
    var len = this.length,
        newArr = [];
    for(var i = 0; i < len; i++) {
        if(this[i] && Object.prototype.toString.call(this[i]) === '[object Object]') {
            var newObj = {};
            deepClone(newObj, this[i]);
            newArr.push(func(newObj, i));
        }else if(this[i] && Object.prototype.toString.call(this[i]) === '[object Array]') {
            var Arr = [];
            deepClone(newArr, this[i]);
            newArr.push(func(Arr, i));
        }else {
            newArr.push(func(this[i], i));
        }
    }
    return newArr;
}
```