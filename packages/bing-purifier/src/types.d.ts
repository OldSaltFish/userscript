interface FilterItem {
  name: string;
  domain: string;
  enabled: boolean;
}

interface GMStorage {
  filterList?: FilterItem[];
  userFilterList?: FilterItem[];
  blockList?: string[];
}