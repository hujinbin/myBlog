## 背景

说到构建工具，我往往会在前面加「自动化」三个字，因为构建工具就是用来让我们不再做机械重复的事情，解放我们的双手的。

什么是前端自动化？前端工程师需要维护的代码极为庞大和复杂，代码维护、打包、发布等流程也变得极为繁琐，同时浪费的时间和精力也越来越多，当然人为的错误也随着流程的增加而增加了更多的出错率。

致使每一个团队都希望有一种工具，能帮助整个团队在开发中能精简流程、提高效率、减少错误率。随之讨论自动化部署也越来越多，并且国内很多大型团队也都有自己成熟的自动化部署工具。

常用的构建工具 gulp，webpack，parcel，rollup，vite ，fis，grunt等

经过多年的发展，Webpack 已经成为构建工具中的首选，这是因为：

- 大多数团队在开发新项目时会采用紧跟时代的技术，这些技术几乎都会采用“模块化+新语言+新框架”，Webpack可以为这些新项目提供一站式的解决方案；
- Webpack有良好的生态和维护团队，能提供良好的开发体验并保证质量；
- Webpack 被全世界大量的Web开发者使用和验证，能找到各个层面所需要的教程和经验分享。



<!--more-->

## webpack的构成

说webpack是构建工具并不确切，更确切的说法应该是静态模块打包器，在webpack里包（bundle）的概念很重要，另一个重要的概念是依赖关系图，这组成了这个打包器的重要核心。

![img](http://cdn.leheavengame.com/jue/images/cb308b60-cb5f-11eb-94d9-83dd409de1e4.jpg)

webpack有四大核心要素，这也是跟我们使用配置webpack时十分密切的四个部分：

- entry： 配置入口文件，即产生依赖关系图的入口
- output：文件的产出位置配置
- loader：匹配文件的编译过程
- plugins：针对整个构建打包流程的插件处理（文件压缩，dev环境的热加载）

出入口决定了我们需要将那些文件打包到哪里去，而loader承接这里的匹配文件的编译工作，plugins则是针对整个构建过程的操作，需要什么功能引入什么插件。

#### webpack打包是如何运行的

也可以称为，webpack是如何实现模块化的

CommonJS是同步加载模块，一般用于node。因为node应用程序运行在服务器上，程序通过文件系统可以直接读取到各个模块的文件，特点是响应快速，不会因为同步而阻塞了程序的运行；

AMD是异步加载模块，所以普遍用于前端。而前端项目运行在浏览器中，每个模块都要通过http请求加载js模块文件，受到网络等因素的影响如果同步的话就会使浏览器出现“假死”（卡死）的情况，影响到了用户体验。

ESModule 旨在实现前后端模块化的统一。而webpack就是把ES6的模块化代码转码成CommonJS的形式，从而兼容浏览器的。

为什么webpack打包后的文件，可以用在浏览器：此时webpack会将所有的js模块打包到bundle.js中（异步加载的模块除外，异步模块后面会讲），读取到了内存里，就不会再分模块加载了。

![img](http://cdn.leheavengame.com/jue/images/dbce15a0-cb5f-11eb-94d9-83dd409de1e4.jpg)

#### webpack对CommonJS的模块化处理

举例：

index.js文件，引入test.js文件

```
const test = require('./test');

console.log(test);
console.log('hello world');
```



test.js文件

```
module.exports = {
  name: 'startdt',
  age: '5',
};
```



当我们执行webpack之后，打包完成，可以看到bundle.js内的代码

// modules 即为存放所有模块的数组，数组中的每一个元素都是一个函数

```
(function(modules) {
	// 安装过的模块都存放在这里面
    // 作用是把已经加载过的模块缓存在内存中，提升性能
	var installedModules = {};
	// 去数组中加载一个模块，moduleId 为要加载模块在数组中的 index
    // __webpack_require__作用和 Node.js 中 require 语句相似
	function __webpack_require__(moduleId) {
		// require 模块时先判断是否已经缓存, 已经缓存的模块直接返回
		if(installedModules[moduleId]) {
			return installedModules[moduleId].exports;
		}
		// 如果缓存中不存在需要加载的模块，就新建一个模块，并把它存在缓存中
		var module = installedModules[moduleId] = {
            // 模块在数组中的index
            i: moduleId,
            // 该模块是否已加载完毕
            l: false,
            // 该模块的导出值，也叫模块主体内容, 会被重写
			exports: {}
		};
		// 从 modules 中获取 index 为 moduleId 的模块对应的函数
        // 再调用这个函数，同时把函数需要的参数传入，this指向模块的主体内容
		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
		// 将模块标记为已加载
		module.l = true;
		// 返回模块的导出值，即模块主体内容
		return module.exports;
	}
    // 向外暴露所有的模块
	__webpack_require__.m = modules;
	// 向外暴露已缓存的模块
    __webpack_require__.c = installedModules;
	
	...
	...
	
    // Webpack 配置中的 publicPath，用于加载被分割出去的异步代码，这个暂时还没有用到
	__webpack_require__.p = "";
    // Load entry module and return exports
    // 准备工作做完了, require 一下入口模块, 让项目跑起来
    // 使用 __webpack_require__ 去加载 index 为 0 的模块，并且返回该模块导出的内容
    // index 为 0 的模块就是 index.js文件，也就是执行入口模块
    // __webpack_require__.s 的含义是启动模块对应的 index
	return __webpack_require__(__webpack_require__.s = 0);
})
/***** 华丽的分割线 上边时 webpack 初始化代码, 下边是我们写的模块代码 *******/
// 所有的模块都存放在了一个数组里，根据每个模块在数组的 index 来区分和定位模块
([
	/* 模块 0 对应 index.js */
	(function(module, exports, __webpack_require__) {
		// 通过 __webpack_require__ 规范导入 foo 函数，foo.js 对应的模块 index 为 1
		const test = __webpack_require__(1);
		
		console.log(test);
		console.log('hello world');
	}),
	/* 模块 1 对应 foo.js */
	(function(module, exports) {
		// 通过 CommonJS 规范导出对象
		module.exports = {
		  name: 'startdt',
		  age: '5',
		};
	})
]);
```



上面是一个立即执行函数，简单点写：

```
(function(modules) {

  // 模拟 require 语句
  function __webpack_require__(index) {
	  return [/*存放所有模块的数组中，第index个模块暴露的东西*/]
  }

  // 执行存放所有模块数组中的第0个模块，并且返回该模块导出的内容
  return __webpack_require__(0);

})([/*存放所有模块的数组*/])
```



bundle.js 能直接运行在浏览器中的原因在于：

webpack通过 _webpack_require_ 函数（该函数定义了一个可以在浏览器中执行的加载函数）模拟了模块的加载（类似于Node.js 中的 require 语句），把定义的模块内容挂载到module.exports上；

同时__webpack_require__函数中也对模块缓存做了优化，执行加载过的模块不会再执行第二次，执行结果会缓存在内存中，当某个模块第二次被访问时会直接去内存中读取被缓存的返回值。

原来一个个独立的模块文件被合并到了一个单独的 bundle.js 的原因在于，浏览器不能像 Node.js 那样快速地去本地加载一个个模块文件，而必须通过网络请求去加载还未得到的文件。 如果模块数量很多，加载时间会很长，因此把所有模块都存放在了数组中，执行一次网络加载。

这一部分，我写一了一个demo

[源码地址](https://github.com/hujinbin/simple-webpack)



webpack对es6 Module模块化的处理

举例

index.js文件，引入test.js文件

```
import test from './test';

console.log(test);
console.log('hello world');
```



test.js文件

```
export default {
  name: 'startdt',
  age: '5',
};
```



打包完后bundle.js代码如下

```
(function(modules) {
	var installedModules = {};
	function __webpack_require__(moduleId) {
		if(installedModules[moduleId]) {
			return installedModules[moduleId].exports;
		}
		var module = installedModules[moduleId] = {
			i: moduleId,
			l: false,
			exports: {}
		};
		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
		module.l = true;
		return module.exports;
	}
	__webpack_require__.m = modules;
	__webpack_require__.c = installedModules;
	__webpack_require__.d = function(exports, name, getter) {
		if(!__webpack_require__.o(exports, name)) {
			Object.defineProperty(exports, name, {
				configurable: false,
				enumerable: true,
				get: getter
			});
		}
	};
	__webpack_require__.n = function(module) {
		var getter = module && module.__esModule ?
			function getDefault() { return module['default']; } :
			function getModuleExports() { return module; };
		__webpack_require__.d(getter, 'a', getter);
		return getter;
	};
	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
	__webpack_require__.p = "";
	return __webpack_require__(__webpack_require__.s = 0);
})([相关模块]);
```





打包好的内容和commonjs模块化方法差不多

```
function(module, __webpack_exports__, __webpack_require__) {
	"use strict";
	// 在__webpack_exports__上定义__esModule为true，表明是一个模块对象
	Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
	var __WEBPACK_IMPORTED_MODULE_0__foo__ = __webpack_require__(1);
	console.log(__WEBPACK_IMPORTED_MODULE_0__foo__["a"]);
	console.log('hello world');
},
function(module, __webpack_exports__, __webpack_require__) {
	"use strict";
	__webpack_exports__["a"] = ({
       name: 'startdt', 
       age: '5',
	});
}
```



和 commonjs 不同的地方

首先, 包装函数的参数之前的 module.exports 变成了_webpack_exports_

其次, 在使用了 es6 模块导入语法(import)的地方, 给__webpack_exports__添加了属性__esModule

其余的部分和 commonjs 类似

#### webpack文件的按需加载

以上webpack把所有模块打包到主文件中，所以模块加载方式都是同步方式。但在开发应用过程中，按需加载（也叫懒加载）也是经常使用的优化技巧之一。

按需加载，通俗讲就是代码执行到异步模块（模块内容在另外一个js文件中），通过网络请求即时加载对应的异步模块代码，再继续接下去的流程。

main.js 文件

```
window.document.getElementById('btn').addEventListener('click', function () {
 // 当按钮被点击后才去加载 show.js 文件，文件加载成功后执行文件导出的函数
 import(/* webpackChunkName: "show" */ './show').then((show) => {
   show('Webpack');
 })
});
```



show.js 文件

```
module.exports = function (content) {
  window.alert('Hello ' + content);
};
```



代码中最关键的一句是 import(/* webpackChunkName: “show” / ‘./show’)，Webpack 内置了对 import() 语句的支持，当 Webpack 遇到了类似的语句时会这样处理：

以 ./show.js 为入口新生成一个 Chunk；

当代码执行到 import 所在语句时才会去加载由 Chunk 对应生成的文件。

import 返回一个 Promise，当文件加载成功时可以在 Promise 的 then 方法中获取到 show.js 导出的内容。

webpack有个require.ensure api语法来标记为异步加载模块，webpack4推荐使用新的import() api(需要配合@babel/plugin-syntax-dynamic-import插件)。

因为require.ensure是通过回调函数执行接下来的流程，而import()返回promise，这意味着可以使用 async/await语法，使得可以像书写同步代码一样，执行异步流程。

上述内容打包后会生成两个chunk文件，分别是主文件执行入口文件 bundle.js 和 异步加载文件 0.bundle.js 。

// 0.bundle.js

```
// 异步模块
// window["webpackJsonp"]是连接多个chunk文件的桥梁
// window["webpackJsonp"].push = 主chunk文件.webpackJsonpCallback
(window["webpackJsonp"] = window["webpackJsonp"] || []).push([
  [0], // 异步模块标识chunkId,可判断异步代码是否加载成功
  // 跟同步模块一样，存放了{模块路径：模块内容}
  {
  "./src/async.js": (function(module, __webpack_exports__, __webpack_require__) {
      __webpack_require__.r(__webpack_exports__);
      __webpack_exports__["default"] = (function () {
        return 'hello, aysnc module';
      });
    })
  }
]);
```



异步模块打包后的文件中保存着异步模块源代码，同时为了区分不同的异步模块，还保存着该异步模块对应的标识：chunkId。以上代码主动调用window[“webpackJsonp”].push函数，该函数是连接异步模块与主模块的关键函数，该函数定义在主文件中，实际上window[“webpackJsonp”].push = webpackJsonpCallback

webpack异步加载模块实现流程跟jsonp基本一致。

既然我们知道了打包的结果，那webpack的是怎么运行的呢

#### webpack的核心对象

Tapable：控制钩子的发布与订阅，Compiler和Compilation 对象都继承于 Tapable

#### Compiler

Compiler 继承 Tapable 对象，可以广播和监听 webpack 事件。

Compiler 对象是 webpack 的编译器，webpack 周期中只存在一个 Compiler 对象。

Compiler 对象在 webpack 启动时创建实例，compiler 实例中包含 webpack 的完整配置，包括 loaders, plugins 信息。

#### Compilation

Compilation 继承 Tapable 对象，可以广播和监听 webpack 事件。

Compilation 实例仅代表一次 webpack 构建和生成编译资源的的过程。

webpack 开发模式开启 watch 选项，每次检测到入口文件模块变化时，会创建一次新的编译: 生成一次新的编译资源和新的 compilation 对象，这个 compilation 对象包含了当前编译的模块资源 module, 编译生成的资源，变化的文件, 依赖的的状态

webpack 的运行流程是一个串行的过程，从启动到结束会依次执行以下流程：

1. 初始化参数：从配置文件和 Shell 语句中读取与合并参数，得出最终的参数;
2. 开始编译：用上一步得到的参数初始化 Compiler 对象 (实例化complier对象)，加载所有配置的插件，执行对象的 run 方法开始执行编译,生成Compilation对象 (实例化Compilation对象)；
3. 确定入口：根据配置中的 entry ,调用AST引擎(acorn)处理入口文件，生成抽象语法树AST，根据AST构建模块的所有依赖；
4. 编译模块：从入口文件出发，调用所有配置的 Loader 对模块进行翻译，再找出该模块依赖的模块，再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理；
5. 完成模块编译：在经过第4步使用 Loader 翻译完所有模块后，得到了每个模块被翻译后的最终内容以及它们之间的依赖关系；
6. 输出资源：根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk，再把每个 Chunk 转换成一个单独的文件加入到输出列表，这步是可以修改输出内容的最后机会；
7. 输出完成：在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容输出到目录。

#### 编译前准备

此阶段概述：在 compiler 的各种 hook 上注册项目配置的 plugins、注册 webpack 默认插件 ➡️ 注册 resolverFactory.hooks 为 Factory.createResolver 方法提供参数对象。

webpack 的事件机制是基于 tapable 库做的事件流控制，在整个编译过程中暴露出各种hook，而 plugin 注册监听了某个/某些 hook，在这个 hook 触发时，会执行 plugin 里绑定的方法。

```
new NodeEnvironmentPlugin({
  infrastructureLogging: options.infrastructureLogging
}).apply(compiler);
```



#### loader阶段

递归编译生成 module 实例

- resolve 阶段，解析返回包含当前模块所有信息的一个对象

此阶段概述：利用 enhanced-resolve 库，得到 resolve 解析方法 ➡️ 解析 inline loader 和它对应资源的 resource，还有项目config的 loader，然后对所有 loader 进行合并、排序 ➡️ 得到 module 对应的 parser 和 generator，用于后面的 ast 解析及模板生成 ➡️ 输出一个包含当前模块上下文、loaders、绝对路径、依赖等 module 所有信息的组合对象，提供给 afterResolve 钩子触发后的回调。这个对象下一步会被用来初始化当前文件 的 module 实例。

比如

```
import Styles from style-loader!css-loader?modules!./styles.css
```



会被解析成：

```
{
  "resource": "./styles.css",
  "elements": [
    {
      "loader": "style-loader"
    },
    {
      "loader": "css-loader",
      "options": "modules"
    }
  ]
}
```



然后并行处理参数数组各个任务，完成之后都会返回一个 results 列表，列表顺序为参数数组顺序，与执行顺序无关。

得到的 results：

```
{
  "results": [
    [
      {
        "loader": "loader的绝对路径1",
        "options": "loader参数1"
      },
      {
        "loader": "loader的绝对路径2",
        "options": "loader参数2"
      }
    ],
    {
      "resource": "模块绝对路径",
      "resourceResolveData": "模块基本信息（即enhanced-resolve执行结果）"
    }
  ]
}
```



解析 config module rules 里的 loader，递归过滤匹配出对应的 loader：

```
{
  "result": [
    { "type": "type", "value": "javascript/auto" },
    { "type": "resolve", "value": {} },
    { "type": "use", "value": { "loader": "babel-loader" } }
  ]
}
```





对 loader 进行合并、排序：

接着处理inline loader带有前缀!,!!,-!和result项带有enforce参数的情况，用来决定怼 loader的禁用和排序。

并行处理上一步得到的useLoadersPost、useLoadersPre、useLoaders，拿到对应的 resolve 结果即路径信息，再在回调里排序、合并，

即 loaders 配置顺序为 postLoader，inlineLoader，loader（normal），preLoader，执行顺序则相反。

- 执行 loader 阶段，初始化模块 module，并用 loader 倒序转译

开启构建 module 流程。 new NormalModule(result)得到初始化的 module ➡️ 在 build 过程中执行 runLoaders 处理源码，先正序读取每个 loader 并执行它的 pitch，再倒序执行每个 loader 的 normal，最后得到一个编译后的字符串或 Buffer。

![img](http://cdn.leheavengame.com/jue/images/0e884550-cb61-11eb-94d9-83dd409de1e4.jpg)

runLoaders 方法来自 loader-runner，作用是按规定流程执行各种 loader，将模块源码后处理成一个 String 或 Buffer 格式的 JavaScript (可能还有个 SourceMap)。

- 
- parse 阶段，收集依赖

调用 parser 将上一步 runLoaders 的编译结果利用 acorn 库转换为 ast。生成的 AST 划分为三部分：ImportDeclaration、FunctionDeclaration和VariablesDeclaration。➡️ 遍历 ast，根据导入导出及异步的情况触发相关钩子插件来收集依赖，这些依赖用于解析递归依赖和模板操作 ➡️ 根据每个 module 的相关信息生成各自唯一的 buildHash。

- 递归处理依赖阶段 (重复以上步骤)

根据 module 间的相互依赖关系，递归解析所有依赖 module。即 resolve ➡️ 执行 loader ➡️ parse ➡️ 收集并处理该模块依赖的模块，直到所有入口依赖 (直接或间接) 的文件都经过了这些步骤的处理。最终返回一个入口 module。

![img](http://cdn.leheavengame.com/jue/images/1d97b580-cb61-11eb-94d9-83dd409de1e4.jpg)

#### loader过程归纳

就这样，从入口module开始，根据module之间的依赖关系，递归将所有的module都转换编译。

直到层层依赖都转换完成，执行return process.nextTick(callback);，将在下一次事件循环tick之前调用 callback，

此时返回一个入口 module：

```
{
  "module": {
    //...
    //同步模块
    "dependencies": ["HarmonyImportSideEffectDependency", "HarmonyImportSpecifierDependency"],
    //异步模块
    "blocks": ["ImportDependenciesBlock"]
  }
}
```



无抛出错误则再触发 compilation.hooks:succeedEntry，到此 module 生成结束。

#### plugins

一个webpack的插件由以下几方面组成：

- 一个非匿名的js函数
- 在它的原型对象上定义apply方法
- 指明挂载自身的webpack钩子事件
- 操作webpack内部情况的特定数据
- 方法完成时唤起webpack提供的回调

插件的基本结构

插件是在原型中带有一个apply方法的实例化对象，当安装插件的时候，这个apply方法就会被webpack调用一次。apply方法提供一个指向当前活动的webpack compiler的引用，该引用允许访问compiler的回调

简单的Plugin案例

```
function HelloWorldPlugin() {
   //
};
HelloWorldPlugin.prototype.apply = function(compiler) {
  compiler.plugin('webpacksEventHook', function(compilation, callback) {
    console.log('Hello World!')
    callback();
  });
};    

module.exports = HelloWorldPlugin;
```



```
function HelloCompilationPlugin(options) {}

HelloCompilationPlugin.prototype.apply = function(compiler) {

  // Setup callback for accessing a compilation:
  compiler.plugin("compilation", function(compilation) {

    // Now setup callbacks for accessing compilation steps:
    compilation.plugin("optimize", function() {
      console.log("Assets are being optimized.");
    });
  });
};

module.exports = HelloCompilationPlugin;
```



插件的使用

```
const HelloWorldPlugin = require('hello-world');

const webpackConfig = {
  // ... config settings here ...
  plugins: [
    new HelloWorldPlugin({options: true})
  ]
};
```



![img](http://cdn.leheavengame.com/jue/images/574b21e0-cb61-11eb-94d9-83dd409de1e4.jpg)
