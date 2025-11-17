import { render } from "solid-js/web";
import 'uno.css';
import './style.css';
import { getStorage } from "./utils";
import Dialog from "./components/Dialog";
import { createSignal, Show } from "solid-js";
import './extends.js';
const userConfig: GMStorage = getStorage();
let count = 0;
const [isDialogOpen, setIsDialogOpen] = createSignal(false)
const [blockList, setBlockList] = createSignal<string[]>([])
const [newSite, setNewSite] = createSignal('')
function filterWithEngine() {
  if (!userConfig.filterList) return;
  let url = new URL(window.location.href);
  // 大概是下面这样子 -site:csdn.net -site:baidu.com
  let strBlockList = ''
  userConfig.filterList.forEach(item => {
    if (!item.enabled) return;
    strBlockList += ` -site:${item.domain}`
  })
  // 修改查询参数
  if (!url.searchParams.has("dreamsoulmodified")) {
    // 修改查询参数
    let keyword = url.searchParams.get("q");
    url.searchParams.set('q', keyword + strBlockList)
    url.searchParams.set("dreamsoulmodified", "true");
    // 使用history.replaceState修改URL而不刷新页面
    history.replaceState({}, '', url.toString());
    // 重新加载页面以显示修改后的URL
    window.location.reload();
  } else {
    // 如果URL已经包含了修改的查询参数，则不再进行修改
    console.log("URL已经包含了修改的查询参数，不再进行修改。");
  }
}
function init() {
  filterWithEngine();
  // 添加菜单选项
  // GM_registerMenuCommand('屏蔽域名列表设置', () => {
  //   // UI展示
  //   setIsDialogOpen(true);
  // });
  // GM_registerMenuCommand('列表合并', function () {
  //   function openLinkInNewTab(url: string) {
  //     // 创建 <a> 元素
  //     const link = document.createElement('a');
  //     // 设置 <a> 元素的属性
  //     link.href = url;
  //     link.target = '_blank';
  //     link.style.display = 'none';
  //     // 将 <a> 元素添加到文档中
  //     document.body.appendChild(link);
  //     // 模拟点击事件
  //     link.click();
  //     // 点击后立即删除 <a> 元素
  //     document.body.removeChild(link);
  //   }
  //   openLinkInNewTab('https://listmerge.dreamsoul.cn/');
  // });
}
function blockSearchResult() {
  function hideAds() {
    // 去除搜索建议
    let removeList: NodeListOf<HTMLElement> = document.querySelectorAll('.b_ans');
    removeList.forEach((item) => {
      item.style.display = 'none';
      count++
    })
    // 去除展开，比如知乎的问答，一个链接下面出现了很多莫名其妙的小链接，去除了这些小链接。
    // let deepLink = document.querySelector('.b_deeplinks_block_container')
    // if (deepLink) {
    //   console.log('去除deeplinks(常见于知乎)');
    //   deepLink.remove()
    //   count++
    // }
    // let deepDesk = document.querySelector('.b_deepdesk')
    // if (deepDesk) {
    //   deepDesk.remove()
    //   console.log('去除deepDesk(搜索bing时出现词典地图之类的同类产品)');
    //   count++
    // }
    // 去除各种乱七八糟的搜索结果（推荐搜索、广告、推荐回答等）
    // let recommandList = document.querySelectorAll('#b_pole,.b_algoRCAggreFC,.rpr_light,.b_algospacing,.b_ad,.b_ans,#inline_rs')
    // recommandList.forEach(item => {
    //   item.remove()
    //   count++
    // })
    // 去除带有data-favicon-t属性的父级元素（也就是搜索结果）
    // document.querySelectorAll('[data-favicon-t]').forEach(item =>{
    //   console.log(item)
    //   item.parentNode.remove();
    //   count++;
    // })

    // 去除豆包广告
    // let doubaoList = document.querySelectorAll('.b_overflow2')
    // if (doubaoList.length) {
    //   console.log('去除豆包广告');
    //   count++;
    // }
    // doubaoList.forEach(item => {
    //   // 去除包含广告类的li
    //   item.closest('.b_algo').remove()
    //   count++
    // })
  }
  const currentUrl = window.location.href;
  // cn版本bing
  const cnBingRegex = /^https:\/\/cn.bing.com/;
  const isCn = currentUrl.match(cnBingRegex);
  let isSelfModified = false;
  purify()
  isSelfModified = true;
  createObserver()
  function createObserver() {
    // 监听整个文档的 DOM 变化
    const TARGET_SELECTOR = "#b_results .b_algo"; // 目标元素选择器
    const PARENT_SELECTOR = document.querySelector('main');    // 监听的父容器（可缩小范围，提升性能），至少得是body，因为我们不清楚到底哪里变了
    const DEBOUNCE_TIME = 300;               // 防抖时间（单位：ms，根据实际渲染速度调整）

    // 防抖计时器
    let renderTimer: any = null;
    // 创建监听器
    const observer = new MutationObserver((mutations) => {
      // 每次 DOM 变化时，重置防抖计时器
      clearTimeout(renderTimer);
      renderTimer = setTimeout(() => {
        // 检查目标元素是否存在
        let element = document.querySelectorAll(TARGET_SELECTOR)
        if (element.length > 0) {
          purify()
          addBlockBtn()
          isSelfModified = true;
        }
      }, DEBOUNCE_TIME);
    });
    // 配置监听选项（监听子节点变化）
    if (PARENT_SELECTOR) {
      observer.observe(PARENT_SELECTOR, {
        childList: true,
        subtree: true,  // 递归监听所有子节点
      });
    }
  }
  function purify() {
    if (isCn) {
      removeList(userConfig.blockList || [])
    } else {
      removeGlobalList(userConfig.blockList || [])
    }
    hideAds()
  }
  // 接受domain参数
  const BlockBtn = (domain: string) => {
    return (
      <button
        // 小一些，不要这么显眼
        class="ds-block-btn ml-2px px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        onClick={() => {
          if (!userConfig.blockList?.includes('/' + domain)) {
            userConfig.blockList?.push('/' + domain);
            GM_setValue("config", userConfig);
            setBlockList([...userConfig.blockList || []]);
            showToast({ message: '添加成功', type: 'success' });
          }
        }}>屏蔽当前站点</button>
    )
  }
  const BlockEditBtn = (domain: string) => {
    return (
      <button
        class="ds-block-edit-btn ml-2px px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        onClick={() => {
          setIsDialogOpen(true);
          setNewSite('/' + domain);
        }}>编辑添加</button>
    )
  }
  function addBlockBtn() {
    const links = document.querySelectorAll('.tilk') as NodeListOf<HTMLAnchorElement>;
    links.forEach(item => {
      const domain = new URL(item.href).hostname;
      const parent = item.parentElement;
      const existingBtn = parent?.querySelector('.ds-block-btn');
      if (existingBtn) return; // 已经存在按钮则不添加
      render(()=>BlockBtn(domain), parent!);
      const bCaption = parent?.parentElement?.querySelector('.b_caption')
      if(bCaption){
        render(()=>BlockEditBtn(domain), bCaption);
      }
    });
  }
  function removeGlobalList(regex: string[]) {
    const regexList = regex.map(el => {
      // 去除首尾的斜杠
      // el = el.slice(1, el.length - 1)
      // 将双斜杠换成单斜杠，注意在控制台还是显示两个斜杠（如果是真正的两个斜杠，在控制台会打印出四个斜杠）
      // el = el.replace(/\\\\/g,"\\");
      return new RegExp(el)
    })
    let resultList = document.querySelectorAll('cite');
    for (let item of Array.from(resultList)) {
      for (let el of regexList) {
        if (el.test(item.textContent)) {
          const itemEl = item.closest('.b_algo') as HTMLElement;
          if (!itemEl) return;
          itemEl.style.display = 'none';
          count++;
          console.log('已去除:' + item.textContent)
        }
      }
    }
  }
  function removeList(regex: string[]) {
    const newRegex = regex.map(el => {
      // 去除首尾的斜杠
      // el = el.slice(1, el.length - 1)
      // 将双斜杠换成单斜杠，注意在控制台还是显示两个斜杠（如果是真正的两个斜杠，在控制台会打印出四个斜杠）
      // el = el.replace(/\\\\/g,"\\");
      return new RegExp(el)
    })
    let originList = document.querySelectorAll('#b_results .b_algo')
    // 去除没有链接的
    // console.log('originList', originList)
    for (let item of Array.from(originList)) {
      // 6月28日改，与正常搜索结果不同的（没有b_tpcn这个类的）是广告。
      if (item.querySelector('.b_tpcn') === null) {
        item.remove();
        count++;
        continue;
      }
      // 正则匹配href，如果匹配到了，则移除该节点。
      let url
      const alinkEl = item.querySelector('.tilk') as HTMLAnchorElement;
      if (alinkEl) {
        url = alinkEl.href
      } else {
        url = ''
      }
      // item.querySelector('.tilk').href
      for (let el of newRegex) {
        if (el.test(url)) {
          item.remove()
          count++
          console.log('已去除:' + url)
        }
      }
    }
  }
}

import Toast, { showToast } from './components/Toast';

const AddDialog = () => {

  const [editIndex, setEditIndex] = createSignal(-1)
  const [editSite, setEditSite] = createSignal('')


  // 确保 blockList 存在
  if (!userConfig.blockList) {
    userConfig.blockList = [];
  }

  // 初始化 blockList signal
  setBlockList(userConfig.blockList || [])


  return (
    <>
      <Dialog isOpen={isDialogOpen()} onClose={() => {
        setIsDialogOpen(false)
      }} title="站点管理">
        <div class="flex flex-col gap-4">
          <div class="mb-4">
            <h3 class="text-lg font-medium mb-2">已屏蔽站点列表</h3>
            <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
              {blockList().length === 0 ? (
                <div class="p-4 text-center text-gray-500">暂无屏蔽站点</div>
              ) : (
                <ul class="divide-y divide-gray-200">
                  {blockList().map((item, index) => (
                    <li class="p-3 flex justify-between items-center hover:bg-gray-50">
                      <span class="text-gray-800">{item}</span>
                      <div class="flex gap-2">
                        <button
                          class="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          onClick={() => {
                            setEditIndex(index);
                            setEditSite(item);
                          }}
                        >
                          编辑
                        </button>
                        <button
                          class="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          onClick={() => {
                            userConfig.blockList?.splice(index, 1);
                            GM_setValue("config", userConfig);
                            setBlockList([...userConfig.blockList || []]);
                            showToast({ message: '删除成功', type: 'success' });
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <Show when={editIndex() !== -1}>
            <div class="p-4 border border-blue-200 bg-blue-50 rounded-md">
              <h4 class="text-md font-medium mb-2 text-blue-800">编辑站点</h4>
              <div class="flex flex-col gap-2">
                <input
                  type="text"
                  value={editSite()}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setEditSite(e.target.value)}
                />
                <div class="flex justify-end gap-2 mt-2">
                  <button
                    class="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    onClick={() => {
                      setEditIndex(-1);
                      setEditSite('');
                    }}
                  >
                    取消
                  </button>
                  <button
                    class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    onClick={() => {
                      if (editSite().trim()) {
                        if (!userConfig.blockList) return;
                        userConfig.blockList[editIndex()] = editSite().trim();
                        GM_setValue("config", userConfig);
                        setBlockList([...userConfig.blockList]);
                        setEditIndex(-1);
                        setEditSite('');
                        showToast({ message: '更新成功', type: 'success' });
                      }
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </Show>

          <div class="p-4 border border-green-200 bg-green-50 rounded-md">
            <h4 class="text-md font-medium mb-2 text-green-800">添加新站点</h4>
            <div class="flex flex-col gap-2">
              <input
                type="text"
                placeholder="例如: example.com"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newSite()}
                onChange={(e) => setNewSite(e.target.value)}
              />
              <div class="flex justify-end mt-2">
                <button
                  class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  onClick={() => {
                    if (newSite().trim()) {
                      userConfig.blockList?.push(newSite().trim())
                      GM_setValue("config", userConfig);
                      setBlockList([...userConfig.blockList || []]);
                      setNewSite('');
                      showToast({ message: '添加成功', type: 'success' });
                    }
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      <Toast />
    </>
  )
}

// 而FloatingWindow由于是fixed浮动，因此直接放里面吧不要紧。  
const App = () => {
  return <>
    <div class="ds-script flex py-2px">
      <button
        class="px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors"
        onClick={() => {
          setIsDialogOpen(true);
        }}>站点管理</button>
      <AddDialog />
    </div>
  </>;
};
const ExtraSearchBox = () => {
  return (
    <>
      <button
        type="button"
        class="inline-block align-middle h-40px mr-4px px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors"
        onClick={() => {
          const searchWord = (document.querySelector('.b_searchbox') as HTMLInputElement).value;
          const url = `https://search.bilibili.com/all?keyword=${encodeURIComponent(searchWord)}`;
          window.open(url, '_blank');
        }}>b站搜索</button>
      <button
        type="button"
        class="inline-block align-middle h-40px mr-10px px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors"
        onClick={() => {
          const searchWord = (document.querySelector('.b_searchbox') as HTMLInputElement).value;
          const url = `https://www.google.com.hk/search?q=${encodeURIComponent(searchWord)}`;
          window.open(url, '_blank');
        }}>google</button>
    </>
  )
}

const dclHandler = () => {
  blockSearchResult();
  const fa1 = document.querySelector('#b_tween') || document.querySelector('#ScopeRow');
  if (fa1) {
    render(() => <App />, fa1);
  }
  const searchBox = document.querySelector('.b_searchboxForm');
  if (searchBox) {
    render(() => <ExtraSearchBox />, searchBox);
  }
  document.removeEventListener("DOMContentLoaded", dclHandler);
}
init();
document.addEventListener("DOMContentLoaded", dclHandler);
