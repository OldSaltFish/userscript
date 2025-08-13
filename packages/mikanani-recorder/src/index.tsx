import { For, createEffect, createSignal, onMount } from 'solid-js';
import { render } from 'solid-js/web';
import 'uno.css';
import { showToast, toast } from './components/Toast';
import { RATING_LABELS, STORE_NAME } from './const';
import type { RankBangumiInfo, StorageData } from './types';
import { getBangumiIdFromHref, getBangumiInfo, getStorageData, isMobile, saveBangumiInfo } from './utils';
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

const OnlineWatch = (props: { name: string }) => {
  const biliSearchUrl = new URL(`https://search.bilibili.com/all`);
  biliSearchUrl.searchParams.set('keyword', props.name);
  biliSearchUrl.searchParams.set('search_source', "1");
  const ezdmwSearchUrl = new URL(`https://www.ezdmw.site/Index/search.html`);
  ezdmwSearchUrl.searchParams.set('searchText', props.name);
  const xifanSearchUrl = new URL(`https://dm.xifanacg.com/search.html`);
  xifanSearchUrl.searchParams.set('wd', props.name);

  return <div class='clear-both flex flex-wrap gap-2 bg-white/60 '>
    <a href={biliSearchUrl.toString()} target='_blank' class="p-4px bg-#F6AB43 rounded-4px">哔哩哔哩</a>
    <a href={ezdmwSearchUrl.toString()} target='_blank' class="p-4px bg-#F6AB43 round-4px">E站弹幕网</a>
    <a href={xifanSearchUrl.toString()} target='_blank' class="p-4px bg-#F6AB43 round-4px">稀饭动漫</a>
  </div>
}

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
              {/* m-0用于覆盖外部网站提供的样式 */}
              <h3 class="m-0 text-lg font-bold">[蜜柑记录]脚本设置</h3>
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
                  // 存储所有需要更新的数据
                  showToast('需要较长时间，请稍等，完成后会提示下载。');
                  const data: StorageData = getStorageData();
                  const infos: RankBangumiInfo[] = [];
                  // #region 会往infos里面push填充信息

                  const addInfosOnPc = () => {
                    const AniEl = document.querySelectorAll('.list-inline li');
                    // 获取到id、标题、评分
                    for (const item of Array.from(AniEl)) {
                      const infoEl: HTMLAnchorElement | null = item.querySelector('.an-text');
                      if (!infoEl) continue;
                      const id = getBangumiIdFromHref(infoEl.href);
                      let ExtRating = data.bangumis.find(bangumi => bangumi.id === id)?.rating;
                      if (!data.config?.isExportLowRating && ExtRating !== undefined && ExtRating <= 1) {
                        continue;
                      }
                      let url: string | null = null;
                      let title: string | null = null;
                      const span = item.querySelector('span');
                      if (!span) continue;
                      const bg = getComputedStyle(span).backgroundImage;
                      url = bg.match(/url\(["']?(.*?)["']?\)/)?.[1] || null;
                      if (!url) {
                        url = span.dataset.src ? location.origin + span.dataset.src : null;
                        if (!url) continue;
                      };
                      const parsedUrl = new URL(url);
                      const format = parsedUrl.searchParams.get('format');
                      // 清除所有参数
                      parsedUrl.search = '';
                      // 只保留 format 参数（如果存在）
                      if (format) {
                        parsedUrl.searchParams.set('format', format);
                      }

                      title = infoEl.title;
                      if (!id) continue;
                      infos.push({
                        id,
                        title: title || '',
                        coverUrl: parsedUrl.toString(),
                        rating: ExtRating || 0
                      });
                    }
                  }
                  const addInfosOnMobile = () => {
                    const AniEl = document.querySelectorAll('div.m-week-square a') as NodeListOf<HTMLAnchorElement>;
                    for (const item of Array.from(AniEl)) {
                      const id = getBangumiIdFromHref(item.href);
                      if (!id) continue;
                      let ExtRating = data.bangumis.find(bangumi => bangumi.id === id)?.rating;
                      if (!data.config?.isExportLowRating && ExtRating !== undefined && ExtRating <= 1) {
                        continue;
                      }

                      const imgEl = item.querySelector('img');
                      if (!imgEl) continue;
                      let url;
                      if (imgEl.src) {
                        url = imgEl.src;
                      } else {
                        url = imgEl.dataset.src ? location.origin + imgEl.dataset.src : null;
                      }
                      if (!url) continue;
                      const parsedUrl = new URL(url);
                      const format = parsedUrl.searchParams.get('format');
                      // 清除所有参数
                      parsedUrl.search = '';
                      // 只保留 format 参数（如果存在）
                      if (format) {
                        parsedUrl.searchParams.set('format', format);
                      }
                      infos.push({
                        id,
                        title: item.title || '',
                        coverUrl: parsedUrl.toString(),
                        rating: ExtRating || 0
                      });
                    }
                  }
                  // #endregion
                  if (isMobile()) {
                    addInfosOnMobile();
                  } else {
                    addInfosOnPc();
                  }
                  // 将元素数组分组,每组10个
                  const groups = infos.reduce((acc, curr, i) => {
                    const groupIndex = Math.floor(i / 10);
                    if (!acc[groupIndex]) acc[groupIndex] = [];
                    acc[groupIndex].push(curr);
                    return acc;
                  }, [] as RankBangumiInfo[][]);
                  // 按组依次处理
                  for (let i = 0; i < groups.length; i++) {
                    const group = groups[i];
                    console.log(`正在处理第${i + 1}组，共${groups.length}组`);
                    const groupPromises = group.map(async (item) => {
                      let coverBase64: string;
                      try {
                        coverBase64 = await fetchToGetBase64(item.coverUrl);
                        item.coverBase64 = coverBase64;
                      } catch (error) {
                        console.error('获取图片失败:', error);
                        return;
                      }
                    });

                    // 等待当前组的所有Promise完成后再处理下一组
                    await Promise.all(groupPromises);
                  }

                  const blob = new Blob([JSON.stringify(infos, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'mikanani-bangumis.json';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  showToast('所有封面收集任务已完成');
                }}
              >
                导出番剧信息(json)
              </button>
              <a href="http://anime-tiermaker.dreamsoul.cn/" target='_blank' rel='noopener'>前往Anime-TierMaker(可导入一键制作)</a>
              <div>
                {/* 显示全部 */}
                <label>
                  显示低评分番剧(0-1分)
                  <input style="margin:0;vertical-align:middle;" type="checkbox" checked={getStorageData().config?.isShowLowRating || false} onChange={e => {
                    const data = getStorageData();
                    data.config = {
                      ...data.config,
                      isShowLowRating: e.target.checked,
                    };
                    GM_setValue(STORE_NAME, data);
                    if (e.target.checked) location.reload();
                  }} />
                </label>
                <label>
                  导出低评分番剧(0-1分)
                  <input style="margin:0;vertical-align:middle;" type="checkbox" checked={getStorageData().config?.isExportLowRating || false} onChange={e => {
                    const data = getStorageData();
                    data.config = {
                      ...data.config,
                      isExportLowRating: e.target.checked,
                    };
                    GM_setValue(STORE_NAME, data);
                  }} />
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
    const infoEl = el.closest('.an-info');
    if(infoEl){
      render(() => <OnlineWatch name={el.title} />, infoEl);
    }
  });
  const mobileElements: NodeListOf<HTMLElement> = document.querySelectorAll('.m-week-square a');
  mobileElements.forEach(el => {
    const fa = el.closest('.m-week-square') as HTMLElement;
    const computedStyle = window.getComputedStyle(fa);
    const originalMarginBottom = computedStyle.marginBottom;

    if (originalMarginBottom) {
      const numericValue = parseFloat(originalMarginBottom);
      const newMarginBottom = numericValue + 156 + 'px';
      fa.style.marginBottom = newMarginBottom;
    } else {
      // 若原值为空（如未显式设置），直接添加80px
      fa.style.marginBottom = '80px';
    }
    const li = el.closest('div') as HTMLElement;
    if (li) {
      render(() => <BangumiRating anElement={el} />, li);
      render(() => <OnlineWatch name={el.title} />, li);
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
