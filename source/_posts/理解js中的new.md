---
title: 理解js中的new
date: 2021-10-23 22:17:01
tags: [javascript]
---

*  新生成了一个对象
*  链接到原型
*  绑定 this
*  返回新对象

在调用 new 的过程中会发生以上四件事情，我们也可以试着来自己实现一个 new

```
function create() {
    // 创建一个空的对象
    let obj = new Object()
    // 获得构造函数
    let Con = [].shift.call(arguments)
    // 链接到原型
    obj.__proto__ = Con.prototype
    // 绑定 this，执行构造函数
    let result = Con.apply(obj, arguments)
    // 确保 new 出来的是个对象
    return typeof result === 'object' ? result : obj
}

```

<!--more-->

对于实例对象来说，都是通过 new 产生的，无论是 function Foo() 还是 let a = { b : 1 } 。

对于创建一个对象来说，更推荐使用字面量的方式创建对象（无论性能上还是可读性）。因为你使用 new Object() 的方式创建对象需要通过作用域链一层层找到 Object，但是你使用字面量的方式就没这个问题。
```
function Foo() {}
// function 就是个语法糖
// 内部等同于 new Function()
let a = { b: 1 }
// 这个字面量内部也是使用了 new Object()
```
对于 new 来说，还需要注意下运算符优先级。
```
function Foo() {
    return this;
}
Foo.getName = function () {
    console.log('1');
};
Foo.prototype.getName = function () {
    console.log('2');
};

new Foo.getName();   // -> 1
new Foo().getName(); // -> 2

```
![img](http://cdn.leheavengame.com/jue/images/2706b040-6ad9-11ec-8ee3-f3ac29f825e3.jpg)

从上图可以看出，new Foo() 的优先级大于 new Foo ，所以对于上述代码来说可以这样划分执行顺序

```
new (Foo.getName());
(new Foo()).getName();
```
对于第一个函数来说，先执行了 Foo.getName() ，所以结果为 1；对于后者来说，先执行 new Foo() 产生了一个实例，然后通过原型链找到了 Foo 上的 getName 函数，所以结果为 2。
