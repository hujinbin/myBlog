---
title: 对于Webpack的简单理解
date: 2017-05-10 16:29:31
tags: javascript
---



#### 关于webpack:

webpack大而全，和静态资源相关的所有它都能干涉，当然，还能启动server；webpack主要以loaders和plugins处理各种静态资源；

#### loaders：

在React里会用到JSX、ES6、js，我统一将文件后缀使用.js，便于babel的配置：

npm install –save babel-loader

```
{
   test: /\.js?$/,
   exclude: /node_modules/,
   loader: 'babel',
   query: {
      presets: ['es2015', 'react']
   }
}
```





##### CSS、scss、iconfront字体文件：

npm install –save style-loader css-loader sass-loader url-loader file-loader

```
{
   test:/\.css$/,
   loader: ExtractTextPlugin.extract("style-loader", "css-loader")
},{
   test: /\.scss$/,
   loader: ExtractTextPlugin.extract("style-loader", "css!sass")
},{
   test: /\.(woff|woff2)/,
   loader: "url?limit=10000&minetype=application/font-woff&name=./[name].[ext]"
 },{
   test: /\.(ttf|eot|svg)/,
   loader: "file?name=./[name].[ext]"
},{
   test: /\.otf/,
   loader: "file?name=./[name].[ext]&minetype=application/font-otf"
}
```

<!--more-->

##### 想将css独立出来的话：

npm install –save extract-text-webpack-plugin

```
var plugins=[];
var ExtractTextPlugin = require('extract-text-webpack-plugin');
plugins.push(new ExtractTextPlugin('./app-[hash].css?[hash]'));
```

##### 处理图片：

npm install –save url-loader

```
{
   test:/\.(png|jpg|gif)$/,
   loader:'url-loader?limit=10&name=[name].[ext]'
}
```



多个loader通过！区分，同时接受查询参数以？连接，类似于用！区分多个url，比如：loader1?name=[name]-[hash].[ext]&limit=10000!loader2?xxx=xx；可以使用require语句加载loader，也可以通过配置中的正则表达式来绑定loader；

#### plugins：

html-webpack-plugin会由entry的配置将入口文件所属的html文件作为模板，重新生成一个html文件，其中的静态资源都已根据配置打包好，貌似很不错哦！不过有两个问题，还没解决：（1）、如果静态资源和主站是各自独立的站点，而将html作为静态资源对待的话，主站有路由相关配置的话，好像有点扯不开了；要是只在本地开发这样配置，各自独立上线的话，跨域时本地不便于测试；（2）、页面上的图片路径没做处理，可能要求有点多了。。。（3）、将html作为模板对待了，那么如何include其他模板；由于这三个原因，暂时不敢说html-webpack-plugin很适用，特别是第一点；继续探索中。

```
var plugins=[];
var HtmlWebpackPlugin = require('html-webpack-plugin');
plugins.push(new HtmlWebpackPlugin({
    template: './files/es6.html',
    filename: 'es6.html',
    title:'hhhhhh',
    inject: true,
    chunks:['entry1']//可以new多个html由entry区分
}));
```



使用webpack后，对文件的版本hash将变得非常简单：出口文件的name加上[hash]即可；可能现在来说，清除静态资源缓存最好的做法就是文件名hash了，注意不是加个后缀可以的；对于流量非常高的站点，即使等到三更半夜上线，如果仅仅加个后缀清缓存的话，也难免会出事，因为页面和静态资源同步时会有时间差，而在这个间隙有用户访问的话，页面出错的可能性就很大了；而文件名hash的方式就能很好的避免这个问题，由于每次改动后生成的文件名都不一样，上线并不是覆盖之前的版本，只是多了一个版本的文件，再上页面文件即使同步有时间差，要么访问旧版页面和旧版资源，要么访问新版页面新版资源，就不存在冲突了，这样服务器可以大胆的对静态资源开启永久强缓存，并且有利于回滚；至于静态资源由此产生的积压，交给运维处理吧！

使用html-webpack-plugin能很好的配合文件名hash，基于上面的小问题。。。

现在生成文件名hash很简单了，怎么对应页面一起改呢？

- 自己动手慢慢改去吧
- 页面由前端输出：生成map.json，根据这个配置读文件对应改资源引用的路径
- 页面由后端输出：生成map.json，后端读这个配置动态加载页面引用的资源路径

总之，就是要生成map.json，这里就简化了很多，因为不用管文件依赖了，webpack已将依赖文件打包到主文件里了；接下来就是读这个配置文件了，我也不知道，再探！。。。

由assets-webpack-plugin生成map.json：

```
var AssetsPlugin = require('assets-webpack-plugin');
plugins.push(new AssetsPlugin({
    filename: 'map.json',
    processOutput: function (assets) {
        return JSON.stringify(assets);
    }
}));
```



map.json大概这样：

```
{"entry1":
   {
     "js":"app-ed03f4fe.js",
     "css":"app-6f7f3cda3d230d8fa897.css"
   }
}
```