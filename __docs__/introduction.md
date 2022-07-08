---
title: 插件介绍
sort: 9
---

# 🚀 tpImportword
[![tinymce-plugin](https://tinymce-plugin.github.io/badge.svg)](https://github.com/tinymce-plugin)&nbsp;
[![release candidate](https://img.shields.io/npm/v/@tinymce-plugin/tp-importword.svg)](https://www.npmjs.com/package/@tinymce-plugin/tp-importword)&nbsp;
[![tinymce Version](https://img.shields.io/badge/tinymce-5.2.0~5.x.x-green.svg)](https://www.tiny.cloud)&nbsp; 
[![GitHub license](https://img.shields.io/github/license/tinymce-plugin/tp-indent2em.svg)](https://github.com/tinymce-plugin/tp-indent2em/blob/main/LICENSE)&nbsp;
[![tinymce Version](https://img.shields.io/npm/dw/@tinymce-plugin/tp-importword)](https://www.tiny.cloud)


tpImportword 插件用于 `tinymce` 富文本编辑器 实现导入word功能, 并且最大可能保存布局样式与颜色等

欢迎提供好的建议 或者反馈bug
:::warning 
### 注意
目前及支持 docx 文件
:::

:::tip 提示
导入word 插件导入的图片默认是base64 ，需要配置 **`automatic_uploads`** 属性,同时需要保证配置了 **`images_upload_handler`**, 可将导入的图片自动上传服务器转成url链接

```js {4-5}
 import "@tinymce-plugin/tp-importword";
 tinymce.init({
  ...
   images_upload_handler: (blobInfo, succFun, failFun)=>{ ... }
   automatic_uploads: true
   plugins: "tpImportword"
   toolbar: "tpImportword"
  ...
 })
```
:::