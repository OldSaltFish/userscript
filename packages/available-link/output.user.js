// ==UserScript==
// @name        链接替换/AvailableLink
// @namespace   oldsaltfish@foxmail.com
// @match       *://*/*
// @run-at      document-start
// @version     0.1.0
// @author      魂祈梦
// @description 替换一些不喜欢的链接，比如谷歌商店替换为Apkpure
// @icon        https://s11.ax1x.com/2024/01/24/pFetIiR.png
// @grant       GM_registerMenuCommand
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @noframes
// @license      GPL-3.0-or-later
// ==/UserScript==


(function() {
  'use strict';
  // 添加全局样式
  GM_addStyle(String.raw``);
  (()=>{"use strict";let e=()=>{document.querySelectorAll("a").forEach(e=>{let t=e.href,n=function(e){let t=e.match(/https:\/\/play\.google\.com\/store\/apps\/details\?(?:[^&]*&)*id=([^&]+)/);return t?t[1]:null}(t);n&&(e.href=`https://apkpure.net/cn/search?q=${n}`,console.log("谷歌商店链接已替换为Apkpure: ",t," -> ",e.href))}),document.removeEventListener("DOMContentLoaded",e)};document.addEventListener("DOMContentLoaded",e)})();

})();
