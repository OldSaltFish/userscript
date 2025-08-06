// 番剧页面

import { createEffect, createSignal, onMount } from "solid-js";
import { render } from "solid-js/web";
import { showToast } from "../components/Toast";
import { STORE_NAME } from "../const";
import { getBangumiId, getBangumiInfo, getBangumiTitle, getStorageData, saveBangumiInfo } from "../utils";

// 浮动窗口组件
const Bangumi = () => {
    const bangumiId = getBangumiId();
    if (!bangumiId) return null;
    // 虽然本该是只有当前页面的黑名单，但是直接使用全局的黑名单会更方便
    const [blackList, setBlackList] = createSignal<string[]>([]);

    const rssList = document.querySelectorAll('.subgroup-text');
    // 初始化+响应（初始化获取的是列表，而响应则是按钮触发，为了使得二者逻辑接近，应该使用数据驱动）
    // 然而视图是目标网页的，并不是直接响应式，这就导致数据和视图分离了
    // 为了使他们联系起来，我们可以搞一个映射（然后使用兄弟选择器执行相关操作）
    type subGroupStatus = {
        el: HTMLElement,
        id: string,
        name: string,
    }
    // 仅用于存储当前页面获取的信息（临时状态）
    const currentPageGroups: Array<subGroupStatus> = [];

    const data = getStorageData();
    setBlackList(data.subGroups?.filter(subGroup => subGroup.isBlocked).map(subGroup => subGroup.name) || []);
    const CopyButton = (props: { text: string }) => {
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
    // 初始渲染组件
    rssList.forEach(el => {
        const name = (el.children[0] as HTMLAnchorElement).textContent;
        const id = (el.children[0] as HTMLAnchorElement).href.match(/\/Home\/PublishGroup\/(\d+)/)?.[1] || "";
        if (!name) {
            showToast("获取字幕组名称失败，脚本逻辑需要更新。");
            return;
        }
        currentPageGroups.push({
            el: el as HTMLElement, name, id
        });


        const BlockBtn = () => {
            return <button
                class="floating-menu-button"
                onClick={() => {
                    const data = getStorageData();
                    const currentIdSet = new Set(currentPageGroups.map(obj => obj.id));
                    const existGroups = data.subGroups?.filter(subGroup => currentIdSet.has(subGroup.id)&&subGroup.isBlocked) || [];
                    setBlackList(Array.from(new Set([
                        ...existGroups.map(subGroup => subGroup.name),
                        name
                    ])));
                    const subGroups = data.subGroups || [];
                    const idx = subGroups.findIndex(g => g.id === id);
                    if (idx !== -1) {
                        subGroups[idx] = { ...subGroups[idx], isBlocked: true };
                    } else {
                        subGroups.push({ name, id, isBlocked: true });
                    }
                    GM_setValue(STORE_NAME, {
                        ...data,
                        subGroups
                    });
                    showToast("✓ 已屏蔽");
                }}
            >
                屏蔽
            </button>
        }
        const rssEl: HTMLAnchorElement | null = el.querySelector('.mikan-rss');
        if (rssEl) {
            const rssUrl = rssEl.href;
            const actionArea = document.createElement('span');
            render(() => <BlockBtn />, actionArea);
            render(() => <CopyButton text={rssUrl} />, actionArea);
            rssEl.after(actionArea);
        }
    });

    const leftList = document.querySelectorAll('.leftbar-item') as NodeListOf<HTMLElement>;
    leftList.forEach(el => {
        el.style.position = 'relative';
        const name = el.querySelector('.subgroup-name')?.textContent;
        if (!name) return;
        const ShowSubGroupBtn = () => {
            return <span class={`absolute left-0 text-xl mt-8px cursor-pointer ${blackList().includes(name) ? 'inline' : 'hidden'}`} onClick={() => {
                const data = getStorageData();
                // 直接把相关值置为未屏蔽
                const currentIdSet = new Set(currentPageGroups.map(obj => obj.id));
                const existGroups = data.subGroups?.filter(subGroup => currentIdSet.has(subGroup.id)&&subGroup.isBlocked) || [];
                setBlackList(
                    existGroups.map(subGroup => subGroup.name).filter(n => n !== name)
                );
                const subGroups = data.subGroups || [];
                const group = data.subGroups?.find(subGroup => subGroup.name === name);
                if(!group){
                    showToast("数据异常，无法移除屏蔽");
                    return;
                }
                group.isBlocked = false;
                GM_setValue(STORE_NAME, {
                    ...data,
                    subGroups
                });
                showToast("✓ 已移除屏蔽");
            }} title="点击取消屏蔽">🧿</span>
        }
        render(() => <ShowSubGroupBtn />, el);
        // if (name && blackList().includes(name)) {
        //     el.style.display = 'none';
        // } else {
        //     el.style.display = '';
        // }
    });
    // 监听黑名单列表并更新视图
    createEffect(() => {
        // 遍历所有字幕组，根据是否在黑名单中决定显示或隐藏
        rssList.forEach(el => {
            const name = (el.children[0] as HTMLAnchorElement).textContent;
            if (name) {
                const parent = el.closest('.subgroup-text') as HTMLElement;
                const broTable = parent.nextElementSibling as HTMLTableElement;
                const isBlocked = blackList().includes(name);

                // 包含在黑名单中则隐藏，不包含则显示
                const displayStyle = isBlocked ? 'none' : '';
                parent.style.display = displayStyle;
                broTable.style.display = displayStyle;

                // 如果列表较长，则会出现展开按钮
                // 需要将展开按钮也隐藏或显示
                if (broTable.nextElementSibling && broTable.nextElementSibling.classList.contains('episode-expand')) {
                    (broTable.nextElementSibling as HTMLElement).style.display = displayStyle;
                }
            }
        });

    })


    const [value, setValue] = createSignal(0);
    const [isCollapsed, setIsCollapsed] = createSignal(false);
    const [title, setTitle] = createSignal('');

    onMount(() => {
        const data = getStorageData();
        const info = getBangumiInfo(bangumiId);
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