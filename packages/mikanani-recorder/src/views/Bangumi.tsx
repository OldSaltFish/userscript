// 番剧页面

import { createSignal, onMount, createEffect } from "solid-js";
import { render } from "solid-js/web";
import { showToast } from "../components/Toast";
import { STORE_NAME } from "../const";
import { getBangumiId, getStorageData, getBangumiTitle, saveBangumiInfo, getBangumiInfo } from "../utils";

// 浮动窗口组件
const Bangumi = () => {
    const bangumiId = getBangumiId();
    if (!bangumiId) return null;
    const [blackList, setBlackList] = createSignal<string[]>([]);
    onMount(() => {
        const data = getStorageData();
        setBlackList(data.blockedSubgroups || []);
    });
    const rssList = document.querySelectorAll('.subgroup-text');
    createEffect(() => {
        rssList.forEach(el => {
            const name = (el.children[0] as HTMLAnchorElement).textContent;
            if (name && blackList().includes(name)) {
                console.log(`屏蔽了 ${name}字幕组`);
                const parent = el.closest('.subgroup-text') as HTMLElement;
                const broTable = parent.nextElementSibling as HTMLTableElement;
                parent.style.display = 'none';
                broTable.style.display = 'none';
                // 如果列表较长，则会出现展开按钮
                // 需要将展开按钮也隐藏
                if (broTable.nextElementSibling && broTable.nextElementSibling.classList.contains('episode-expand')) {
                    (broTable.nextElementSibling as HTMLElement).style.display = 'none';
                }
            }
        });
    })
    const copyButton = (props: { text: string }) => {
        return <button
            class="ml-8px"
            onClick={() => {
                if (props.text) {
                    navigator.clipboard.writeText(props.text)
                        .then(() => {
                            showToast("✓ 已复制");
                        })
                        .catch(err => {
                            console.error('复制失败:', err);
                            showToast("复制失败");
                        });
                }
            }}
        >
            复制
        </button>
    }

    rssList.forEach(el => {
        const rssEl: HTMLAnchorElement | null = el.querySelector('.mikan-rss');
        const rssUrl = rssEl!.href;
        const BlockBtn = () => {
            return <button
                class="floating-menu-button"
                onClick={() => {
                    if (rssEl) {
                        const name = (rssEl.previousElementSibling as HTMLAnchorElement).textContent as string;
                        setBlackList([
                            ...blackList(),
                            name
                        ]);
                        GM_setValue(STORE_NAME, {
                            ...getStorageData(),
                            blockedSubgroups: [...(getStorageData().blockedSubgroups || []), name]
                        });
                        showToast("✓ 已屏蔽");
                    }
                }}
            >
                屏蔽
            </button>
        }
        if (rssEl) {
            const btn = document.createElement('span');
            render(() => <BlockBtn />, btn);
            render(() => copyButton({ text: rssUrl }), btn);
            rssEl.after(btn);
        }
    });
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
            class={`fixed top-45vh right-4 bg-white shadow-lg rounded-lg p-4 transition-all duration-300 ${isCollapsed() ? 'w-12 h-12' : 'w-64'
                }`}
        >
            <button
                class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => {
                    const newState = !isCollapsed();
                    setIsCollapsed(newState);
                    const data = getStorageData();
                    data.isCollapsed = newState;
                    GM_setValue(STORE_NAME, data);
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

export default Bangumi;