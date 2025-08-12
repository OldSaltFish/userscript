export interface BangumiInfo {
  id: string;
  title: string;
  rating: number;
  episodeCount: number;
  coverBase64?: string;
}
export interface SubGroup {
  id: string;
  name: string;
  isBlocked: boolean; // 是否被屏蔽
  remark: string; // 备注
}

export interface StorageData {
  bangumis: BangumiInfo[];
  isCollapsed: boolean;
  subGroups:SubGroup[];
  blockedSubgroups: string[]; // 用于存储被屏蔽的RSS链接
  config:{
    isShowLowRating: boolean, // 低分不隐藏
  }
}