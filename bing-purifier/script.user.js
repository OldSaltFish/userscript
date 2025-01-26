// ==UserScript==
// @name        必应净化
// @namespace   oldsaltfish@foxmail.com
// @match       https://www.bing.com/search*
// @match       https://www2.bing.com/search*
// @match       https://cn.bing.com/search?*
// @run-at      document-start
// @version     1.1.1
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
  /** @type {BingSearchConfig} */
  let config = {
    // 用户如果修改，直接复制一份存起来
    filterList: [
      { name: 'csdn', domain: 'csdn.net', enabled: true },
      { name: '抖音', domain: 'www.douyin.com', enabled: true }
    ],
    blockList: [
      { name: 'baidu', regexList: ["/shouji.baidu/", "/lightapp.baidu/", "/author.baidu/", "/ubs.baidu/", "/m2.baidu/", "/baijiahao.baidu/"], enabled: true },
    ],
    userBlockList: []
  }
  // main，主进程现在开始
  // 只有首次执行使用默认配置来初始化用户配置，之后全部使用用户配置
  init()
  // 使用bing搜索引擎的内置规则，过滤一些站点
  filterWithEngine(config.filterList)
  // 使用js代码，在搜索结果生成后，移除部分搜索结果
  blockSearchResult()
  // 构建按钮等GUI界面
  initGUI();

  // 后面都是方法定义等代码
  /** 
   * 脚本安装后首次运行时，初始化
   * */
  function init() {
    var userConfig = GM_getValue('dreamqi-bingSearch-config')
    if (userConfig) {
      config = userConfig;
    } else {
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
   * @param {FilterItem[]} list - The list of filter items to apply
   */
  function filterWithEngine(list) {
    let currentUrl = window.location.href;
    // 解析URL
    let url = new URL(currentUrl);
    // 大概是下面这样子 -site:csdn.net -site:baidu.com
    let strBlockList = ''
    list.forEach(item => {
      if (!item.enabled) return;
      strBlockList += ` -site:${item.domain}`
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

  function blockSearchResult(){
    document.addEventListener('DOMContentLoaded', () => {
      removeList(regex)
      removeOthers()
    })
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
      // 去除各种乱七八糟的搜索结果（推荐搜索、广告、推荐回答等）
      let recommandList = document.querySelectorAll('#b_pole,.b_algoRCAggreFC,.rpr_light,.b_algospacing,.b_ad,.b_ans,#inline_rs')
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
      if (doubaoList) {
        console.log('去除豆包广告');
        count++;
      }
      doubaoList.forEach(item => {
        // 去除包含广告类的li
        item.closest('.b_algo').remove()
        count++
      })
    }
  }

  // bing净化按钮被点击时触发的方法，bing搜索页面的按钮可触发，油猴脚本中的选项按钮也能触发。  
  function settingGUI() {
    console.log('设置被点击。')
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
  // 依赖于lit的页面构建以及修改，应当写在该函数中
  // 去除广告等功能和UI构建并无关系，因此不应该阻塞运行
  async function initGUI(){
    let { LitElement, html, css } = await import('https://blog-static.cnblogs.com/files/blogs/806667/lit-core.min.js')
    class SettingButton extends LitElement {
      open() {
        class FilterSwitcher extends LitElement {
          static properties = {
            /** @type {{ type: { value: FilterItem[] } }} */
            filterList: { type: Array }
          };
          constructor() {
            super();
            this.filterList = config.filterList;
            console.log('油猴配置读取', this.filterList);
          }
          render() {
            return html`
              <div class="filter-inner">
                <div class="header">
                  <h2 style="margin-top:0;">域名过滤设置</h2>
                  <button class="close-btn" @click=${() => this.remove()}>×</button>
                </div>
                ${this.filterList.map((item,index) => html`
                  <div class="filter-item">
                    <label>
                      <input type="checkbox" 
                        ?checked=${item.enabled}
                        @change=${(e) => this.handleChange(e, item)}>
                      ${item.name} (${item.domain})
                    </label>
                    <button @click=${() => this.handleDeleteFilter(index)} class="delete-btn">删除</button>
                  </div>
                `)}
                <div class="button-group">
                  <button @click=${this.handleAddFilter} class="add-btn">添加过滤</button>
                  <button @click=${this.handleSave} class="save-btn">保存</button>
                </div>
              </div>
            `;
          }

          handleChange(e, item) {
            item.enabled = e.target.checked;
          }

          handleSave() {
            config.filterList = this.filterList
            // Save to GM storage
            GM_setValue('dreamqi-bingSearch-config', config);
            // Remove the component
            this.remove();

            // Reload page to apply new filters
            // window.location.reload();
          }

          async handleAddFilter() {
            const { value: formValues } = await Swal.fire({
              title: '添加新过滤',
              html: `
                <input id="swal-input1" class="swal2-input" placeholder="名称">
                <input id="swal-input2" class="swal2-input" placeholder="域名">
              `,
              focusConfirm: false,
              preConfirm: () => {
                return {
                  name: document.getElementById('swal-input1').value,
                  domain: document.getElementById('swal-input2').value
                }
              }
            });

            if (formValues) {
              this.filterList = [...this.filterList, {
                name: formValues.name,
                domain: formValues.domain,
                enabled: true
              }];
              this.requestUpdate();
            }
          }
          handleDeleteFilter(index) {
            this.filterList.splice(index, 1); // 从filterList中删除指定索引的元素
            this.requestUpdate(); // 更新组件以反映更改
          }

          static styles = css`
            :host{
              display: flex;
              position: fixed;
              z-index: 10;
              inset: 0;
              background: rgba(0,0,0,.4);
            }
            .filter-inner{
              margin: auto;
              padding: 1.5em;
              width: 32em;
              border-radius: 5px;
              background-color: #fff;
              animation: scaleAnimation 0.3s ease-out forwards;
            }
            @keyframes scaleAnimation {
              0% {
                  transform: scale(0.7);
              }
              45% {
                  transform: scale(1.05);
              }
              80% {
                  transform: scale(0.95);
              }
              100% {
                  transform: scale(1);
              }
            }
            .filter-item {
              margin: 10px 0;
            }
            .save-btn {
              padding: 8px 16px;
              background: #0078d4;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            .save-btn:hover {
              background: #006cbd;
            }
            .button-group {
              display: flex;
              gap: 10px;
              margin-top: 20px;
            }
            .add-btn {
              padding: 8px 16px;
              background: #107c10;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            .add-btn:hover {
              background: #0b5a0b;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .close-btn {
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              padding: 0 8px;
              color: #666;
              line-height: 1;
            }
            .close-btn:hover {
              color: #000;
            }
          `
        }
        if (!customElements.get('filter-switcher')) {
          customElements.define('filter-switcher', FilterSwitcher);
        }
        const filterSwitcher = document.createElement('filter-switcher');
        document.body.appendChild(filterSwitcher);
      }
      static styles = css`
        :host {
            float: left;
        }
      `
      render() {
        return html`<div style="text-align:center;">
                          <button @click=${this.open}>-site配置</button>
                      </div>`;
      }

    }
    const addElement = () => {
      customElements.define('setting-button', SettingButton);
      // 创建元素
      const button = document.createElement('setting-button');
      const $result = $('#b_tween,.b_scopebar');
      // 添加到#b_tween或者b_scopebar中（开启代理后，只有b_scopebar）
      $result.first().append(button);
      if (/Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $('#b_header').append(button);
      }
      // 添加block按钮
      {
        let $pNode = $('#b_tween,.b_scopebar').first()
        // 添加设置按钮
        let setting = document.createElement('button')
        setting.style = 'border-width: revert;border-style: revert; padding: revert;'
        setting.innerHTML = 'bing净化设置'
        setting.addEventListener('click', () => {
          settingGUI()
        })
        $pNode.append(setting)
        var ResultText = document.createElement('div')
        ResultText.id = 'resultText'
        ResultText.innerHTML = `
          <h2>已去除${count}个广告或者多余链接</h2>
          `
        // 移动端UA，去除IPad,webOS
        if (/Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          $('#b_header').append(setting);
          $('#b_header').append(ResultText);
          return;
        }
        $pNode.append(ResultText)
      }
    }
    addElement()
  }

})()