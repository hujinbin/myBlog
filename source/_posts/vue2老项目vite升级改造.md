---
title: vue2老项目vite升级改造
date: 2022-12-19 11:03:44
tags: [javascript]
---



**前言**

Vite是一种新型前端构建工具，能够显著提升前端开发体验。它主要由两部分组成：

- 一个开发服务器，它基于 [原生 ES 模块](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) 提供了 [丰富的内建功能](https://vitejs.cn/guide/features.html)，如速度快到惊人的 [模块热更新（HMR）](https://vitejs.cn/guide/features.html#hot-module-replacement)。
- 一套构建指令，它使用 [Rollup](https://rollupjs.org/) 打包你的代码，并且它是预配置的，可输出用于生产环境的高度优化过的静态资源。

Vite 意在提供开箱即用的配置，同时它的 [插件 API](https://vitejs.cn/guide/api-plugin.html) 和 [JavaScript API](https://vitejs.cn/guide/api-javascript.html) 带来了高度的可扩展性，并有完整的类型支持。

vite包含如下特点：

- 光速启动
- 热模块替换
- 按需编译

本次在开发环境增加vite的启动方式，提升开发效率，在生产环境保持原有模式。

<!--more-->

**背景**

本次改造的工程是公司内一个很重要，迭代维护了3年的老项目，随着项目代码量的逐渐增加，项目启动速度的速度越来越慢，已经严重影响了开发效率，启动时间接近2分钟。



![img](https://cdn.leheavengame.com/jue/images/ab8d7aa0-8294-11ed-8661-396367bbd919.jpg)





该项目由@vue/cli 搭建的webpack模版，之前做过一次webpack3->的一次升级，现使用webpack4.x版本。

在搭建vite的过程中，理想状况是业务代码的0改动。

**改造过程**

**保留webpack的选项**

由于vite使用ES6 Module方式组织代码,index.html的导入方式不通，复制index.html->prod.html

并修改webpack HtmlWebpackPlugin插件的template（开发和生产配置会有不同，保留原有配置即可）

new HtmlWebpackPlugin({      template: 'prod.html', }),

**vite引入和配置**

安装
```
npm i vite --save-dev
```
并在根目录新建vite.config.js文件
```
import { defineConfig } from 'vite' 
import path from 'path' 
export default () => defineConfig({
      resolve: {
                extensions: ['.js', '.vue', '.json', '.less'],       
                alias: {
                              vue: 'vue/dist/vue.esm.js',            
                              '@': path.resolve(__dirname, 'src'),        
                       }
                },    
      server: {
                port: 8080, // vite默认是3000端口，保留原有的端口号
                proxy: {
                              '/api': { 
                                               target: 'http://baidu.com/',                
                                               changeOrigin: true,                
                                               rewrite: path => path.replace(/^\/api/, '')           
                                        } 
                               }    
                  } 
          })
```

添加 packge.json 中 scripts 命令，并改变原有的webpack命令
```
{  
  "scripts": { 
        "dev": "vite" , 
          "dev:w": "webpack-dev-server --inline --progress --config build/webpack.dev.conf.js --profile"
       } 
    }
```

修改 index.html中的入口文件导入方式

<script type="module" src="/src/main.js"></script>

配置完后我们就可以尝试运行vite了

命令行输入npm run dev




![img](https://cdn.leheavengame.com/jue/images/00fb4a80-8295-11ed-8661-396367bbd919.jpg)



运行后，我们可以看到很多报错，这么多错误信息如果手动修改的话，无疑是一项巨大的工程，而且这些改动没有任价值。针对vite 工程的改造，我们可以通过插件解决对应问题。

**vite-plugins引入**

虽然 vite 发展很快，npm 上面也陆陆续续有vite的插件更新，但是总有一些没有覆盖到的场景，官方的核心插件如下，我们的项目使用的是vue2版本的，所以用的是vite-plugin-vue2插件。





![img](https://cdn.leheavengame.com/jue/images/0e3d4db0-8295-11ed-8661-396367bbd919.jpg)


```
// vite.config.js
import { createVuePlugin } from 'vite-plugin-vue2'

export default {
  plugins: [
    createVuePlugin({
        jsx: true,
    })
  ],
}
```

针对这个场景，使用的是自己写了一个插件[vite-plugin-vue2-jsx](https://github.com/hujinbin/vite-plugin-vue2-jsx)，将需要修改的处理，全部由插件来进行转化

使用 vite-plugin-vue2-jsx 替换 vite-plugin-vue2 ，自动处理 <script> 代码块和js文件的 jsx 语法

```
// vite.config.js
import { createVuePlugin } from 'vite-plugin-vue2-jsx'

export default {
  plugins: [
    createVuePlugin({
        jsx: true,
    })
  ],
}
```

require报错问题 

这个问题vite是使用ESModule编译的，不支持CommonJs的原因，所以我们就需要将CommonJs 转换为ESModule。

项目中存在两种情况：

1. 图片require引用

```
<img class="logo" :src="require('./images/logo.png')"/>
```

 在npm上找了半天也没找到我需要的插件，针对这个场景，索性自己写了一个插件[vite-plugin-image-require](https://github.com/hujinbin/vite-plugin-image-require)

```
// vite.config.js
import { imageRequirePlugin } from 'vite-plugin-image-require'

export default {
  plugins: [
    imageRequirePlugin()
  ],
}
```

 2. 枚举的引用

通过引入 vite-plugin-require-transform 插件来处理

```
npm i vite-plugin-require-transform --save-dev
```

配置

```
import requireTransform from 'vite-plugin-require-transform';

export default defineConfig({
  plugins: [
    requireTransform({fileRegex:/.js$|.vue$/}),
  ],
});
```

  


转换 @import ~ 别名  


```
resolve: {
    alias: {
      '~': path.join(__dirname, 'node_modules'),
    }
  },
```

  


webpack的 process.env 的环境变量在项目中的使用导致的页面报错，无法加载

```
define: {
    'process.env': process.env
},
```

  


### 完整配置

```
import { defineConfig } from 'vite'
import { imageRequirePlugin } from 'vite-plugin-image-require'
import { createVuePlugin } from 'vite-plugin-vue2-jsx'
import requireTransform from 'vite-plugin-require-transform';
import path from 'path'

export default () => defineConfig({
    define: {
        'process.env': process.env
    },
    plugins: [
        createVuePlugin({
            jsx: true,
        }),
        requireTransform({
            fileRegex:/.js$|.vue$/
        }),
        imageRequirePlugin(),
    ],
    resolve: {
        extensions: ['.js', '.vue', '.json', '.less'],
        alias: {
            vue: 'vue/dist/vue.esm.js',
            '@': path.resolve(__dirname, 'src'),
            '~': path.join(__dirname, 'node_modules'),
        }
    },
    server: {
        port: 8080, // vite默认是3000端口，保留原有的端口号
        proxy: {
            '/api': {
                target: 'http://baidu.com/',
                changeOrigin: true,
                rewrite: path => path.replace(/^/api/, '')
            }
        }
    }
})
```

### 结束

```
# 使用vite启动服务
npm run dev

# 使用webpack启动服务
npm run dev:w
```