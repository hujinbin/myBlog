---
title: react父子组件通信
date: 2017-09-01 20:52:22
tags: [react,javascript]
---



#### 子组件调用父组件：

1）在父组件设置对应的属性和方法；
2）将父组件的属性，方法设置在子组件的标签属性上；
3）子组件中利用this.props来调用父组件的成员；

##### example：

```
//父组件：
var parent=React.cleateClass({
   getDefaultProps:function(){
      alert("父组件方法")
   },
   render:function(){
      return <children a="233" getDefaultProps={this.getDefaultProps}></children>
   }
})
//子组件：
var children=react.createClass({
   render:fucntion(){
     return <div>
        <p>从父组件取得的值：{this.props.a}</p>
        <button onClick={this.props.getDefaultProps}>子组件按钮</button>
     </div>
   }
})
```



<!--more-->

#### 父组件调用子组件：

1）在父组件中的子组件利用ref对子组件标注引用；
2）在父组件中利用this，refs获取子组件的引用，从而调用子组件的成员；

##### example：

```
//父组件：
var parent=React.cleateClass({
    getDS:function(){
       this.refs.one.hands();
    },
    render:function(){
       return <div>
          <children ref="one"></children>
          <button onClick={this.getDS}>发起请求</button>
       </div>
    }
})

//子组件：
var children=React.createClass({
    hands:function(){
       alert('父组件调用成功');
    }
    render:fucntion(){
       return <div></div>
    }
})
```