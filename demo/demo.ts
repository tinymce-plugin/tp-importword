

import  "tinymce/skins/ui/oxide/skin.min.css"
import  "tinymce/skins/ui/oxide/content.min.css"
import  tinymce, { Editor } from "tinymce"
import  tinymcePlugin from "tinymce-plugin"
import  "tinymce-plugin/langs/zh_CN"
import  "tinymce/themes/silver/theme"
import  "tinymce/icons/default"
import  "tinymce/plugins/code"
import  "tinymce/plugins/image"
import  "tinymce/plugins/imagetools"
import  "tinymce/plugins/media"

import plugin from "../src/main"
//@ts-ignore
  tinymce.init({
    selector: 'textarea.tinymce',
    plugins: `code image imagetools media ${plugin.opt.registryName}`,
    toolbar: `code ${plugin.opt.registryName}`,
    skin: false,
    language: 'zh_CN',
    min_height:240,
    // skeletonScreen: true,
    content_css: false,
  });
  tinymce.init({
    selector: 'div#mytextarea',
    menubar: 'file edit  insert view format table tools help mymenubar',
    skin: false,
    language: 'zh_CN',
    content_css: false,
    menu: {
        mymenubar: {title: 'Extension', items: `${plugin.opt.registryName}` },
    },
    min_height:240,
    // skeletonScreen: true,
    plugins: `code ${plugin.opt.registryName}`,
    toolbar: `code ${plugin.opt.registryName}`,
  })
       //@ts-ignore
   window.openPlugin=()=>{
   tinymce.activeEditor.execCommand(`mceTp${plugin.opt.name}`);
    }

// },200)