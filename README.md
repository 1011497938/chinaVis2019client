# 教程
----
## 下载
>git clone git@10.76.0.186:TanSiwei/qcSystemClient.git

## 部署运行
> npm install

> npm start

```打开http://localhost:3000/ ```

----
## 备注
### 原项目github
```
https://github.com/1011497938/qscVis
```

### 文件夹解释
1. /src/data 存放数据文件，每次放入时旧文件不用删除，在里面重新建一个文件夹放入数据
2. /src 存放代码，放入/src/component存放组件，/src/dataManager存放互联网通信，数据存储的类
3. /src/static 存放静态文件，比如css，图片等

### 使用框架
#### 总体
1. react 组件化编程 [官网](https://reactjs.org/)
2. mobx 提供状态管理，学习下几个基本的装饰器用法就好了 [文档](https://cn.mobx.js.org/)
#### 绘图
1. d3 绘图 [文档](https://www.npmjs.com/package/d3)
2. vis-react 一个我觉得比d3更适合react的绘图的框架,开发速度也更快 [官网](https://www.npmjs.com/package/react-vis)
3. nivo 有很多线程的组件可以使用 [官网](https://nivo.rocks/)
#### 布局
1.semantic-ui [文档网站](https://react.semantic-ui.com/)

----
### 代码编写注意
#### 代码命名规则
```
组件：驼峰式，例如：YixiangView
css(类名)：-，例如：yixiang-view
类名命名逻辑：[父元素类名]-[元素类型]-[元素作用]，例如 y-view-btn-run
```
### git相关
一般流程：
```
                          //开始修改
git checkout -b branchA
                          //修改中……

                          //修改完毕

git status                //查看修改状态
git add fileName          //add文件
git commit -m "log"       //在branchA中commit 
git checkout branchB      //切换回BranchA父分支branchB
git pull                  //从远程数据库拉取代码
git merge branchA         //合并分支
git push                  //将修改提交到远程数据库
git branch -d branchA     //将branchA删除
```