---
title: 微信小程序 navigator跳转url参数传递
date: 2017-10-15 14:35:45
tags: [微信小程序]
---



## 使用方法说明

#### 传值:在navigator的属性url后拼接?id(参数名字)=要传递的值 (如果多个参数用&分开 &name=value&…….)

```
<view class="good-nav">
  <navigator class="good-nav-item" url="/pages/index/good/good?type=1">
  <image src="http://www.leheavengame.com/wxImages/good-nav01.png"></image>
  护肤系列
  </navigator>
  <navigator class="good-nav-item" url="/pages/index/good/good?type=2">
   <image src="http://www.leheavengame.com/wxImages/good-nav02.png"></image>
  面膜系列
  </navigator>
  <navigator class="good-nav-item" url="/pages/index/good/good?type=3">
   <image src="http://www.leheavengame.com/wxImages/good-nav03.png"></image>
  彩妆系列
  </navigator>
  <navigator class="good-nav-item" url="/pages/index/good/good?type=4">
   <image src="http://www.leheavengame.com/wxImages/good-nav04.png"></image>
 小样旅行装</navigator>
  <navigator class="good-nav-item" url="/pages/index/good/good?type=5">
   <image src="http://www.leheavengame.com/wxImages/good-nav05.png"></image>
 赠品专区</navigator>
</view>
```

<!--more-->

#### 取值：options 是包含url地址中参数的对象，可以直接 点+参数名(.+name) 获取。

```
onLoad: function (options) {
  var that=this;
  wx.showLoading({
    title: '加载中',
  })
  let goodType=options.type //url地址中type的值
  wx.request({
      url: 'https://www.leheavengame.com/ywhx/play',
      method: 'POST',
      data: {
         type: goodType
      },
      header: {
         //向api 推送选择的格式
         'content-type': ' application/x-www-form-urlencoded'
      },
      success: function (res) {
         console.log(res)
         wx.hideLoading()
      })
}
```