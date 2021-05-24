---
title: 如何基于vue开发ui组件库（heaven-ui)
date: 2021-05-22 13:33:36
tags: [javascript]
---



## 前⾔

Vue是⼀套⽤于构建⽤户界⾯的渐进式框架,⽬前有越来越多的开发者在学习和使⽤。⽽组件库能帮我们节省开发精⼒，⽆需所有东⻄都从头开始去做，通过⼀个个⼩组件拼接起来，就得到了我们想要的最终⻚⾯。在⽇常开发中如果没有特定的⼀些业务需求，使⽤组件库进⾏开发⽆疑是更便捷⾼效，⽽且质量也相对更⾼的⽅案。

本⽂阐述了如何基于vue⼀步步完成⼀个UI组件库的打造。

[组件库官⽹](https://ui.leheavengame.com/)

[github地址](https://github.com/hujinbin/Heaven-UI)

[npm地址](https://www.npmjs.com/package/heaven-ui)

## ⼀、技术栈

我们先简单了解⼀下要搭建⼀个 UI 组件库，会涉及到哪些技术栈，下⾯是我选⽤的内容：

1. vue-cli：官⽅⽀持的 CLI 脚⼿架，提供⼀个零配置的现代构建设置；
2. Vue: 渐进式 JavaScript 库；
3. Jest：JavaScript 测试框架，⽤于组件库的单元测试；

<!--more-->

## ⼆、组件开发

项⽬初始化

开始，需要创建⼀个空的vue项⽬，在此基础上我们才能开始接下来的组件库编写！

```
npm i -g vue-cli // yarn add global vue-cli
vue init webpack heaven-ui  //(heaven-ui)可以随意更换成你的名称
cd heaven-ui
npm run dev
```

我们安装完依赖并进⼊项⽬启动服务后vue-cli3会⾃动给我们展示⼀个默认⻚⾯，这⾥我使⽤sass，⽤于美化ui组件的样式。

⽬录结构

这是我的⽬录结构和解释

```
|- build/ # webpack打包配置 
|- lib/ # 打包生成的文件放这里 
|- src/ # 在这里写代码 
    |- components/ # 各个组件，每个组件是一个子目录 
    |- mixins/ # 复用的mixin 
    |- utils # 工具目录 
    |- App.vue # 本地运行的开发预览
    |- index.js # 打包入口，组件的导出 
    |- main.js # 本地运行的运行
|- static/ # 存放一些额外的资源文件，图片之类的 
|- test/ # 测试文件夹 
    |- specs/ # 存放所有的测试用例 
    |- jest.conf.js/ # jest单元测试配置 
|- .npmignore 
|- .gitignore 
|- .babelrc 
|- README.md 
|- package.json
```

组件库结构

暴露⼀个所有组件的⼊⼝，组件详细代码只展示button部分

src/components/index.js

```
import Alert from './components/alert/index.js'
import Button from './components/button/index.js'
import ButtonGroup from './components/button-group/index.js'
import Checkbox from './components/checkbox/index.js'
import CheckboxGroup from './components/checkbox-group/index.js'
import DatePicker from './components/date-picker/index.js'
import Form from './components/form/index.js'
import FormItem from './components/form-item/index.js'
import Icon from './components/icon/index.js'
import Input from './components/input/index.js'
import Option from './components/option/index.js'
import Pagination from './components/pagination/index.js'
import Radio from './components/radio/index.js'
import RadioGroup from './components/radio-group/index.js'
import Rate from './components/rate/index.js'
import Select from './components/select/index.js'
import Switch from './components/switch/index.js'
import Table from './components/table/index.js'
import HTableColumn from './components/table-column/index.js'
import Tag from './components/tag/index.js'


const components = [
    Button,
    ButtonGroup,
    Checkbox,
    CheckboxGroup,
    DatePicker,
    Form,
    FormItem,
    Icon,
    Input,
    Option,
    Pagination,
    Radio,
    RadioGroup,
    Rate,
    Select,
    Switch,
    Table,
    HTableColumn,
    Tag,
  ]
  
  const install = function(Vue, opts = {}) {
    components.map(component => {
      Vue.component(component.name, component);
    })
    Vue.prototype.$alert = Alert;
  }

/* 支持使用标签的方式引入 */
if (typeof window !== 'undefined' && window.Vue) {
   install(window.Vue);
}

export default {
    install,
    Alert,
    Button,
    ButtonGroup,
    Checkbox,
    CheckboxGroup,
    DatePicker,
    Form,
    FormItem,
    Icon,
    Input,
    Option,
    Pagination,
    Radio,
    RadioGroup,
    Rate,
    Select,
    Switch,
    Table,
    HTableColumn,
    Tag,
}
```



src/components/button/index.js

```
import HButton from './src/button';

HButton.install = function(Vue) {
  Vue.component(HButton.name, HButton);
};

export default HButton;
```

组件部分⼤概是这样⼦了

![img](http://cdn.leheavengame.com/jue/images/23661840-bac1-11eb-94d9-83dd409de1e4.jpg)

#####  

##### 打包配置

⽬录建好了，那就该填充⾎⾁了，要打包⼀个组件库项⽬，肯定是要先配置好我们的webpack，不然写了源码也没法跑起来。所以我们先定位到 build⽬录下

webpack.base.js 。存放基本的⼀些rules配置

webpack.prod.js 。整个组件库的打包配置

build/webpack.base.conf.js

```
'use strict'
const path = require('path')
const utils = require('./utils')
const config = require('../config')
const vueLoaderConfig = require('./vue-loader.conf')

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = {
  context: path.resolve(__dirname, '../'),
  entry: {
    app: process.env.NODE_ENV === 'production' ? './src/index.js' : './src/main.js'
  },
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src'),
      'untils': resolve('src/untils'),
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src'), resolve('test'), resolve('node_modules/webpack-dev-server/client')]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('img/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.scss$/,
        loaders:['style','css','sass']
      }
    ]
  },
  node: {
    // prevent webpack from injecting useless setImmediate polyfill because Vue
    // source contains it (although only uses it if it's native).
    setImmediate: false,
    // prevent webpack from injecting mocks to Node native modules
    // that does not make sense for the client
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  }
}
```



build/webpack.prod.conf.js

```
'use strict'
const path = require('path')
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const env = require('../config/prod.env')

const webpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: true,
      usePostCSS: true
    })
  },
  devtool: config.build.productionSourceMap ? config.build.devtool : false,
  output: {
    path: config.build.assetsRoot,
    filename: 'heaven-ui.min.js',
    library: 'heaven-ui',
    libraryTarget: 'umd'
  },
  plugins: [
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
    new webpack.DefinePlugin({
      'process.env': env
    }),
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: {
          warnings: false
        }
      },
      sourceMap: config.build.productionSourceMap,
      parallel: true
    }),
    // extract css into its own file
    new ExtractTextPlugin({
      filename: 'heaven-ui.min.css',
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin()
  ]
})

if (config.build.productionGzip) {
  const CompressionWebpackPlugin = require('compression-webpack-plugin')

  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' +
        config.build.productionGzipExtensions.join('|') +
        ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
}

if (config.build.bundleAnalyzerReport) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
```



这⾥我配置的输出⽬录为lib，打包后的结果如下图：

## 三、单元测试

单元测试包含以下优点：

\1. 可能会测出功能的隐藏bug

\2. 保证代码重构的安全性。

组件库中每⼀个组件都可能会重构或者更新迭代，如果单元测试覆盖率⾼的话，修改代码之后就越可能会发现潜在的问题。⽐如版本升级后，导致某部分功能的缺失。

组件库开发调试完成后，我们需要编写每个组件对应的单元测试，以达到100%的覆盖率为⽬标。

以button为例：

test/specs/Button.spec.js

```
import Vue from 'vue'
import Button from '@/components/button'

describe('button.vue', () => {
  it('button是否存在',()=>{
    expect(Button).to.be.ok;
  })
})
```

这⾥我配置的输出⽬录为lib

## 四、发布NPM

发布npm之前，我们必须按照npm的发包规则来编写我们的package.json, 我们先来解决组件库打包的问题,⾸先我们需要让脚⼿架编译我们的组件代码,并输出到指定⽬录下,我们按照发包规范⼀般会输出到lib⽬录下。项⽬打包完成后，我们需要编写package⽂件的description,keywords等,具体介绍如下:

description 组件库的描述⽂本

keywords 组件库的关键词

license 许可协议

repository 组件库关联的git仓库地址

homepage 组件库展示的⾸⻚地址

main 组件库的主⼊⼝地址(在使⽤组件时引⼊的地址)

private 声明组件库的私有性,如果要发布到npm公⽹上,需删除该属性或者设置为false

publishConfig ⽤来设置npm发布的地址,这个配置作为团队内部的npm服务器来说⾮常关键,可以设置为私有的npm仓库

发布到npm的⽅法也很简单, ⾸先我们需要先注册去npm官⽹注册⼀个账号, 然后控制台登录即可,最后我们执⾏npm publish即

可.具体流程如下:

```
// 登录
npm login
// 发布
npm publish
// 如果发布失败提示权限问题,请执行以下命令
npm publish --access public
```



注意：本次publish 版本号都需要修改版本号

## 五、总结

我们可以⽤vue-cli 或其他⼯具另外⽣成⼀个demo项⽬，⽤这个项⽬去引⼊我们的组件库。如果你的包还没有发布出去，可以在你的

组件库项⽬⽬录下 ⽤ npm link 或者 yarn link的命令创建⼀个link

然后在你的demo⽬录下使⽤ npm link package_name 或者 yarn link package_name 这⾥的package_name就是你的组件库的

包名，然后在你的demo项⽬的⼊⼝⽂件⾥

```
import Vue from vueimport Heaven from 'heaven-ui'import 'heaven-ui/dist/heaven-ui.min.css'// 其他代码 ...Vue.use(Heaven)
```

这样设置好之后，我们创建的组件就可以在这个项⽬⾥使⽤了