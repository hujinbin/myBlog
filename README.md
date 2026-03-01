# myBlog
我的个人博客（hexo搭建）


## Hexo 常用命令与环境问题

### 安装 hexo-cli
如果你在命令行运行 `hexo` 时遇到“无法将‘hexo’项识别为 cmdlet、函数、脚本文件或可运行程序的名称”类似报错，说明 hexo-cli 没有全局安装。

请先全局安装 hexo-cli：

```bash
npm install -g hexo-cli
```

安装完成后，重启终端，再运行 hexo 相关命令。

### 新建文章
```bash
hexo new '你的文章标题'
```

### 其他常用命令
```bash
hexo g      # 生成静态文件
hexo s      # 启动本地服务器
hexo d      # 部署到远程
```


### 主题链接
https://hexo.io/themes/

amazing
https://github.com/removeif/hexo-theme-amazing


kaze
https://github.com/theme-kaze/hexo-theme-kaze


### 国际化（i18n）
language: zh-tw

language: 
- zh-tw
- en





