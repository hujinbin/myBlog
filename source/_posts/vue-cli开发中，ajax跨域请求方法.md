---
title: vue-cli开发中，ajax跨域请求方法
date: 2017-09-24 20:57:58
tags: [Vue,javascript]
---



##### 使用vue-cli构建的项目，在开发时，想要访问后台接口获取数据，这时就会出现跨域问题。

在config/index.js中进行如下配置

【即在进行ajax请求时，地址中任何以/api开头的请求地址都被解析为目标地址，target就是你想要的后台接口地址】

```
  proxyTable: {
  '/api': {
    target: 'http://www.leheavengame.com', 
    changeOrigin: true,
    pathRewrite: {
    '^/api': ''
    }
  }
}
```





#### vue-resource调用示例

```
this.$http.get('/api/main/login', [data]).then(function(response){
    // 响应成功回调
}, function(response){
    // 响应错误回调
});
```

#### axios调用示例

```
axios({
  method: 'get',
  headers: {'Accept': '*/*'},
  url: '/api/main/login',
  data: data
})
.then(function (response) {
  console.log(response.data)
})
.catch(function (error) {
  console.log(error)
})
```

#### 讲解原理：
在配置中： target: ‘[http://www.leheavengame.com](http://www.leheavengame.com/)‘
在上方vue-resource示例中 第一个参数为： /api/user/login
就会被本地服务器自动解析为 http://www.leheavengame.com/main/login 而这个正式我们需要的地址。
跨域原理（本地文件假装在远程服务器上）：

通过浏览器打开页面，当发起请求时：本地服务器的地址（通常是localhost:8080或者127.0.0.1:8080）会收到这个请求，接下来发现这个请求地址中含有字符串 /api，那么本地服务器会将请求地址变为 [http://www.leheavengame.com](http://www.leheavengame.com/) （配置地址） + main/login（调用方法处的详细地址）。
同时本地服务器的地址会由localhost:8080 变为[http://www.leheavengame.com](http://www.leheavengame.com/) ，结果就是： 我们本地的文件会被认为是放在目标地址（[http://www.leheavengame.com](http://www.leheavengame.com/) ）服务器上的，当前服务器上的文件请求服务器其他东西，自然就不是跨域了。