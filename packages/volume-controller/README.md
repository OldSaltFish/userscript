# 音量控制器
<a href="https://github.com/OldSaltFish/userscript/raw/refs/heads/main/packages/volume-controller/output.user.js" target="_blank">直接安装(github)</a>  

## 开发
### 调整音量原理
```js
// 创建音频上下文
const audioContext = new AudioContext();

// 1. 源节点(网页元素)
const audioElement = document.querySelector('audio');
const sourceNode = audioContext.createMediaElementSource(audioElement);

// 2. 增益节点(配置结点)
const gainNode = audioContext.createGain();
gainNode.gain.value = 0.7; // 70%音量

// 3. 目标节点（扬声器）
sourceNode.connect(gainNode);
gainNode.connect(audioContext.destination);
```
只要把所有声音结点全绑上就能集中控制音量了，然后再监听新的页面元素。  

### 降低侵入性
由于脚本是全局的，因此为了降低侵入性我们要尽可能在无关网页上少执行代码。  
- 如果已经设置过音量，那么可以放心初始化。  
- 如果从未设置过音量，那么应该在第一次点击调整音量按钮时初始化。  
