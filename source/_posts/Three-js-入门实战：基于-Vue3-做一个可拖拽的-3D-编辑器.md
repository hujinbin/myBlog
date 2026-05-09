---
title: Three.js 入门实战：基于 Vue3 做一个可拖拽的 3D 编辑器
date: 2025-07-23 21:14:38
tags: ['Three.js', 'Vue3', 'TypeScript', '新手教程', '3D可视化', '数字孪生']
---


# Three.js 入门实战：基于 Vue3 做一个可拖拽的 3D 编辑器

## 前言

如果你是第一次接触 Three.js，这篇文章会带你从 0 到 1 建立完整认知：

1.  Three.js 到底是什么。
2.  核心概念有哪些。
3.  怎么在真实项目里用起来。
4.  新手最容易踩哪些坑。

本文不是纯理论，而是结合我自己写的一个真实项目 `drag-3D-three` 来讲解。这个项目是一个 3D/2D 可视化大屏编辑器，Three.js 部分支持拖拽创建几何体、加载模型、选择元素、修改属性和保存案例。

技术栈：`Vue 3 + TypeScript + Vite + Three.js + Pinia`

***

## 一、Three.js 是什么

Three.js 是一个运行在浏览器中的 3D 图形库，它基于 WebGL 做了高级封装。

你可以把它理解成：

1.  WebGL 是底层图形 API，能力强但很底层。
2.  Three.js 是更易用的“3D 开发工具箱”。
3.  你不需要直接写复杂着色器，也能快速搭建 3D 场景。

Three.js 适合做什么：

1.  3D 数据可视化。
2.  数字孪生大屏。
3.  在线 3D 编辑器。
4.  模型展示页。
5.  小型网页 3D 互动。

***

## 二、先记住 7 个核心概念（新手必会）

### 1. Scene（场景）

所有 3D 对象都放在 Scene 里。它相当于“舞台”。

```typescript
const scene = new THREE.Scene()
```

### 2. Camera（相机）

相机决定你从哪里看场景。

常用的是透视相机：`PerspectiveCamera`。

```typescript
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
camera.position.z = 50
```

### 3. Renderer（渲染器）

渲染器负责把场景画到 canvas 上。

```typescript
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(width, height)
```

### 4. Geometry + Material + Mesh

一个能看到的 3D 物体通常由三部分组成：

1.  `Geometry`：形状（立方体、球体等）。
2.  `Material`：材质（颜色、金属感、粗糙度等）。
3.  `Mesh`：几何体 + 材质的组合。

```typescript
const geometry = new THREE.BoxGeometry(5, 5, 5)
const material = new THREE.MeshStandardMaterial({ color: '#4F46E5' })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)
```

### 5. Light（光照）

如果你用的是标准材质（`MeshStandardMaterial`），必须有光，不然会很黑。

```typescript
scene.add(new THREE.AmbientLight(0xffffff, 0.5))
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(1, 1, 1)
scene.add(directionalLight)
```

### 6. Controls（控制器）

项目里使用 `OrbitControls`，让用户能旋转、缩放、平移视角。

### 7. Animation Loop（动画循环）

Three.js 渲染通常放在循环里持续执行：

```typescript
function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
animate()
```

只要你掌握这 7 点，已经能做出基础可交互场景。

***

## 三、基于我这个项目看 Three.js 怎么“落地”

下面结合我项目 `drag-3D-three` 的核心文件 `src/components/ThreeDWorkspace.vue` 看实战。

### 1. 初始化 3D 工作区

在 `initThreeJS` 里完成了完整初始化流程：

1.  创建 `scene`、`camera`、`renderer`。
2.  注册 `OrbitControls`。
3.  添加环境光、平行光、网格辅助线 `GridHelper`。
4.  初始化 `Raycaster` 用于点击选中。
5.  绑定 `resize`、`click`、`dragover`、`drop` 等事件。

这就是一个标准的 Three.js 工程启动模板。

### 2. 元素数据结构（非常关键）

项目定义了统一元素结构，类似：

```typescript
interface Element {
  id: string
  name: string
  type: 'cube' | 'sphere' | 'cylinder' | 'pyramid' | 'custom'
  position: { x: number; y: number; z: number }
  size: { width: number; height: number; depth: number; radius: number }
  color: string
  number: string
  modelUrl?: string
}
```

为什么新手要重视这一步：

1.  数据结构统一后，渲染逻辑可复用。
2.  能轻松做保存、撤销、模板化。
3.  后续扩展动画、材质、权限都更顺。

### 3. 创建基础几何体

项目按 `type` 分发创建几何体：

1.  `cube` -> `BoxGeometry`
2.  `sphere` -> `SphereGeometry`
3.  `cylinder` -> `CylinderGeometry`
4.  `pyramid` -> `ConeGeometry`

然后统一材质和位置设置，最后 `scene.add(mesh)`。

### 4. 加载自定义模型（GLTF/OBJ/FBX/STL）

项目支持多种模型格式，按扩展名选择对应 Loader：

1.  `GLTFLoader`
2.  `OBJLoader`
3.  `FBXLoader`
4.  `STLLoader`

加载后通过 `Box3` 计算模型包围盒，自动缩放到目标尺寸。这一步很实用，能避免不同模型源比例不一致的问题。

### 5. 用 Raycaster 做“点击选中”

点击画布后，先把鼠标坐标转换到标准化设备坐标，再发射射线检测相交对象。命中后通过 `userData.elementId` 找到业务元素。

这个思路是 Three.js 交互的基础技能。

### 6. 拖拽放置：把 HTML 拖拽和 3D 场景打通

项目中左侧元素卡片可拖拽，拖拽数据通过 `dataTransfer` 传入画布：

1.  工具栏组件写入 `application/json`。
2.  工作区 `handleDrop` 解析 JSON。
3.  根据鼠标位置生成 3D 元素并发出 `element-created`。

这就是“低代码编辑器”的核心路径。

***

## 四、新手从零跑起来（实操步骤）

### 1. 安装和启动

```bash
npm install
npm run dev
```

### 2. 使用路径

1.  进入编辑页。
2.  左侧拖一个“立方体”到中间画布。
3.  鼠标右键/滚轮配合 `OrbitControls` 调整视角。
4.  点击元素，在右侧修改位置、尺寸、颜色、编号。
5.  点击保存，写入案例库。

### 3. 你会学到什么

完成以上步骤后，你会自然掌握：

1.  Scene/Camera/Renderer 的协作关系。
2.  Three.js 和 Vue 组件的通信方式。
3.  基础几何体与外部模型的统一管理。
4.  射线拾取和拖拽交互。
5.  Three.js 项目中的状态持久化思路。

***

## 五、常见问题与避坑清单

### 1. 场景里什么都看不见

排查顺序：

1.  相机是否对着物体。
2.  是否有光照。
3.  物体是否被加到 scene。
4.  动画循环是否在执行。
5.  canvas 尺寸是否正确。

### 2. 模型加载失败

排查顺序：

1.  模型路径是否可访问。
2.  文件扩展名是否匹配 Loader。
3.  是否有跨域问题。
4.  控制台错误信息是否显示解析失败。

### 3. 拖拽位置不准

当前项目使用屏幕坐标线性映射，新手阶段够用；如果你追求更精确，建议升级为“射线与地面平面求交”方案。

### 4. 画面卡顿

常见原因：

1.  每次数据变化都全量重建 mesh。
2.  几何体分段数设置太高。
3.  频繁创建对象但没有释放资源。

***

## 六、进阶建议：从教程走向实战

如果你已经跑通我这个项目，下一步建议按这个顺序升级：

1.  加 `TransformControls`（选中后可视化移动/旋转/缩放）。
2.  实现元素分组和层级管理。
3.  增加材质面板（透明度、贴图、发光）。
4.  加载压缩模型（Draco）优化首屏。
5.  增量更新渲染，减少全量重建。
6.  引入截图功能生成案例缩略图。

***

## 七、总结

Three.js 入门最怕两件事：

1.  只看 API，不做项目。
2.  直接做复杂效果，基础不稳。

这篇教程给你的路径是：

1.  先吃透核心概念（场景、相机、渲染器、光照、Mesh）。
2.  用真实项目练习交互（拖拽、选中、更新、持久化）。
3.  再逐步走向工程化（性能、架构、可扩展性）。

当你能独立搭出一个可拖拽编辑器时，就已经不再是 Three.js 初学者了。

***

## 项目求个 Star

如果这篇文章或这个项目对你有帮助，欢迎访问仓库并点一个 Star：

`https://github.com/hujinbin/drag-3D-three`

你的每一个 Star，都会让我更有动力持续更新：

1.  新手友好的 Three.js 示例。
2.  更完整的编辑器能力（变换控制、材质系统、分组层级）。
3.  更实用的工程化优化（性能、资源管理、可维护性）。

也欢迎提 Issue 或 PR，一起把这个项目打磨成更好用的 Three.js 学习模板。

