---
title: 快速上手
sort: 5
---
# 快速上手

[[toc]]

## 方式1
---
> **使用 tinymce-plugin 库**

### CDN

```html
<script src="https://unpkg.com/tinymce-plugin/plugins/tpImportword/plugin.min.js"></script><!--引入-->

<!-- 使用 -->
<script>
   tinymce.init({
  ...
   plugins: "tpImportword"
   toolbar: "tpImportword"
  ...
 })
</script>

```
### NPM


#### 下载 tinymce-plugin 
<codeGroup>
 <codeGroupItem title="NPM" active>

```sh
npm i tinymce-plugin 
```
</codeGroupItem>
<codeGroupItem title="YARN">

```sh
yarn add tinymce-plugin -D 
```
</codeGroupItem>
</codeGroup>

#### 项目中使用

```js {1,4-5}
 import "tinymce-plugin/plugins/tpImportword/plugin.js";
 tinymce.init({
  ...
   plugins: "tpImportword"
   toolbar: "tpImportword"
  ...
 })

```

## 方式2 
---
>**使用单独 [*_@tinymce-plugin/tp-importword_*](https://www.npmjs.com/package/@tinymce-plugin/tp-importword)**

#### 下载 @tinymce-plugin/tp-importword
<codeGroup>
 <codeGroupItem title="NPM" active>

```sh
npm i @tinymce-plugin/tp-importword
```
</codeGroupItem>
<codeGroupItem title="YARN">

```sh
yarn add @tinymce-plugin/tp-importword -D 
```
</codeGroupItem>
</codeGroup>


#### 项目中使用

```js {1,4-5}
 import "@tinymce-plugin/tp-importword";
 tinymce.init({
  ...
   plugins: "tpImportword"
   toolbar: "tpImportword"
  ...
 })
```

## 方式3 
---
> **自行下载使用**
这些文件可以在 [*_**unpkg**_*](https://unpkg.com/browse/tinymce-plugin/) 或者[*_**jsDelivr**_*](https://cdn.jsdelivr.net/npm/tinymce-plugin/)  这些 CDN 上浏览和下载,自行存放与使用