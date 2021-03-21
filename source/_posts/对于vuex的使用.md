---
title: 对于vuex的使用
date: 2018-04-15 14:47:17
tags: [Vue,javascript]
---



### vuex是什么？

#### 官网的解释

Vuex 是一个专为 Vue.js 应用程序开发的状态管理模式。它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。Vuex 也集成到 Vue 的官方调试工具 devtools，extension，提供了诸如零配置的 time-travel 调试、状态快照导入导出等高级调试功能。

#### vuex 在项目中的使用【通过vue-cli 脚手架搭建的项目中】

#### 安装

```
npm install vuex --save
```

<!--more-->

#### 在main.js中 引入

```
//main.js
import Vuex from 'vuex';
Vue.use(Vuex);
//创建一个store以便于在所有组件都能查询到vuex的数据
const store = new Vuex.Store({
    state: {
        count: 0
    },
    mutations: {
        increment (state) {
            state.count++
        }
    }
});

//简单测试
//store.commit('increment')
//console.log(store.state.count);

//在vue实例中引用
export default new Vue({
    el: '#app',
    store,
    components: { App },
    template: '<App/>'
});
```

#### vuex核心概念的使用

```
//main.js
const store = new Vuex.Store({
    //数据存储的字段
    state: {
        count: 0
    },
    //更改 Vuex 的 store 中的状态的唯一方法是提交 mutation。
    mutations: {
        increment (state,value) {
            state.count+=value
        }
    },
    //可以理解为一个动作，它提交的是 mutation，而不是直接变更状态。
    actions: {
        increment (context,value) {
            context.commit('increment',value)
        }
    },
    //将数据返回出去，以便于组件中拿到count值
    getters:{
        getCounts:state =>state.count
    }
});
//新建一个组件，假设命名为demo.vue
<template>
    <div>
        {{counts}}
    </div>
</template>

 <script>
 export default {
     name: 'demo',
     data () {
         return {
         }
     },
     computed:{
         //通过计算属性监听vuex里面 count的值
         counts(){
             return this.$store.getters.getCounts;
         }
     },
     created(){
         setTimeout(()=>{
             //action 方法提交
             this.$store.dispatch('increment',10)
         },2000)
     }
 }
 </script>
```

随后，可以将store在main.js中处理出来，src目录下新建一个文件夹命名为store,新建index.js,actions.js,getters.js,mutation-types.js,mutations.js\

```
//index.js
import Vue from 'vue';
import Vuex from 'vuex';
import mutations from './mutations';
import actions from './actions';
import getters from './getters';
Vue.use(Vuex);
export const store = new Vuex.Store({
    state: {
        count: 1,
    },
    mutations,
    actions,
    getters
});

// mutation-types.js
export const INCREMENT="INCREMENT";

// action.js
import {
  INCREMENT
} from './mutation-types';
export default {
  [INCREMENT]({ commit, state },value) {
    commit(INCREMENT,value);
  },
};

// mutations.js
import {
  INCREMENT
} from './mutation-types';
export default {
  [INCREMENT](state, value) {
    state.count += value;
  }
};

// getters.js
import {
  INCREMENT
} from './mutation-types';
const getters = {
  [INCREMENT]: state => state.count,
};
export default getters;

</pre>
<p>main.js</p>
<pre>
//main.js
// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import { store } from './store';
Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
```

#### demo.vue

```
<template>
        <div>
            {{counts}}
        </div>
    </template>

    <script>
    export default {
        name: 'demo',
        data () {
            return {
            }
        },
        computed:{
            //通过计算属性监听vuex里面 count的值
            counts(){
                return this.$store.getters['INCREMENT'];
            }
        },
        created(){
            setTimeout(()=>{
                //action 方法提交
                this.$store.dispatch('INCREMENT',10)
            },2000)
        }
    }
    </script>
```