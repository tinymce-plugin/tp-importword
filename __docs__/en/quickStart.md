# 快速上手
---
## 下载安装

 同时更新维护 [*_**tinymce-plugin**_*](https://www.npmjs.com/package/tinymce-plugin) 和 [*_**@npkg/tinymce-plugin**_*](https://www.npmjs.com/package/@npkg/tinymce-plugin) 中。（二者同步）

### CDN

```html
<script src="https://unpkg.com/tinymce-plugin"></script>
```
或
```html
<script src="https://unpkg.com/@npkg/tinymce-plugin"></script>
```


### NPM

```sh
npm i tinymce-plugin 或 yarn add tinymce-plugin -D
```
或
```sh
npm i @npkg/tinymce-plugin 或 yarn add @npkg/tinymce-plugin -D
```

### 自行下载

这些文件可以在 [*_**unpkg**_*](https://unpkg.com/browse/tinymce-plugin/) 或者[*_**jsDelivr**_*](https://cdn.jsdelivr.net/npm/tinymce-plugin/)  这些 CDN 上浏览和下载,自行存放

## 使用

### 引入

- 没有构建工具

```html
<script src="https://unpkg.com/@npkg/tinymce-plugin"></script>
```
- 使用构建工具

```js
 import "tinymce-plugin";
```
### 开启骨架屏（skeletonScreen）

通过配置参数 **`skeletonScreen`** 来开启 [`tinymce`](https://www.tiny.cloud) 富文本框编辑器的骨架屏功能 ，改善 [`tinymce`](https://www.tiny.cloud) 富文本编辑器加载过长用户体验不佳
:::tip 提示
 要使用 **`skeletonScreen`** 必须 引入  [**tinymce-plugin**](https://www.npmjs.com/package/tinymce-plugin) 或 [**@npkg/tinymce-plugin**](https://www.npmjs.com/package/@npkg/tinymce-plugin)
:::

```js {4}
import "tinymce-plugin"; 
tinymce.init({
  ...
  skeletonScreen: true,
  ...
})
```
使用效果
![skeletonScreen](assets/images/skt-demo.png?100%)
### 引入使用收录的插件或扩展

```js
import "tinymce-plugin"; //作为一些插件的必要依赖
import "tinymce-plugin/plugins/tpIndent2em";
import "tinymce-plugin/plugins/tpLayout";
import "tinymce-plugin/plugins/tpImportword";
```
或
```js
import "@npkg/tinymce-plugin"; //作为一些插件的必要依赖
import "@npkg/tinymce-plugin/plugins/tpIndent2em";
import "@npkg/tinymce-plugin/plugins/tpLayout";
import "@npkg/tinymce-plugin/plugins/tpImportword";
```