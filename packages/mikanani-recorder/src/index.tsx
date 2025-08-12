import { For, createEffect, createSignal, onMount } from 'solid-js';
import { render } from 'solid-js/web';
import 'uno.css';
import { toast } from './components/Toast';
import { RATING_LABELS, STORE_NAME } from './const';
import type { StorageData } from './types';
import { getBangumiIdFromHref, getBangumiInfo, getStorageData, saveBangumiInfo } from './utils';
import Bangumi from './views/Bangumi';

const config = getStorageData()?.config;
// 番剧评分组件
const BangumiRating = (props: { anElement: HTMLElement }) => {
  const [rating, setRating] = createSignal(999);

  onMount(async () => {
    const href = (props.anElement as HTMLAnchorElement).href;
    const id = getBangumiIdFromHref(href);
    if (!id) return;

    const info = await getBangumiInfo(id);
    if (info && info.rating !== undefined) {
      setRating(info.rating);
    }
  });
  createEffect(
    () => {
      if (rating() <= 1 && !config?.isShowLowRating) {
        const li = props.anElement.closest('li');
        if (li) {
          li.style.display = 'none';
          const ul = li.parentElement;
          if (ul) {
            const allHidden = Array.from(ul.children).every(
              child => (child as HTMLElement).style.display === 'none'
            );
            if (allHidden) {
              const anBox = ul.closest('.an-box');
              if (anBox) {
                (anBox as HTMLElement).style.display = 'none';
              }
            }
          }
        }
      }
    }
  );

  const handleRatingClick = async (newRating: number) => {
    const href = (props.anElement as HTMLAnchorElement).href;
    const id = getBangumiIdFromHref(href);
    if (!id) return;

    setRating(newRating);
    await saveBangumiInfo({
      id,
      title: props.anElement.getAttribute('title') || '',
      rating: newRating,
      episodeCount: 0
    });
  };

  return (
    <div class="sm:absolute sm:flex top-0 left-0 w-full bg-white/40 p-2 grid grid-cols-3 gap-2 text-sm">
      <For each={RATING_LABELS}>
        {(label, index) => (
          <button
            class={`px-2 py-1 rounded ${rating() === index() ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            onClick={() => handleRatingClick(index())}
            title={label}
          >
            {index()}
          </button>
        )}
      </For>
    </div>
  );
};


const IndexPanel = () => {
  if (location.pathname !== '/') return null;
  const [showPanel, setShowPanel] = createSignal(false);
  const fetchToGetBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // 导出配置文件
  const exportConfig = () => {
    const config = GM_getValue(STORE_NAME);
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mikanani-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        class="fixed right-4 bottom-24 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100"
        onClick={() => setShowPanel(true)}
      >
        ⚙️
      </button>

      {showPanel() && (
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div class="bg-white rounded-lg p-6 w-80">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold">设置</h3>
              <button
                class="text-gray-500 hover:text-gray-700"
                onClick={() => setShowPanel(false)}
              >
                ✕
              </button>
            </div>
            <div class="flex flex-col gap-4">
              <button
                class="w-full bg-blue-500 text-white rounded py-2 hover:bg-blue-600"
                onClick={async () => {
                  // 先获取信息（手机电脑的逻辑不同），最终得到infos数组，然后再分组处理
                  const AniEl = document.querySelectorAll('.list-inline li');
                  const config: StorageData = getStorageData();
                  // 将元素数组分组,每组10个
                  const groups = Array.from(AniEl).reduce((acc, curr, i) => {
                    const groupIndex = Math.floor(i / 10);
                    if (!acc[groupIndex]) acc[groupIndex] = [];
                    acc[groupIndex].push(curr);
                    return acc;
                  }, [] as Element[][]);

                  // 存储所有需要更新的数据
                  const updates: {
                    id: string;
                    title: string;
                    coverBase64: string;
                    isNew: boolean;
                  }[] = [];

                  // 按组依次处理
                  for (let i = 0; i < groups.length; i++) {
                    const group = groups[i];
                    console.log(`正在处理第${i + 1}组，共${groups.length}组`);
                    const groupPromises = group.map(async (item) => {
                      let url: string | null = null;
                      let title: string | null = null;
                      // #region 获取信息
                      const span = item.querySelector('span');
                      if (!span) return;
                      const bg = getComputedStyle(span).backgroundImage;
                      url = bg.match(/url\(["']?(.*?)["']?\)/)?.[1] || null;
                      console.log(url); // 获取到纯净地址
                      if (!url) return;
                      const parsedUrl = new URL(url);
                      const format = parsedUrl.searchParams.get('format');
                      // 清除所有参数
                      parsedUrl.search = '';
                      // 只保留 format 参数（如果存在）
                      if (format) {
                        parsedUrl.searchParams.set('format', format);
                      }
                      const infoEl: HTMLAnchorElement | null = item.querySelector('.an-text');
                      if (!infoEl) return;
                      const id = getBangumiIdFromHref(infoEl.href);
                      title = infoEl.title;
                      if (!id) return;
                      // #endregion
                      const existBangumi = config.bangumis.find(bangumi => bangumi.id === id);

                      // 如果已存在且有封面，则跳过
                      if (existBangumi?.coverBase64) return;

                      let coverBase64: string;
                      try {
                        coverBase64 = await fetchToGetBase64(parsedUrl.toString());
                      } catch (error) {
                        console.error('获取图片失败:', error);
                        return;
                      }

                      updates.push({
                        id,
                        title: title || '',
                        coverBase64,
                        isNew: !existBangumi
                      });
                    });

                    // 等待当前组的所有Promise完成后再处理下一组
                    await Promise.all(groupPromises);
                  }

                  // 统一更新数据
                  updates.forEach(update => {
                    const existBangumi = config.bangumis.find(bangumi => bangumi.id === update.id);
                    if (existBangumi) {
                      Object.assign(existBangumi, {
                        coverBase64: update.coverBase64
                      });
                    } else {
                      config.bangumis.push({
                        id: update.id,
                        title: update.title,
                        rating: 0,
                        episodeCount: 0,
                        coverBase64: update.coverBase64
                      });
                    }
                  });
                  const blob = new Blob([JSON.stringify(config.bangumis, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'mikanani-config.json';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  // 最后统一保存
                  // GM_setValue(STORE_NAME, config);
                  console.log('所有封面收集任务已完成');
                }}
              >
                收集番剧封面（请确保页面中所有封面已加载）
              </button>
              <div>
                {/* 显示全部 */}
                <label>
                  显示低评分番剧(0-1分)
                 <input style="margin:0;vertical-align:middle;" type="checkbox" checked={getStorageData().config?.isShowLowRating || false} onChange={e=>{
                  const data = getStorageData();
                  data.config =  {
                    ...data.config,
                    isShowLowRating: e.target.checked,
                  };
                  GM_setValue(STORE_NAME, data);
                  if(e.target.checked) location.reload();
                }}/>
                </label>
              </div>
              <button
                class="w-full bg-green-500 text-white rounded py-2 hover:bg-green-600"
                onClick={exportConfig}
              >
                导出配置文件
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
// 主页加载时处理番剧链接
const homePageLoadedHandler = () => {
  // 获取所有番剧链接元素
  const anElements: NodeListOf<HTMLElement> = document.querySelectorAll('.an-text');
  anElements.forEach(el => {
    const li = el.closest('li');
    if (li) {
      li.style.position = 'relative';
      render(() => <BangumiRating anElement={el} />, li);
    }
  });
  const mobileElements: NodeListOf<HTMLElement> = document.querySelectorAll('.m-week-square a');
  mobileElements.forEach(el => {
    const fa = el.closest('.m-week-square') as HTMLElement;
    const computedStyle = window.getComputedStyle(fa);
    const originalMarginBottom = computedStyle.marginBottom;

    if (originalMarginBottom) {
      const numericValue = parseFloat(originalMarginBottom);
      const newMarginBottom = numericValue + 80 + 'px';
      fa.style.marginBottom = newMarginBottom;
    } else {
      // 若原值为空（如未显式设置），直接添加80px
      fa.style.marginBottom = '80px';
    }
    const li = el.closest('div') as HTMLElement;
    if (li) {
      render(() => <BangumiRating anElement={el} />, li);
    }
  });
}

const createSwitchListener = () => {
  // 配置观察选项
  const config = {
    childList: true, // 监听子节点变动
  };
  // 创建并启动观察者
  const observer = new MutationObserver((mutationsList: MutationRecord[]) => {
    const mutation = mutationsList[0];
    if (mutation.addedNodes.length > 1 && mutation.removedNodes.length > 1) {
      homePageLoadedHandler();
    }
  });
  const target = document.querySelector('#sk-body');
  if (!target) return;
  observer.observe(target, config);
}

// 由于只有App是必定加载的，因此组件是否出现的逻辑只能放在App内部
// 而FloatingWindow由于是fixed浮动，因此直接放里面吧不要紧。  
const App = () => {
  onMount(() => {
    // 检查是否在主页
    if (location.pathname === '/') {
      homePageLoadedHandler();
      createSwitchListener();
    }
  });

  return (
    <div class="ds-script">
      <Bangumi />
      <IndexPanel />
      {toast.component()}
    </div>
  );
};

render(() => <App />, document.body);
