---
title: pm2的基本使用
date: 2021-12-26 20:35:50
tags: node
---



PM2下使用 执行npm命令
全局安装pm2

npm install -g pm2

 

npm run dev  等同于  pm2 start  npm -- run dev

npm start  等同于 pm2 start npm -- start 

 

命名进程名

 pm2 start  npm --name test -- run dev

 pm2 start npm --name test -- start 

 

语法：pm2 start npm --watch --name <taskname> -- run <scriptname>;

其中 -- watch监听代码变化，-- name重命名任务名称，-- run后面跟脚本名字