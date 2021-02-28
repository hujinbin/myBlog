---
title: webpack优化
date: 2017-04-17 16:23:00
tags: javascript
---





# webpack优化之路

##### 1.别名alia

```
'react': (0, join)(__dirname, './node_modules/react/dist/react.min.js'),

resolve: {
    alias: alias,
},
```

##### 2.css-loader < 0.15.0

```
"css-loader": "^0.14.1",
```

##### 3.移除css-loader的sourcemap

这一步暂时没多大效果，继续下面的步骤

##### 4.外部引入模块

```
externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'reactUpdate': 'ReactUpdate',
    'antd': 'antd',
    "jquery": "jQuery",
    'AMap': 'window.AMap',
    'moment': 'moment',
    'react-dnd': 'ReactDnD',
    'react-router': 'ReactRouter'
},
```
<!--more-->
必须设置

```
output: {
    'libraryTarget': 'var',
},
```

然后html引入外部js

```
<script src="${assetsAt('react.min.js')}"></script>
<script src="${assetsAt('react-dom.min.js')}"></script>
```



##### 5.设置cache为true

```
cache: true,
```

##### 6.设置root

```
resolve: {
    root: [path.resolve('./src')],
},
```

##### 7.设置babel的cacheDirectory为true(打包性能提升很明显,相关链接)

```
/*
* babel参数
* */
var babelQuery = {
    presets: ['es2015', 'react', 'stage-0'],
    plugins: ['transform-runtime', 'add-module-exports', 'typecheck', "transform-decorators-legacy"],
    cacheDirectory: true
};

loaders: [
    {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: babelQuery
    }, {
        test: /\.jsx$/,
        loader: 'babel',
        query: babelQuery
    }
]
```

##### 8.一些loader的大小限制(限制小于多少才转为base64,让生成的文件最小)

```
loaders: [
    {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=application/font-woff'
    }, {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=application/font-woff'
    }, {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=application/octet-stream'
    }, {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file'
    }, {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=image/svg+xml'
    }, {
        test: /\.(wav|mp3)?$/,
        loader: 'url-loader?limit=8192'
    }
]
```

##### 9.noParse

如果你 确定一个模块中没有其它新的依赖 就可以配置这项，webpack 将不再扫描这个文件中的依赖。

```
module: {
    loaders: [

    ],
    noParse: [
        /moment-with-locales/
    ]
},
```



##### 10.拷贝静态文件

把指定文件夹xia的文件复制到指定的目录

```
var CopyWebpackPlugin = require('copy-webpack-plugin');

var copyFile = {
    production: [
        {from: 'src/static/antd-0.12.15.min.css', to: 'antd.min.css'},
        {from: 'src/static/antd-0.12.15.min.js', to: 'antd.min.js'},
        {from: 'src/static/jquery-2.2.1.min.js', to: 'jquery.min.js'},
        {from: 'src/static/react-15.0.1.min.js', to: 'react.min.js'},
        {from: 'src/static/react-dom-15.0.1.min.js', to: 'react-dom.min.js'},
        {from: 'src/static/react-update-0.14.6.min.js', to: 'react-update.min.js'},
        {from: 'src/static/favicon.ico', to: 'favicon.ico'},
        {from: 'src/static/moment-2.13.0.min.js', to: 'moment.min.js'},
        {from: 'src/static/react-dnd-2.1.4.min.js', to: 'react-dnd.min.js'},
        {from: 'src/static/react-router-1.0.3.min.js', to: 'react-router.min.js'}
    ],
    development: [
        {from: 'src/static/antd-0.12.15.min.css', to: 'antd.min.css'},
        {from: 'src/static/antd-0.12.15.min.js', to: 'antd.min.js'},
        {from: 'src/static/jquery-2.2.1.min.js', to: 'jquery.min.js'},
        {from: 'src/static/react-development-15.0.1.min.js', to: 'react.min.js'},
        {from: 'src/static/react-dom-development-15.0.1.min.js', to: 'react-dom.min.js'},
        {from: 'src/static/react-update-0.14.6.min.js', to: 'react-update.min.js'},
        {from: 'src/static/favicon.ico', to: 'favicon.ico'},
        {from: 'src/static/moment-2.13.0.min.js', to: 'moment.min.js'},
        {from: 'src/static/react-dnd-2.1.4.min.js', to: 'react-dnd.min.js'},
        {from: 'src/static/react-router-1.0.3.min.js', to: 'react-router.min.js'}
    ]};

new CopyWebpackPlugin(
    (runmod == 'devserver') ? copyFile.development : copyFile.production
),
```



##### 11.设置dll

原理就是将特定的模块在项目构建前构建好，然后通过页面引入。

##### 12.使用happypack

让loader多进程去处理文件。

```
var HappyPack = require('happypack');

loader:
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'babel',
    query: babelQuery,
    happy:   { id: 'babelJs' }
plugins:
    new HappyPack({
        id: 'babelJs' ,
        threads: 4
    }),
```