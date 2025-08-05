export interface BangumiInfo {
  id: string;
  title: string;
  rating: number;
  episodeCount: number;
  coverBase64?: string;
}

export interface StorageData {
  bangumis: BangumiInfo[];
  isCollapsed: boolean;
  blockedSubgroups: string[]; // 用于存储被屏蔽的RSS链接
}