---
title: 配置参考
sort: 3
---

# 配置参考

## 如何通过外部按钮触发
 可以用通过 `execCommand('mceTpImportword')` 调用

:::tinymce
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="shortcut icon" href="https://avatars.githubusercontent.com/u/87648636?s=60&v=4" type="image/x-icon">
    <title>Tinymce-Plugin</title>
    <style>
      .open-plugin{
        width:150px;
        height: 30px;
        display: flex;
        padding: 0px 10px;
        background-color:rgb(27, 158, 234);
        border-radius:5px;
        color:white;
        font-size:0;
        text-align:center;
        cursor:pointer;
        align-content: space-around;
        flex-wrap: nowrap;
        align-items: center;
        justify-items: center;
      }
      .open-plugin img{
        display: block;
        width: 20px;
        height: 20px;
      }
      .open-plugin span{
        display: inline-block;
        height:20px;
        line-height:20px;
        vertical-align: middle;
        margin-left:10px;
        font-size:14px;
      }
    </style>
    <script src='/tinymce/tinymce.js'></script>
    <script src="/tinymce/tinymce-plugin.js"></script>
    <script src="https://unpkg.com/tinymce-plugin/langs/zh_CN.js"></script>
    <script src="https://unpkg.com/tinymce-plugin/plugins/tpImportword/plugin.min.js"></script>    
  </head>
  <body tp-page-height="298">
    <div>
      <textarea class="tinymce">
        <p>这是一个导入word插件</p>
      </textarea>
    </div>
    <div>
      <p></p>
      <a onclick="openPlugin()" class="open-plugin"  title="点击调用触发插件" ><img  src="https://avatars.githubusercontent.com/u/87648636?s=60&v=4" alt=""><span>点击调用触发插件</span></a>
    </div>
    <script>

     tinymce.init({
        selector: 'textarea.tinymce',
        language: 'zh_CN',
        skeletonScreen: true,
        plugins: 'code tpImportword autoresize',
        toolbar: 'code tpImportword'
        });

     var openPlugin=()=>{
       tinymce.activeEditor.execCommand('mceTpImportword');
     }
    </script>
  </body>
</html>

```
:::