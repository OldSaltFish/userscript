# userscript
浏览器脚本。
## 使用
首先你需要安装一个脚本管理器，比如流行的篡改猴（tampermonkey）、暴力猴（ViolentMonkey）或者脚本猫（ScriptCat）。  
在此之后，在下面的列表处，我给出了相应的greasyfork链接，只需要对应安装即可。  
## 列表
### 必应净化
用于去除垃圾搜索结果的脚本。
https://greasyfork.org/zh-CN/scripts/521549-%E5%BF%85%E5%BA%94%E5%87%80%E5%8C%96

## 开发
使用Bun作为构建工具，虽是如此，只是为了安装油猴之类的的类型提示而已，用不到构建的功能。因此，我删除了index.ts文件，这个项目并不需要入口文件，因为他是多个油猴脚本的共同仓库。  
> 硬要写ts也是可以的，但是没什么必要，毕竟就是个单文件
```shell
bun install
```

### 注意
1. greasyfork的webhook配置没生效，如果想要立即更新，应当到greasyfork手动点击立即更新。  
