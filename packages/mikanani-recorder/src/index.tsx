import { render } from 'solid-js/web';
import { createSignal, onMount, For } from 'solid-js';
import 'uno.css';
import { STORE_NAME } from './const';

// 获取当前页面的番剧ID
const getBangumiId = () => {
  const match = location.pathname.match(/\/Home\/Bangumi\/(\d+)/);
  return match ? match[1] : null;
};

// 获取番剧标题
const getBangumiTitle = () => {
  const title = document.title;
  const match = title.match(/Mikan Project - (.+)/);
  return match ? match[1] : '';
};
const getBangumiIdFromHref = (href: string) => {
  const match = href.match(/\/Home\/Bangumi\/(\d+)/);
  return match ? match[1] : null;
};

interface BangumiInfo {
  id: string;
  title: string;
  rating: number;
  episodeCount: number;
  coverBase64?: string;
}

interface StorageData {
  bangumis: BangumiInfo[];
  isCollapsed: boolean;
}


const RATING_LABELS = ['不想看', '不好看', '勉强能看', '一般', '好看', '神作'];

// 从GM存储获取所有番剧数据
const getStorageData = (): StorageData => {
  const data: StorageData = GM_getValue(STORE_NAME);
  return data || { bangumis: [], isCollapsed: false };
};

// 保存番剧数据
const saveBangumiInfo = async (info: BangumiInfo) => {
  const data = getStorageData();
  let existData = data.bangumis.find(item => item.id = info.id);
  if (existData) {
    Object.assign(existData, info);
  } else {
    data.bangumis.push(info);
  }
  await GM_setValue(STORE_NAME, data);
};

// 保存全局折叠状态
const saveCollapsedState = async (isCollapsed: boolean) => {
  const data = await getStorageData();
  data.isCollapsed = isCollapsed;
  await GM_setValue(STORE_NAME, data);
};

// 获取单个番剧信息
const getBangumiInfo = async (id: string): Promise<BangumiInfo | null> => {
  const data = await getStorageData();
  return data.bangumis.find(item => item.id === id) || null;
};

// 番剧评分组件
const BangumiRating = (props: { anElement: Element }) => {
  const [rating, setRating] = createSignal(0);



  onMount(async () => {
    const href = (props.anElement as HTMLAnchorElement).href;
    const id = getBangumiIdFromHref(href);
    if (!id) return;

    const info = await getBangumiInfo(id);
    if (info?.rating) {
      setRating(info.rating);
    }
  });

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
    <div class="absolute top-0 left-0 w-full bg-white/80 p-2 flex gap-2 text-sm">
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

// 浮动窗口组件
const FloatingWindow = () => {
  const bangumiId = getBangumiId();
  if (!bangumiId) return null;

  const [value, setValue] = createSignal(0);
  const [isCollapsed, setIsCollapsed] = createSignal(false);
  const [title, setTitle] = createSignal('');

  onMount(async () => {
    const data = await getStorageData();
    const info = await getBangumiInfo(bangumiId);
    if (info) {
      setValue(info.episodeCount);
      setTitle(info.title);
    } else {
      setTitle(getBangumiTitle());
    }
    setIsCollapsed(data.isCollapsed);
  });

  const handleSave = () => {
    saveBangumiInfo({
      id: bangumiId,
      title: title(),
      episodeCount: value(),
      rating: 0
    });
  };

  return (
    <div
      class={`fixed top-50 right-4 bg-white shadow-lg rounded-lg p-4 transition-all duration-300 ${isCollapsed() ? 'w-12 h-12' : 'w-64'
        }`}
    >
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        onClick={() => {
          const newState = !isCollapsed();
          setIsCollapsed(newState);
          saveCollapsedState(newState);
        }}
      >
        {isCollapsed() ? '展开' : '收起'}
      </button>

      {!isCollapsed() && (
        <div class="mt-4">
          <div class="text-center font-bold mb-2 truncate" title={title()}>
            {title()}
          </div>
          <div class="flex items-center justify-between">
            <button
              class="w-8 h-8 bg-gray-200 rounded-full"
              onClick={() => setValue(v => Math.max(0, v - 1))}
            >
              -
            </button>
            <input
              type="number"
              min="0"
              value={value()}
              onInput={(e) => setValue(parseInt(e.currentTarget.value) || 0)}
              class="w-20 text-center border rounded"
            />
            <button
              class="w-8 h-8 bg-gray-200 rounded-full"
              onClick={() => setValue(v => v + 1)}
            >
              +
            </button>
          </div>
          <button
            class="mt-4 w-full bg-blue-500 text-white rounded py-2 hover:bg-blue-600"
            onClick={handleSave}
          >
            保存
          </button>
        </div>
      )}
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
                  const AniEl = document.querySelectorAll('.list-inline li');
                  const config: StorageData = getStorageData();
                  console.log('config', config);

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

                  // 最后统一保存
                  GM_setValue(STORE_NAME, config);
                  console.log('所有封面收集任务已完成');
                }}
              >
                收集番剧封面（请确保页面中所有封面已加载）
              </button>

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
// 由于只有App是必定加载的，因此组件是否出现的逻辑只能放在App内部
// 而FloatingWindow由于是fixed浮动，因此直接放里面吧不要紧。  
const App = () => {
  onMount(() => {
    console.log('GM_getValue(STORE_NAME)', GM_getValue(STORE_NAME));
    // 检查是否在主页
    if (location.pathname === '/') {
      // 获取所有番剧链接元素
      const anElements = document.querySelectorAll('.an-text');
      anElements.forEach(el => {
        const li = el.closest('li');

        if (li) {
          li.style.position = 'relative';
          render(() => <BangumiRating anElement={el} />, li);
        }
      });
    }
  });

  return (
    <div class="ds-script">
      <FloatingWindow />
      <IndexPanel />
    </div>
  );
};

const root = document.body;
if (root) {
  render(() => <App />, root);
}
