interface FilterItem {
  name: string;
  domain: string;
  enabled: boolean;
}

interface BlockItem {
  name: string;
  regexList: string[];
  enabled: boolean;
}

interface BingSearchConfig {
  filterList: FilterItem[];
  userFilterList: FilterItem[];
  blockList: BlockItem[];
  userBlockList: string[];
}