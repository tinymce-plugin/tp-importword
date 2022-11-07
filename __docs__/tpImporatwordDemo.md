---
title: 插件demo
---
<demoGroup>
 <demoGroupItem title="Javascript">

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
    <script src="https://unpkg.com/tinymce-plugin/plugins/tpLayout/plugin.min.js"></script>    
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
        plugins: 'code tpLayout autoresize',
        toolbar: 'code tpLayout'
        });

     var openPlugin=()=>{
       tinymce.activeEditor.execCommand('mceTpLayout');
     }
    </script>
  </body>
</html>

```
:::


 </demoGroupItem>
 <demoGroupItem title="Vue3" active>

:::tinymce-vue3

```vue
<template>
<div>
 <h1>插件demo展示区域</h1>
  <div class="vueDemo">
    <tinymce-vue v-model="content" :init="tinymceOptions" ></tinymce-vue>
  </div>
  <div  v-html="content"></div>
</div>
</template>

<script>
import tinymce from "tinymce";
import "tinymce-plugin";
import TinymceVue from "@tinymce-plugin/tinymce-vue";
import "tinymce-plugin/plugins/tpLayout/plugin.js";
export default{
name: 'domeVue3',
components: { TinymceVue },
data(){
    return {
        content: '这是一个导入word插件',
        tinymceOptions:{
                min_height: 300,
                max_height: 700,
                skeletonScreen: true,
                base_url:'/tinymce',
                plugins: 'code tpLayout preview autoresize',
                toolbar: 'code tpLayout preview',
             
        }
    }
  }
}
</script>
```
:::
 </demoGroupItem>
 <demoGroupItem title="Vue2">

:::tinymce-vue2
```vue
<template>
<div>
 <h1>插件demo展示区域</h1>
  <div class="vueDemo">
    <tinymce-vue v-model="content" :init="tinymceOptions" ></tinymce-vue>
  </div>
  <div v-html="content"></div>
</div>
</template>

<script>
import tinymce from "tinymce";
import "tinymce-plugin";
import "tinymce-plugin/plugins/tpLayout/plugin.js";
import TinymceVue from "@tinymce-plugin/tinymce-vue";
export default{
name: 'domeVue2',
components: { TinymceVue },
data(){
    return {
        content: '这是一个导入word插件',
        tinymceOptions:{
                min_height: 300,
                max_height: 700,
                base_url:'/tinymce',
                plugins: 'code tpImportword preview autoresize',
                toolbar: 'code tpImportword Preview',
                skeletonScreen: true,
        }
    }
  }
}
</script>
```
:::
 </demoGroupItem>
 <demoGroupItem title="React">

:::tinymce-react
```html
<script>
import React from 'react';
import ReactDOM from 'react-dom';
import tinymce from "tinymce";
import "tinymce-plugin";
import "tinymce-plugin/plugins/tpIndent2em/plugin.js";
import { Editor } from '@tinymce/tinymce-react';

     class ReactDemo extends React.Component{
       constructor(props) {
           super(props);
           this.state = { reactDemoInitialValue: "<p>这是一个REactDemo</p>"};
           this.reactDemoInit = {
                    min_height: 220,
                    base_url:'/tinymce',
                    branding: false,
                    language:'zh_CN',
                    menubar: false,
                    skeletonScreen: true,
                    plugins: 'code tpImportword autoresize',
                    toolbar: 'undo redo code tpImportword',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
             };
       this.handleChange = (data)=>{
              this.setState({reactDemoInitialValue: data})
        }
      }
      render(){
        return (
           <div>
            <h1>这是一个React实例</h1>
            <div>
            <Editor initialValue={this.state.reactDemoInitialValue} init={this.reactDemoInit} onEditorChange={this.handleChange} />
            </div>
            <div dangerouslySetInnerHTML={{__html: this.state.reactDemoInitialValue }} ></div>
          </div>
          );
      }
    }

   ReactDOM.render(<ReactDemo />, document.getElementById('ReactRootID'));
</script>
```
:::
 </demoGroupItem>
</demoGroup>

## 使用 @tinymce-plugin/tp-importword

:::tinymce-vue3

```vue {13}
<template>
<div>
 <h1>插件demo展示区域</h1>
  <div class="vueDemo">
    <tinymce-vue v-model="content" :init="tinymceOptions" ></tinymce-vue>
  </div>
  <div  v-html="content"></div>
</div>
</template>
<script>
import tinymce from "tinymce";
import TinymceVue from "@tinymce-plugin/tinymce-vue";
import "@tinymce-plugin/tp-importword";
export default{
name: 'domeVue3',
components: { TinymceVue },
data(){
    return {
        content: '这是一个导入word插件',
        tinymceOptions:{
                min_height: 200,
                max_height: 700,
                base_url:'/tinymce',
                menubar: 'file edit  insert view format table tools help mymenubar',
                menu: {
                    mymenubar: {title: 'Extension', items: 'tpImportword tpI18n' },
                },
                plugins: 'code tpImportword preview autoresize',
                toolbar: 'code tpImportword preview',
             
        }
    }
  }
}
</script>
```
:::