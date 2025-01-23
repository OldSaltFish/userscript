// ==UserScript==
// @name        必应净化
// @namespace   oldsaltfish@foxmail.com
// @match       https://www.bing.com/search*
// @match       https://www2.bing.com/search*
// @match       https://cn.bing.com/search?*
// @run-at      document-start
// @version     1.0.0
// @author      魂祈梦
// @description 去除多余的搜索建议和低质量搜索结果，2024/1/23 21:51:58
// @icon        https://s11.ax1x.com/2024/01/24/pFetIiR.png
// @require     https://registry.npmmirror.com/jquery/3.7.0/files/dist/jquery.min.js
// @require     https://registry.npmmirror.com/sweetalert2/10.16.6/files/dist/sweetalert2.all.min.js
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       unsafeWindow
// @license      GPL-3.0-or-later
// ==/UserScript==

(function () {
  'use strict';
  let count = 0
  let regex = []
  // 提供一个默认配置，用户设置覆盖该默认值
  let config = {
    // 用户如果修改，直接复制一份存起来
    filterList: [
      { name: 'csdn', domain: 'csdn.net', enabled: true },
      { name: '抖音', domain: 'www.douyin.com', enabled: true }
    ],
    userFilterList: [],
    blockList: [
      { name: 'baidu', regexList: ["/shouji.baidu/", "/lightapp.baidu/", "/author.baidu/", "/ubs.baidu/", "/m2.baidu/", "/baijiahao.baidu/"], enabled: true },
    ],
    userBlockList: []
  }
  /** 加载默认设置和用户设置
   *
   * */
  function init() {
    console.log('初始化配置')
    var userConfig = GM_getValue('dreamqi-bingSearch-config')
    if (userConfig) {
      config = userConfig;
    } else {
      config.filterList.forEach(e => {
        if (e.enabled) config.userFilterList.push(e.domain)
      })
      config.blockList.forEach(e => {
        if (e.enabled) config.userBlockList.push(...e.regexList)
      })
      GM_setValue('dreamqi-bingSearch-config', config)
    }

    regex = config.userBlockList
    // 添加菜单选项
    GM_registerMenuCommand('屏蔽域名列表设置', function () {
      settingGUI()
      console.log('菜单选项被点击')
    });
  }
  /**
   * 通过搜索引擎的高级搜索功能，过滤某些站点。好处是：过滤掉的站点不占搜索结果的条数。而目前谷歌google和必应bing都是一页10条（如果把csdn屏蔽了可能一页都看不到3条记录）
   * 用法：传入域名列表，效果：使用-site:xxx来屏蔽域名，将会重新跳转(因此该脚本生效时，一般会先通过-site来屏蔽域名，而后直接使用dom操作移除某些不太常见的网站)
   *  */
  function filterWithEngine(list) {
    let currentUrl = window.location.href;
    // 解析URL
    let url = new URL(currentUrl);
    // 大概是下面这样子 -site:csdn.net -site:baidu.com
    let strBlockList = ''
    list.forEach(e => {
      strBlockList += ` -site:${e}`
    })
    // 修改查询参数
    if (!url.searchParams.has("dreamsoulmodified")) {
      // 修改查询参数
      let keyword = url.searchParams.get("q");
      url.searchParams.set('q', keyword + strBlockList)
      url.searchParams.set("dreamsoulmodified", "true");
      console.log(keyword)
      // 使用history.replaceState修改URL而不刷新页面
      history.replaceState({}, '', url.toString());
      // 重新加载页面以显示修改后的URL
      window.location.reload();
    } else {
      let keyword = url.searchParams.get("q");
      console.log(keyword)
      // 如果URL已经包含了修改的查询参数，则不再进行修改
      console.log("URL已经包含了修改的查询参数，不再进行修改。");
    }
  }
  function removeList(regex) {
    regex = regex.map(el => {
      // 去除首尾的斜杠
      el = el.slice(1, el.length - 1)
      // 将双斜杠换成单斜杠，注意在控制台还是显示两个斜杠（如果是真正的两个斜杠，在控制台会打印出四个斜杠）
      // el = el.replace(/\\\\/g,"\\");
      el = new RegExp(el)
      return el
    })
    let originList = document.querySelectorAll('#b_results .b_algo')
    // 去除没有链接的
    console.log('originList', originList)
    for (let item of originList) {
      // 6月28日改，与正常搜索结果不同的（没有b_tpcn这个类的）是广告。
      if (item.querySelector('.b_tpcn') === null) {
        item.remove();
        count++;
        continue;
      }
      // 正则匹配href，如果匹配到了，则移除该节点。
      let url
      if (item.querySelector('.tilk')) {
        url = item.querySelector('.tilk').href
      } else {
        url = ''
      }
      // item.querySelector('.tilk').href
      for (let el of regex) {
        if (el.test(url)) {
          item.remove()
          count++
          console.log('已去除:' + url)
        }
      }
    }
  }
  function removeOthers() {
    // 去除搜索建议
    let removeList = document.querySelectorAll('#b_results .b_ans')
    removeList.forEach((item) => {
      item.remove()
      count++
    })
    // 去除展开，比如知乎的问答，一个链接下面出现了很多莫名其妙的小链接，去除了这些小链接。
    let deepLink = document.querySelector('.b_deeplinks_block_container')
    if (deepLink) {
      deepLink.remove()
      count++
    }
    console.log('去除deeplinks(常见于知乎)');
    let deepDesk = document.querySelector('.b_deepdesk')
    if (deepDesk) {
      deepDesk.remove()
      count++
    }
    console.log('去除deepDesk(搜索bing时出现词典地图之类的同类产品)');
    // 去除推荐
    let recommandList = document.querySelectorAll('#b_pole,.b_algoRCAggreFC,.rpr_light,.b_algospacing,.b_ad')
    recommandList.forEach(item => {
      item.remove()
      count++
    })
    // 去除带有data-favicon-t属性的父级元素（也就是搜索结果）
    // document.querySelectorAll('[data-favicon-t]').forEach(item =>{
    //   console.log(item)
    //   item.parentNode.remove();
    //   count++;
    // })

    // 去除豆包广告
    let doubaoList = document.querySelectorAll('.b_overflow2')
    recommandList.forEach(item => {
      // 去除包含广告类的li
      item.closest('.b_algo').remove()
      count++
    })
  }
  function settingGUI() {
    console.log('设置被点击。')
    console.log(Swal)
    // 注意，下面这个函数是异步的
    Swal.fire({
      title: '添加正则',
      input: "text",
      inputLabel: "此处输入正则(左右不需要加/)",
      showCloseButton: true,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: `
            确定
          `,
      confirmButtonAriaLabel: "确定",
      // preConfirm: input=>{
      //   input = '/'+input+'/'
      //   console.log("preConfirm")
      //   regex.push(input)
      //   Swal.fire({
      //     title: "添加成功",
      //     icon: "success"
      //   })
      //   console.log(regex)
      // },
      denyButtonText: `
            修改正则列表
          `,
      cancelButtonText: `
            取消
          `,
      cancelButtonAriaLabel: "Thumbs down",
      focusConfirm: true
    })
      .then(result => {
        console.log(result)
        if (result.isConfirmed) {
          console.log('确认')
          let input = result.value
          if (input == '') return
          input = '/' + input + '/'
          regex.push(input)
          config.userBlockList = regex
          GM_setValue('dreamqi-bingSearch-config', config)
          Swal.fire({
            title: "添加成功",
            icon: "success"
          })
          // Swal.fire({
          //     title: '获取到正则',
          //     text: test
          // })
        } else if (result.isDenied) {
          const textarea = document.createElement('textarea')
          textarea.innerHTML = JSON.stringify(GM_getValue("dreamqi-bingSearch-config").userBlockList)
          textarea.id = 'modText'
          textarea.style.width = '100%'
          textarea.style.height = '75vh'
          Swal.fire({
            title: "修改正则",
            html: textarea
            // `
            //   <textarea id="modText" style="width: 100%;height:75vh;">${GM_getValue("dreamqi-bingSearch-regex")}</textarea>
            // `
            ,
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: false,
          })
            .then(result => {
              // 如果点了确定以外的按钮就退出
              if (!result.isConfirmed) return
              let input = textarea.value
              input = JSON.parse(input)
              config.userBlockList = input
              GM_setValue('dreamqi-bingSearch-config', config)
              Swal.fire({
                title: "修改成功",
                icon: "success"
              })
            })
          // 由于异步函数的特性，下面这条语句能在滑动条出现时（前）将其设置在底部，不知道为什么提前设置没有反应（可能是在该元素出现在页面上时会被重新赋值scrollTop）。
          textarea.scrollTop = textarea.scrollHeight
        } else if (result.isDismissed) {
          console.log('关闭')
        }
      });
  }
  function addButton() {
    var pNode = document.querySelector('#b_tween')
    // 添加设置按钮
    let setting = document.createElement('button')
    setting.innerHTML = 'bing净化设置'
    setting.addEventListener('click', () => {
      settingGUI()
    })
    let guoji = document.querySelector('.b_scopebar')
    pNode.appendChild(setting)
    guoji.appendChild(setting)
    var ResultText = document.createElement('div')
    ResultText.id = 'resultText'
    ResultText.innerHTML = `
      <h2>已去除${count}个广告或者多余链接</h2>
      `
    pNode.appendChild(ResultText)
  }


  // 定义部分结束
  // main，主进程现在开始
  init()
  filterWithEngine(config.userFilterList)
  document.addEventListener('DOMContentLoaded', () => {
    removeList(regex)
    removeOthers()
    addButton()
  })

})()