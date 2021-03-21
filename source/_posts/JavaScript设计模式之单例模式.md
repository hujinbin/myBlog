---
title: JavaScript设计模式之单例模式
date: 2018-05-28 14:56:52
tags: [javascript]
---



#### 单例模式概念：保证一个类只有一个实例。

概念：单例就是保证一个类只有一个实例，实现方法一般是先判断实例存在与否，如果存在直接返回，如果不存在就创建了再返回，这就确保了一个类只有一个实例对象。在JavaScript里，单例作为一个命名空间提供者，从全局命名空间里提供一个唯一的访问点来访问该对象。

#### 单例模式的作用和注意事项

模式作用：

1、模块间通信

2、系统中某个类的对象只能存在一个

3、保护自己的属性和方法

注意事项：

1、注意this的使用

2、闭包容易造成内存泄露，不需要的要赶快干掉

3、注意new的成本。（继承）

<!--more-->

#### 单例模式代码例子

最简单的实现方式，就是使用对象字面量的方法

```
let testSingleton_1 = {
    pt_1: 'test1',
    pt_2: 'test2',
    testFunc: function() {
        console.log('最简单的单例模式');
    }
}
```

如果要使用自己的私有变量和方法，可以使用闭包来封装这些属性和函数，只暴露出公有变量和方法即可

```
let testSingleton_2 = {

    let p_1 = '私有变量';
    function testFunc() {
        console.log('我是私有方法', p_1);
    }

    //暴露出的对象，你在里面可以定义你的想要给别人看到的东西
    return {
        p_2: '公有变量',
        testFunc_2: function() {
            console.log('公有方法');
            testFunc();
        }
    }
}
```

在使用的时候初始化可以提高效率

```
let testSingleton_3 = (function() {

    let instance;
    let p_1 = '私有变量';

    function testFunc() {
        console.log('我是私有方法', p_1);
    }

    function init() {
        //操作你的需求逻辑
        return {
            p_2: '公有变量',
            testFunc_2: function() {
                console.log('公有方法');
                testFunc();
            }
        }
    }

    return {
        getInstance: function() {
            if(!instance) {
                instance = init();
            }
            return instance;
        }
    }

})();
```

单例模式的宗旨就是保持一个类只有一个实例