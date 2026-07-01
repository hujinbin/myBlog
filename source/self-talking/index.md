---
date: 2019-11-25 14:49:08
comments: false
thumbnail: https://cdn.jsdelivr.net/gh/removeif/blog_image/img/2020/20201030170800.png
---
<div class = "text-center"><h1>碎碎念</h1></div><div class = "text-tips">

tips：github登录后按时间正序查看<span id="busuanzi_container_page_pv">「<span id="busuanzi_value_page_pv">+99</span>次查看」</span></div>
<div id="comment-container1"><div class="text-tips">碎碎念加载中，请稍等...</div></div>
<link rel="stylesheet" href="https://cdnjs.loli.net/ajax/libs/gitalk/1.6.0/gitalk.css"/>
<script>
    $.getScript("/js/gitalk_self.min.js", function () {
        var gitalk = new Gitalk({
            clientID: '805d0c127d7edb5532bb',
            clientSecret: '89de913bcdc87f3e47e916e5516f21ae8f0a69dd',
            id: '666666',
            title: 'blog_self-talking',
            url: window.location.origin + window.location.pathname + window.location.hash,
            repo: 'myBlog',
            owner: 'hujinbin',
            admin: ["hujinbin"],
            proxy: 'https://www.leheavengame.com/api/github/oauth/access_token',
            createIssueManually: true,
            distractionFreeMode: false
        });
        gitalk.render('comment-container1');
    });
</script>
