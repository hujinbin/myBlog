---
title: css3奇偶选择
date: 2019-09-22 12:18:44
tags: [css]
---



#### 第一种：简单数字序号写法

:nth-child(number) 直接匹配第number个元素。参数number必须为大于0的整数。 例子：

```
代码如下:

li:nth-child(3){background:orange;}
```

#### 第二种：倍数写法

:nth-child(an) 匹配所有倍数为a的元素。其中参数an中的字母n不可缺省，它是倍数写法的标志，如3n、5n。 例子：

```
代码如下:

li:nth-child(3n){background:orange;}
```

<!--more-->

#### 第三种：倍数分组匹配

:nth-child(an+b) 与 :nth-child(an-b) 先对元素进行分组，每组有a个，b为组内成员的序号，其中字母n和加号+不可缺省，位置不可调换，这是该写法的标志，其中a,b均为正整数或0。如3n+1、5n+1。但加号可以变为负号，此时匹配组内的第a-b个。（其实an前面也可以是负号，但留给下一部分讲。） 例子：

```
代码如下:

li:nth-child(3n+1){background:orange;} 
li:nth-child(3n+5){background:orange;} 
li:nth-child(5n-1){background:orange;} 
li:nth-child(3n±0){background:orange;}
li:nth-child(±0n+3){background:orange;}
```

#### 第四种：反向倍数分组匹配

:nth-child(-an+b) 此处一负一正，均不可缺省，否则无意义。这时与:nth-child(an+1)相似，都是匹配第1个，但不同的是它是倒着算的，从第b个开始往回算，所以它所匹配的最多也不会超过b个。 例子：

```
代码如下:
li:nth-child(-3n+8){background:orange;}
li:nth-child(-1n+8){background:orange;}
```

#### 第五种：奇偶匹配

:nth-child(odd) 与 :nth-child(even) 分别匹配序号为奇数与偶数的元素。奇数(odd)与(2n+1)结果一样；偶数(even)与(2n+0)及(2n)结果一样。