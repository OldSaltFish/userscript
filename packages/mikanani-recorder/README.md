# mikanani-recorder
蜜柑记录器。（蜜柑计划）  
起初是用于记录自己看到哪集了，后来发现RSS订阅能自动下载，因此后续做了获取封面信息的功能，并配套了TierMaker（https://github.com/OldSaltFish/Anime-TierMaker.git）。  
网址: https://anime-tiermaker.pages.dev/  
## 预览
![alt text](imgs/image.png)
![alt text](imgs/image-1.png)

## 开发
生成脚本
```shell
bun release
```

## TODO
- [ ] 修复bug
存储数据量过大，导致一进页面浏览器就崩溃了。后续采用导出文件而不是存储数据的方式。  