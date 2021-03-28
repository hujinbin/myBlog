---
title: vue-cli自定义组件的引用
date: 2018-08-19 22:08:01
tags: [vue,javascript]
---



#### 在对应组件内引入组件

1.在components（专门放组件的文件）下创建一个header.vue文件
2.在App.vue文件里添加如下代码

```
 <my-head></my-head>



import myHead from './components/header'


  components : {
  myHead,
  }
```

<!--more-->

#### 全局组件的引用

注册一个全局组件语法格式如下：

```
Vue.component(tagName, options)
```



tagName 为组件名，options 为配置选项。注册后，我们可以使用以下方式来调用组件：

```
<tagName></tagName>
```



实例代码：

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>demo</title>
    <script src="static/js/vue.min.js"></script>
</head>
<body>
<!--全局组件-->
<div id="app">
    <uuihoo></uuihoo>
</div>
<script>
    //注册
    Vue.component('uuihoo',{
        template:'<h1>自定义全局组件</h1>'
    });
    //创建根实例
    new Vue({
        el:"#app"
    })
</script>
 
 
<!--局部组件-->
<div id="app1">
    <uuihoo1></uuihoo1>
</div>
<script>
    //创建根实例
    new Vue({
        el:'#app1',
        components:{
            //<uuihop>将只在模板可用
            'uuihoo1':{template:'<h1>自定义局部组件</h1>'}
        }
    })
</script>
</body>
</html>
```



注意事项：tagName不能和原生html标签同名。