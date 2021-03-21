---
title: vue-router中keep-alive的作用
date: 2018-03-23 14:38:24
tags: [Vue,javascript]
---



##### keep-alive 简介

keep-alive 是 Vue 内置的一个组件，可以使被包含的组件保留状态，或避免重新渲染。
用法也很简单：

```
<keep-alive>
  <component>
    <!-- 该组件将被缓存！ -->
  </component>
</keep-alive>
```



<!--more-->

#### props

include - 字符串或正则表达，只有匹配的组件会被缓存
exclude - 字符串或正则表达式，任何匹配的组件都不会被缓存

```
// 组件 a
export default {
  name: 'a',
  data () {
    return {}
  }
}
<keep-alive include="a">
  <component>
    <!-- name 为 a 的组件将被缓存！ -->
  </component>
</keep-alive>可以保留它的状态或避免重新渲染
<keep-alive exclude="a">
  <component>
    <!-- 除了 name 为 a 的组件都将被缓存 ！-->
  </component>
</keep-alive>
<!--可以保留它的状态或避免重新渲染  ！-->
```

#### 使用 router.meta 拓展

```
// routes 配置
export default [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      keepAlive: true // 需要被缓存
    }
  }, {
    path: '/:id',
    name: 'edit',
    component: Edit,
    meta: {
      keepAlive: false // 不需要被缓存
    }
  }
]
<keep-alive>
    <router-view v-if="$route.meta.keepAlive">
        <!-- 这里是会被缓存的视图组件，比如 Home！ -->
    </router-view>
</keep-alive>

<router-view v-if="!$route.meta.keepAlive">
    <!-- 这里是不被缓存的视图组件，比如 Edit！ -->
</router-view>
```

在非单页应用的时候，keep-alive 并不能有效的缓存了