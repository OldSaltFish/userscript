export const getStorage = () => {
  return GM_getValue("config", {
    // 用户如果修改，直接复制一份存起来
    filterList: [
      { name: "csdn", domain: "csdn.net", enabled: true },
      { name: "抖音", domain: "www.douyin.com", enabled: true },
    ],
    blockList: [
      "/shouji.baidu/",
      "/lightapp.baidu/",
      "/author.baidu/",
      "/ubs.baidu/",
      "/m2.baidu/",
      "/baijiahao.baidu/",
    ],
  });
};
