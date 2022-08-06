

import  "tinymce/skins/ui/oxide/skin.min.css"
import  "tinymce/skins/ui/oxide/content.min.css"
import  tinymce, { Editor } from "tinymce"
import  "tinymce-plugin"
import  "tinymce-plugin/langs/zh_CN"
import  "tinymce/themes/silver/theme"
import  "tinymce/icons/default"
import  "tinymce/plugins/code"
import  "tinymce/plugins/imagetools"
import  "tinymce/plugins/media"

import plugin from "../src/main"
//@ts-ignore
  tinymce.init({
    selector: 'textarea.tinymce',
    plugins: `code  imagetools media ${plugin.opt.registryName}`,
    toolbar: `code ${plugin.opt.registryName}`,
    skin: false,
    language: 'zh_CN',
    min_height:240,
    tp_i18n: true,
    tp_i18n_url: '/tinymce/langs',
    // skeletonScreen: true,
    content_css: false,
  }).then(()=>{
  tinymce.init({
    selector: 'div#mytextarea',
    menubar: 'file edit  insert view format table tools help mymenubar',
    skin: false,
    tp_i18n: true,
    tp_i18n_langs: true,
    content_css: false,
    language: 'en',
    external_plugins:{
        image: "/tinymce/plugins/image/plugin.js"
    },
    tp_i18n_url: '/tinymce/langs',
    menu: {
        mymenubar: {title: 'Extension', items: `${plugin.opt.registryName}`+' tpI18n' },
    },
    min_height:240,
    object_resizing: 'img span.data-tp-logicflow',
    // skeletonScreen: true,
    plugins: `code ${plugin.opt.registryName}`,
    toolbar: `code ${plugin.opt.registryName} image`,
  })
});
       //@ts-ignore
   window.openPlugin=()=>{
   tinymce.activeEditor.execCommand(`mceTp${plugin.opt.name}`);
    }

// },200)