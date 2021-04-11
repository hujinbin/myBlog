---
title: 升级webpack 5实战
date: 2021-04-11 22:00:47
tags: javascript
---



升级webpack 5实战

## 一、背景

本次对公司项目进行webpack的升级 ， 原有版本是webpack4.42.1， 本次升级目标是webpack5.28.0，已经是很新的版本了。目标，升级Webpack5，应用长效缓存，提升构建速度。

## 二、步骤

按照官网[升级文档](https://webpack.docschina.org/migrate/5/)

"vue-loader": "^15.9.6",

"terser-webpack-plugin": "^5.1.1",

"style-loader": "^2.0.0",

"mini-css-extract-plugin": "^1.4.0",

"less-loader": "^8.0.0",

"html-webpack-plugin": "^5.3.1",

"file-loader": "^6.2.0",

"css-loader": "^5.2.0",

"compression-webpack-plugin": "^7.1.2",

"babel-loader": "^8.2.2",

"postcss-loader": "^5.2.0",

原有运行命令

"dev": "webpack-dev-server --inline --progress --config build/webpack.dev.conf.js",

wbepack4X版本使用webpack-dev-server，启动方式为：webpack-dev-server。

webpack5X修改为：webpack server

![img](http://cdn.leheavengame.com/jue/images/81817ea0-9ace-11eb-ac26-0f6ed95d4e69.jpg)

webpack、webpack-cli、webpack-dev-server是需要版本匹配的

原有匹配版本

"webpack": "^4.42.1",

"webpack-cli": "^3.3.11",

"webpack-dev-server": "^3.10.3",

升级版本

"webpack": "^5.28.0",

"webpack-cli": "^4.6.0",

"webpack-dev-server": "^3.11.2",

运行报错：webpack.NamedModulesPlugin is not a constructor

原有配置文件

plugins: [

new webpack.NamedModulesPlugin(),

],

改成用配置的方式即可

optimization: {

namedModules: true

},

查看文档发布 optimization.namedModules removed (NamedModulesPlugin too) 已经被移除了。

![img](http://cdn.leheavengame.com/jue/images/87ff5450-9ace-11eb-ac26-0f6ed95d4e69.jpg)

同时在 webpack4 上是默认设置，所以不需要设置这个选项即可。

webpack.HashedModuleIdsPlugin is not a constructor

报错去除

不兼容

报错弃用

new webpack.NamedModulesPlugin()

不兼容

报错弃用

new TerserPlugin(),

new HtmlWebpackPlugin({

chunksSortMode: 'dependency'

}),

报错，新版只支持 'none' | 'auto' | 'manual'

改为

new HtmlWebpackPlugin({

chunksSortMode: 'manual'

}),

webpack5已内置

TerserPlugin去除

devServer去除了很多旧的配置项目

![img](http://cdn.leheavengame.com/jue/images/900d8e00-9ace-11eb-ac26-0f6ed95d4e69.jpg)

实际上出错信息已经说明了问题原因：

Invalid configuration object. Object has been initialized using a configuration object that does not match the API schema.

这一段的意思是webpack.config.js错误，原因是这个配置文件的版本和我们当前安装的webpack的版本不匹配。

\- configuration has an unknown property 'disableHostCheck'.

然后逐步排查，去掉当前安装的webpack版本已经去掉的配置项目。

mode: process.env.NODE_ENV || 'production',

必须配置mode

webpack5移除了node环境的polyfill

![img](http://cdn.leheavengame.com/jue/images/96cab6a0-9ace-11eb-ac26-0f6ed95d4e69.jpg)

需要配置fallback

resolve: {

fallback: {

crypto: false

}

},

configuration.node不兼容

去除了node属性

node: {}

增加属性

optimization: {

chunkIds: "deterministic",

moduleIds: "deterministic",

mangleExports: "deterministic"

},

target: ['web', 'es5'],

// 5特有的文件监听

watchOptions: {

//默认为空，不监听的⽂件或者⽬录，⽀持正则

ignored: /node_modules/,

//监听到⽂件变化后，等300ms再去执⾏，默认300ms,

aggregateTimeout: 300,

poll: config.dev.poll,

},

// 5新增性能优化

performance: {

maxEntrypointSize: 4000000, // 入口起点的最大体积，控制 webpack 何时生成性能提示

maxAssetSize: 1000000, //单个资源体积(单位: bytes)，控制 webpack 何时生成性能提示

},

file-loader和url-loader删除

url-loader弃用， 使用 asset modules 代替

资源模块类型(asset module type)，通过添加 4 种新的模块类型，来替换所有这些 loader：

- asset/resource 发送一个单独的文件并导出 URL。之前通过使用 file-loader 实现。
- asset/inline 导出一个资源的 data URI。之前通过使用 url-loader 实现。
- asset/source 导出资源的源代码。之前通过使用 raw-loader 实现。
- asset 在导出一个 data URI 和发送一个单独的文件之间自动选择。之前通过使用 url-loader，并且配置资源体积限制实现。

在项目中url-loader改用 type: 'asset/resource'的形式

![img](http://cdn.leheavengame.com/jue/images/9c600110-9ace-11eb-ac26-0f6ed95d4e69.jpg)

当 webpack 配置中使用了 [hash] 占位符时，请考虑将它改为 [contenthash]。效果一致，但事实证明会更为有效。

## 三、总结

本次升级已经完成，在性能上，Webpack5除了未修改重编译，其他上表现并不如之前V4的性能好。在未来的工作上，我会继续关注这里性能为什么不如V4。

下面的脚手架是基于@vue/cli 4.5.8 版本构建，已将webpack3.6.0升级到5.28.0，可以直接下载使用。

[github地址](https://github.com/hujinbin/vue-seo-cli)

喜欢的给个star吧