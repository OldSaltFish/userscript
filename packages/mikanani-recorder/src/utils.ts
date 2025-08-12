import { STORE_NAME } from "./const";
import type { BangumiInfo, StorageData } from "./types";

// 从GM存储获取所有番剧数据
export const getStorageData = (): StorageData => {
  const data: StorageData = GM_getValue(STORE_NAME);
  return (
    data || {
      bangumis: [],
      isCollapsed: false,
      blockedSubgroups: [],
      subGroups: [],
    }
  );
};

// 获取当前页面的番剧ID
export const getBangumiId = () => {
  const match = location.pathname.match(/\/Home\/Bangumi\/(\d+)/);
  return match ? match[1] : null;
};

// 获取番剧标题
export const getBangumiTitle = () => {
  const title = document.title;
  const match = title.match(/Mikan Project - (.+)/);
  return match ? match[1] : "";
};
export const getBangumiIdFromHref = (href: string) => {
  const match = href.match(/\/Home\/Bangumi\/(\d+)/);
  return match ? match[1] : null;
};
// 保存番剧数据
export const saveBangumiInfo = (info: BangumiInfo) => {
  const data = getStorageData();
  let existData = data.bangumis.find((item) => item.id === info.id);
  if (existData) {
    Object.assign(existData, info);
  } else {
    data.bangumis.push(info);
  }
  GM_setValue(STORE_NAME, data);
};

// 获取单个番剧信息
export const getBangumiInfo = (id: string): BangumiInfo | null => {
  const data = getStorageData();
  return data.bangumis.find((item) => item.id === id) || null;
};

export function getMeaningfulNodes(element: Element): Node[] {
  return Array.from(element.childNodes).filter((node) => {
    return (
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() !== "")
    );
  });
}

export function isMobile() {
  return window.innerWidth <= 990;
}
