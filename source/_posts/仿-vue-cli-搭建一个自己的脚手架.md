---
title: 仿 vue-cli 搭建一个自己的脚手架
date: 2022-02-05 23:29:33
tags: [javascript,node]
---



脚手架

搭建脚手架的目的就是快速的搭建项目的基本结构并提供项目规范和约定。目前日常工作中常用的脚手架有 vue-cli、create-react-app、angular-cli 等等，都是通过简单的初始化命令，完成内容的快速构建。

其实我们也可以用git clone url来新建（复制）项目，再 low 一点的方法就是复制粘贴整个文件夹，一样也能达到初始化的目的。

脚手架的本质也是从远程下载一个模板来进行一个新项目，但是脚手架可是高级版的克隆，它主要是提供了交互式的命令让我们可以动态的更改模板，然后用一句命令就可以实现其他内置依赖的初始化,方便了多人协作，不需要将文件传来传去。

接下来我们就开始实现一个简易版的脚手架heaven-cli（可自行命名），目标是实现一个heaven init template-name project-name这样的命令，废话少说，开始进入正题吧！

<!--more-->

前置知识了解

其实一个简易版的 heaven-cli的代码量并不多，所以这里我们先来介绍一下其中要使用到的第三方库

commander

这是用来编写指令和处理命令行的，用法如下：

```
const program = require("commander");
// 定义指令
program
  .version('0.0.1')
  .command('init', 'Generate a new project from a template')
  .action(() => {
    // 回调函数
  })
// 解析命令行参数
program.parse(process.argv);
复制代码
```

inquirer

这是个强大的交互式命令行工具，用法如下：

```
const inquirer = require('inquirer');
inquirer
  .prompt([
    // 一些交互式的问题
  ])
  .then(answers => {
    // 回调函数，answers 就是用户输入的内容，是个对象
  });
复制代码
```

chalk

这是用来修改控制台输出内容样式的，起到了美化输出内容的作用，用法如下：

```
const chalk = require('chalk');
console.log(chalk.green('success'));
console.log(chalk.red('error'));
复制代码
```

ora

这是一个好看的加载交互组件，用于下载过程中的loading效果，用法如下：

```
const ora = require('ora')
let spinner = ora('downloading template ...')
spinner.start()
复制代码
```

download-git-repo

用于下载远程模板的，支持 GitHub、 GitLab 和 Bitbucket 等，用法如下：

```
const download = require('download-git-repo')
download(repository, destination, options, callback)
复制代码
```

其中 repository 是远程仓库地址；destination 是存放下载的文件路径，也可以直接写文件名，默认就是当前目录；options 是一些选项，比如{ clone：boolean }表示用 http download 还是 git clone 的形式下载。

初始化目录

首先我们先创建一个空文件夹，取名 heaven-cli；

目录结构

```
├── bin //可执行文件
└── lib
    ├── init.js         //init command
    ├── template 
        └── index.js        //内置的所有模版
    └── utils
        └── utils.js        // 公共方法
├── package.json
├── README.md
复制代码
```

在该目录下执行npm init命令，进行初始化。

安装依赖

```
npm install  chalk commander inquirer ora download-git-repo
复制代码
```

我这边的package.json的依赖是这样的

```
"dependencies": {
    "chalk": "^4.1.2",
    "commander": "^8.3.0",
    "download-git-repo": "^3.0.2",
    "inquirer": "^8.1.2",
    "ora": "^5.4.1"
}
复制代码
```

node.js 内置了对命令行操作的支持，package.json 中的 bin 字段可以定义命令名和关联的执行文件。在 package.json 中添加 bin 字段

```
"bin": {
    "heaven": "bin/heaven.js"
  },
复制代码
```

bin 目录下新建一个heaven.js，并在行首加入一行 #!/usr/bin/env node 指定当前脚本由node.js进行解析

```
#!/usr/bin/env node
const program = require('commander')

const init = require("../lib/init");

program
  .command('init <template> <app-name>')
  .description('generate a project from a remote template (legacy API, requires @heaven-cli)')
  .action((template, name) => {
    init(template, name)
  })
  
// 解析命令行参数
program.parse(process.argv)
复制代码
```

这个文件的主要作用就是定义指令，我们用node ./bin/heaven运行一下，就能看到运行结果了，

当然，在开发过程中为了方便调试，在当前的 heaven-cli 目录下执行 npm link，将 heaven 命令链接到全局环境，

这样我们每次只要输入heaven，就可以直接运行了。

后面就可以编写 /lib/init.js的代码了

```
// 交互式命令行
const inquirer = require('inquirer')
// 修改控制台字符串的样式
const chalk = require('chalk')
// node 内置文件模块
const fs = require('fs')
// 读取template下内置的模版
const tplObj = require("./template")

// 下载
const download = require("download-git-repo");

// 自定义交互式命令行的问题及简单的校验
let question = [
  {
    name: "name",
    type: 'input',
    message: "Project name (" + name + ')',
    validate (val) {
      if (val === '') {
        return 'Name is required!'
      } else {
        return true
      }
    }
  },
  {
      name: "description",
      type: 'input',
      message: "Project description"
  },
]

inquirer
  .prompt(question).then(answers => {
    // answers 就是用户输入的内容，是个对象
    let {
        description
      } = answers;
      let projectName = answers.name
      // 出现加载图标
      const spinner = ora("Downloading...");
      
      const url = tplObj.template[template]
      // 执行下载方法并传入参数
      download(
        url,
        projectName,
        err => {
          if (err) {
            spinner.fail();
            console.log(chalk.red(`Generation failed. ${err}`))
            return
          }
          // 将用户输入的内容，写入package.json内
          const packageFile = path.join(process.cwd(), projectName + '/package.json');
          const package = require(packageFile);
          package.description = description;
          package.name = projectName;
          fs.writeFileSync(file, `module.exports = ${JSON.stringify(package, null, '\t')};`, 'utf8');
          // 结束加载图标
          spinner.succeed();
          console.log(chalk.green('\n Generation completed!'))
          console.log('\n To get started')
          console.log(`\n    cd ${projectName} \n`)
        }
      )
  })
复制代码
```

至此，一个小小的脚手架就做完了。

接下来就测试一下heaven init vue my-project命令能否生效

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/928e12350c294ae3b6f105383d96e6ce~tplv-k3u1fbpfcp-watermark.awebp?)

很快就可以看到已经成功初始化了my-project，此时可以看一下my-project文件夹下面

![img](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f9788d3cc9914e198e6133966557463e~tplv-k3u1fbpfcp-watermark.awebp?)

发布到 npm

既然以上命令可以执行成功了，那接下来我们就把它发布到 npm 上吧，其它用户就可以通过 npm install heaven-cli-fe -g 全局安装。 即可使用 heaven 命令。

源码地址：[github.com/hujinbin/he…](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fhujinbin%2Fheaven-cli)

可使用 template 包含如下

- vue
- vue-seo
- koa-react
- koa-vue
- microservice

vue

- vue-cli，webpack5.28版本

vue-seo （开发中）

- 基于vue-cli搭建的伪ssr脚手架，webpack5.28版本，打包生成对应的静态html，并跳转到真实网址，用于seo搜索。

koa-react

- koa+react 工程项目骨架，ssr模式，支持mysql和mongodb数据库

koa-vue

- koa+vue 工程项目骨架 mvc结构， 前端vue单页面应用

microservice （开发中）

- 基于vite搭建微前端脚手架
