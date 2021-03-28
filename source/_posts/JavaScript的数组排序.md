---
title: JavaScript的数组排序
date: 2018-07-21 22:06:30
tags: [javascript]
---



#### 1. JavaScript的sort()方法

```
var array = [1,4,-8,-3,6,12,9,8];
function compare(val1,val2){
    return val1-val2;
};
array.sort(compare);
document.write(array);
```

sort()方法按照升序排列数组项，会调用每个数组项的toString()转型方法，然后比较得到的字符串。

toString()方法是把布尔值（Boolean）或对象(Object)转换为字符串，并返回结果。

compare()函数方法是一个比较函数，作为sort()方法的参数。

<!--more-->

#### 2. 冒泡排序（从后向前）

```
var array = [1,4,-8,-3,6,12,9,8];
function sort(arr){
    for(var j=0;j<arr.length-1;j++){
    //两两比较，如果前一个比后一个大，则交换位置。
       for(var i=0;i<arr.length-1-j;i++){
            if(arr[i]>arr[i+1]){
                var temp = arr[i];
                arr[i] = arr[i+1];
                arr[i+1] = temp;
            }
        } 
    }
}
sort(array);
document.write(array);
```

（1）比较相邻的元素。如果第一个比第二个大，就交换他们两个位置。
（2）对每一对相邻元素作同样的工作，从开始第一对到结尾的最后一对。在这一点，最后的元素应该会是最大的数。
（3）针对所有的元素重复以上的步骤，除了最后一个。
（4）持续每次对越来越少的元素重复上面的步骤，直到没有任何一对数字需要比较。

#### 3. 快速排序：递归思想，两边快速的排序，冒泡排序的改进

```
var array = [1,4,-8,-3,6,12,9,8];
function quickSort(arr){
//如果数组长度小于等于1，则返回数组本身
    if(arr.length<=1){
        return arr;
    }
    //定义中间值的索引
    var index = Math.floor(arr.length/2);
    //取到中间值
    var temp = arr.splice(index,1);
    //定义左右部分数组
    var left = [];
    var right = [];
    for(var i=0;i<arr.length;i++){
    //如果元素比中间值小，那么放在左边，否则放右边
        if(arr[i]<temp){
            left.push(arr[i]);
        }else{
            right.push(arr[i]);
        }
    }
    return quickSort(left).concat(temp,quickSort(right));
}
document.write(quickSort(array));
```

Math.floor(x)方法是向下取整，返回小于或等于x的最接近的整数。

splice(index,num,item)方法是向数组中添加项目，或是从数组中删除项目，并返回被删除的项目。

index是整数，被操作项目所在的位置（必须）
num是整数，要删除的项目的数量，如果为0，表示不删除（必须）
item是向数组中添加的新项目，可以是多个（可选）
push()方法是向数组末尾添加一个或多个新项目并返回新数组的长度

concat()方法连接两个或多个数组，不会改变原有数组，返回一个新数组

#### 4. 插入排序

```
var array = [1,4,-8,-3,6,12,9,8];
function insertSort(arr){
//假设第0元素是有序序列，第1元素之后是无序的序列。从第1元素开始依次将无序序列的元素插入到有序序列中
    for(var i=1; i<arr.length;i++){
        if(arr[i]<arr[i-1]){
            //取出无序序列中需要插入的第i个元素
            var temp = arr[i];
            //定义有序中的最后一个位置
            var j = i-1;
            arr[i] = arr[j];
            //比较大小，找到插入的位置
            while(j>=0&&temp<arr[j]){
                arr[j+1] = arr[j];
                j--;
            };
            //插入
            arr[j+1] = temp;
        }
    }
  }
insertSort(array)
document.write(array);
```

（1）从第一个元素开始，该元素可以认为已经被排序
（2）取出下一个元素，在已经排序的元素序列中扫描
（3）如果该元素（已排序）大于新元素，将该元素移到下一位置
（4）重复步骤3，直到找到已排序的元素小于或者等于新元素的位置
（5）将新元素插入到下一位置中
（6）重复步骤2

#### 5. 选择排序

```
var array = [1,4,-8,-3,6,12,9,8];
function selectSort(arr){
    for(var i=0;i<arr.length;i++){
        //设置当前范围最小值和索引
        var min = arr[i];
        var minIndex = i;
        //在该范围选出最小值
        for(var j=i+1;j<arr.length;j++){
            if(min>arr[j]){
                min = arr[j];
                minIndex = j;
            }
        }
        //将最小值插入,并将原来位置的最小值删除
        arr.splice(i,0,min);
        arr.splice(minIndex+1,1);
    }
}
selectSort(array);
document.write(array);
```

（1）在未排序序列中找到最小（大）元素
（2）并存放到排序序列的起始位置
（3）然后，再从剩余未排序元素中继续寻找最小（大）元素
（4）然后放到已排序序列的末尾。
（5）以此类推