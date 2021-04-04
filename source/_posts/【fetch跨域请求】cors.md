---
title: 【fetch跨域请求】cors
date: 2018-12-31 21:28:56
tags: [javascript]
---



当使用fetch 发起跨域请求时，CORS（跨域资源共享Cross-origin resource sharing）

请求fetch

```
const body = {name:"Good boy"};
 fetch("http://leheavengame.com/API",{
     headers:{
         'content-type':'application/json'
     }
     method:'POST',
     body: JSON.stringify(body)
}).then(response =>  
     response.json().then(json => ({ json, response }))
).then(({ json, response }) => {
    if (!response.ok) {
      return Promise.reject(json);
    }
    return json;
}).then(
    response => response,
    error => error
  );
```

<!--more-->

如果服务器返回的 response 头包含 “Access-Control-Allow-Origin：*”或者* 为与请求源相同的地址。即服务器支持浏览器跨域访问。若不包含需求修改服务器端，与浏览器端请求。



### 如果服务器不支持CORS，fetch提供了三种模式，其中no-cors可以继续访问服务器

fetch的mode配置项有3个值，如下：

- same-origin：该模式是不允许跨域的，它需要遵守同源策略，否则浏览器会返回一个error告知不能跨域；其对应的response type为basic。
- cors: 该模式支持跨域请求，顾名思义它是以CORS的形式跨域；当然该模式也可以同域请求不需要后端额外的CORS支持；其对应的response
  type为cors。
- no-cors: 该模式用于跨域请求但是服务器不带CORS响应头，也就是服务端不支持CORS；这也是fetch的特殊跨域请求方式；其对应的response
  type为opaque。

针对跨域请求，cors模式是常见跨域请求实现，但是fetch自带的no-cors跨域请求模式则较为陌生，该模式有一个比较明显的特点：

该模式允许浏览器发送本次跨域请求，但是不能访问响应返回的内容，这也是其response type为opaque透明的原因。

注意： cors 支持 三种content-type 不支持 application/json

- application/x-www-form-urlencoded
- multipart/form-data
- text/plain

### 对于Express提供的服务端

为了能提供CORS服务
需要添加：

```
//设置跨域访问  
app.all('*', function(req, res, next) {  
    res.header("Access-Control-Allow-Origin", "*");  
    res.header("Access-Control-Allow-Headers", "X-Requested-With");  
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
    res.header("X-Powered-By",' 3.2.1')  
    res.header("Content-Type", "application/json;charset=utf-8");  
    next();  
});
```