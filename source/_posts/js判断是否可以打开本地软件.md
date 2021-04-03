---
title: js判断是否可以打开本地软件
date: 2018-10-14 12:18:57
tags: [javascript]
---



js 判断是否安装插件

需求：点击一个按钮，然后打开本地的软件。类似一些网站打开 qq 一样。但是后来遇到一个问题，如果本地没有安装这个指定的软件，则无法打开。所以需要判断当前的电脑是否已经安装指定软件，如果已安装，则打开软件；否则，弹出模态框，提示下载并安装软件。如果本地安装了插件，当尝试使用插件打开时，window后触发blur事件；如果无法打开插件，则什么都不会发生。

根据这个原理，进行一个简单的封装。（其实也不算是封装，只是简单的把其中的原理展现出来而已）

这里使用的是es5代码，主要是为了兼任低版本的浏览器，可以在理解其中的原理后，移植到相应的项目或者框架。



<!--more-->



```
// dom部分
<p class="link" data-link="blahblah:randomstuff">plugin 1</p>
<p class="link" data-link="mailto:johndoe@somewhere.com">plugin 2</p>
<p class="link" data-link="tencent://message">plugin 3</p>
// js部分
var links = document.getElementsByClassName('link')
var readyToBlur = false
var hasPlugin = null
var timeout = 1000
window.addEventListener('blur', function () {
 if (readyToBlur) {
 hasPlugin = true
 console.log('has plugin')
 }
})
for (var i = 0; i < links.length; i++) {
 (function (id, win) {
 links[id].addEventListener('click', function () {
 readyToBlur = true
 hasPlugin = false
 window.location.href = links[id].getAttribute('data-link')
 var t = setTimeout(function () {
 win.readyToBlur = false
 !hasPlugin && onHasNoPlugin(links[id].innerText)
 clearTimeout(t)
 }, timeout)
 })
 })(i, window)
}
function onHasNoPlugin(pluginName) {
 console.log('no plugin: ' + pluginName)
}
```

原理分析

打开本地插件（软件，例如 qq）的方法基本是让浏览器的 url 发生改变，一般有以下方法：

```
使用a标签，并使用href属性。<a href="plugin:data">plugin</a>
window.location.href = 'plugin:data'
window.open('plugin:data')
```



这里使用的是第二种方法。第一种不好做拦截，第三种无论是否安装都会打开一个新的窗口。

当尝试打开软件时，开始监听window的blur事件。在指定的事件内，如果触发了blur事件，说明软件已经安装，修改hasPlugin标识；否则无操作。然后当时间到期时，移除监听，并判断hasPlugin的值，如果为false，则说明没有安装插件，执行相应的处理函数。

##### 另外还需注意一点，这里设置的 timeout 是根据实际情况而定的，因为有一些软件打开的速度可能很慢，不会像 qq 这样的软件一点击就会马上打开，所以这里把监听的 timeout 设置为 1 秒。