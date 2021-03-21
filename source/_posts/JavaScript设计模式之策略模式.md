---
title: JavaScript设计模式之策略模式
date: 2018-05-22 14:55:22
tags: [javascript]
---



#### 策略模式：定义了一系列家族算法，并对每一种算法单独封装起来，让算法之间可以相互替换，独立于使用算法的客户。通俗的讲就是根据不同的参数可以定义不同的策略。

策略模式是JavaScript中比较经典的模式之一, 可以减少大量的if语句,可复用程度高

如下面的例子:

```
//清除字符空格
const trim = {
    'A': function (str, type) {
        return str.replace(/\s+/g, "");
    },
    'B': function (str, type) {
        return str.replace(/(^\s*)|(\s*$)/g, "");
    },
    'C': function (str, type) {
        return str.replace(/(^\s*)/g, "");
    },
    'D': function (str, type) {
        return str.replace(/(\s*$)/g, "");
    }
}
```