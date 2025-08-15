
import { createEffect, createSignal, onMount, Show, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import 'uno.css';
const [volume, setVolume] = createSignal(1);
// 音量控制模式
type VolumeControlMode = 'modern' | 'traditional';

// 音频控制逻辑
class AudioController {
  private audioContext: AudioContext | null = null;
  private sourceNodes: Map<HTMLMediaElement, MediaElementAudioSourceNode> = new Map();
  private gainNode: GainNode | null = null;
  private currentDomain: string = window.location.hostname;
  private controlMode: VolumeControlMode;

  constructor() {
    // 获取控制模式设置
    this.controlMode = GM_getValue<VolumeControlMode>('volumeControlMode', 'modern');
    setVolume(this.getStoredVolume());
    if (volume() !== 1) {
      this.initialize();
    }
  }
  // 初始化音频控制器
  public initialize() {
    // 根据控制模式选择初始化方法
    if (this.controlMode === 'traditional') {
      this.initializeTraditional();
    } else {
      this.initializeModern();
    }
  }

  // 初始化传统控制模式
  private initializeTraditional(): void {
    // 应用当前音量到所有媒体元素
    this.applyTraditionalVolume(volume());
  }

  // 初始化现代控制模式
  private initializeModern(): void {
    if (!this.audioContext) {
      try {
        // 延迟初始化AudioContext，直到用户交互
        this.audioContext = new AudioContext();
        this.gainNode = this.audioContext.createGain();
        // 处理页面上已有的媒体元素
        this.processExistingMediaElements();
        // 监听新添加的媒体元素
        this.observeDOMChanges();
      } catch (error) {
        this.controlMode = 'traditional';
        GM_setValue('volumeControlMode', 'traditional');
        this.initializeTraditional();
      }
    }
  }

  private getStoredVolume(): number {
    const domainSettings = GM_getValue<VolumeSettings>('volumeSettings', {});
    const storedVolume = domainSettings[this.currentDomain] || 1;
    return storedVolume; // 默认返回1表示正常音量
  }

  // 切换音量控制模式
  public toggleControlMode(): void {
    this.controlMode = this.controlMode === 'modern' ? 'traditional' : 'modern';
    GM_setValue('volumeControlMode', this.controlMode);

    // 如果切换到传统模式，需要重置现代模式的连接
    if (this.controlMode === 'traditional') {
      this.resetModernConnections();
    } else {
      // 如果切换到现代模式，需要重新初始化
      this.initialize();
    }

    // 应用当前音量
    this.applyVolume(volume());
  }

  // 获取当前控制模式
  public getControlMode(): VolumeControlMode {
    return this.controlMode;
  }

  // 重置现代模式的连接
  private resetModernConnections(): void {
    if (this.audioContext) {
      // 断开所有连接
      this.sourceNodes.forEach((sourceNode, element) => {
        sourceNode.disconnect();
      });
      if (this.gainNode) {
        this.gainNode.disconnect();
      }
      this.sourceNodes.clear();
    }
  }

  // 使用传统方式应用音量
  private applyTraditionalVolume(vol: number): void {

    const mediaElements = document.querySelectorAll('audio, video') as NodeListOf<HTMLMediaElement>;
    mediaElements.forEach((element, index) => {
      element.volume = vol;
    });

    // 监听新添加的媒体元素
    if (!this._traditionalObserverActive) {
      this.observeTraditionalMediaElements();
    }

  }

  // 标记传统观察器是否激活
  private _traditionalObserverActive = false;

  // 监听传统方式的媒体元素
  private observeTraditionalMediaElements(): void {
    this._traditionalObserverActive = true;

    const observer = new MutationObserver((mutations: MutationRecord[]): void => {
      mutations.forEach((mutation: MutationRecord): void => {
        mutation.addedNodes.forEach((node: Node): void => {
          if (node instanceof HTMLElement) {
            // 处理自身
            if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
              (node as HTMLMediaElement).volume = volume();
            }

            // 处理子元素
            const mediaElements = node.querySelectorAll('audio, video');
            mediaElements.forEach((element: Element): void => {
              (element as HTMLMediaElement).volume = volume();
            });
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 应用音量（根据当前模式选择方法）
  public applyVolume(vol: number): void {
    // 保存音量设置（两种模式共用）
    this.saveVolumeSettings(vol);

    // 根据模式应用音量
    if (this.controlMode === 'traditional') {
      this.applyTraditionalVolume(vol);
    } else {
      this.applyModernVolume(vol);
    }
  }

  // 使用现代方式应用音量
  private applyModernVolume(vol: number): void {
    if (!this.gainNode) {
      return;
    }


    this.gainNode.gain.value = vol;
  }

  // 保存音量设置（两种模式共用）
  private saveVolumeSettings(vol: number): void {
    const domainSettings = GM_getValue<VolumeSettings>('volumeSettings', {});
    domainSettings[this.currentDomain] = vol;
    GM_setValue('volumeSettings', domainSettings);

  }

  // 兼容旧版API
  public saveVolume(vol: number): void {
    this.applyVolume(vol);
  }

  private processExistingMediaElements(): void {
    const mediaElements = document.querySelectorAll('audio, video') as NodeListOf<HTMLMediaElement>;
    mediaElements.forEach((element, index) => {
      this.setupMediaElement(element);
    });
  }

  private setupMediaElement(element: HTMLMediaElement): void {
    if (!this.audioContext || !this.gainNode) {
      return;
    }

    // 检查元素是否已经被处理过
    if (this.sourceNodes.has(element)) {
      return;
    }


    const sourceNode = this.audioContext.createMediaElementSource(element);
    sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = volume();
    this.sourceNodes.set(element, sourceNode);

  }

  private observeDOMChanges(): void {
    const observer = new MutationObserver((mutations: MutationRecord[]): void => {
      mutations.forEach((mutation: MutationRecord): void => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node: Node): void => {
            if (node instanceof HTMLElement) {              // 处理自身
              if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
                this.setupMediaElement(node as HTMLMediaElement);
              }
              // 处理子元素
              const mediaElements = node.querySelectorAll('audio, video');
              if (mediaElements.length > 0) {
                mediaElements.forEach((element: Element): void => {
                  this.setupMediaElement(element as HTMLMediaElement);
                });
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

  }


}

// 创建音频控制器实例
const audioController = new AudioController();

// UI组件
const [isPanelShow, setPanelShow] = createSignal<boolean>(false);
const [controlMode, setControlMode] = createSignal<VolumeControlMode>(audioController.getControlMode());

const VolumePanel = () => {
  createEffect(() => {
    audioController.saveVolume(volume());
  })

  // 切换控制模式
  const toggleControlMode = () => {
    audioController.toggleControlMode();
    setControlMode(audioController.getControlMode());
  }
  // 更新滑块音量
  const updateVolumeFromSlider = (e: Event): void => {
    const newVolume = parseFloat((e.target as HTMLInputElement).value);
    setVolume(newVolume);
  };

  // 更新输入框音量
  const updateVolumeFromInput = (e: Event): void => {
    const value = (e.target as HTMLInputElement).value;

    // 只允许输入数字
    if (!/^\d*$/.test(value)) {
      return;
    }

    // 转换为数字并限制范围
    const percent = parseInt(value, 10) || 0;
    const limitedPercent = Math.max(0, Math.min(300, percent)); // 限制在0-300%范围内
    const newVolume = limitedPercent / 100;
    setVolume(newVolume);
  };

  return (
    <Show when={isPanelShow()}>
      <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-lg p-4 z-[10000] shadow-md w-72 font-sans">
        <button
          class="absolute top-2 right-2 bg-transparent border-none cursor-pointer text-base text-gray-400 hover:text-gray-700"
          onClick={() => setPanelShow(false)}
        >
          ×
        </button>
        <h3 class="mt-0 mb-4 text-lg text-gray-800 font-medium">全局音量控制</h3>
        <input
          type="range"
          min="0"
          max="3"
          step="0.01"
          value={volume()}
          onInput={updateVolumeFromSlider}
          class="w-full my-2"
        />
        <div class="flex items-center justify-between mt-2">
          <p class="text-sm text-gray-600">音量:</p>
          <div class="flex items-center">
            <input
              type="number"
              inputmode="numeric"
              pattern="[0-9]*"
              min="0"
              max="300"
              value={volume() * 100}
              onInput={updateVolumeFromInput}
              class="w-12 h-8 text-center border border-gray-300 rounded mr-1"
            />
            <span class="text-sm text-gray-600">%</span>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-600">控制模式:</p>
            <button
              onClick={toggleControlMode}
              class="px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 text-blue-800"
            >
              {controlMode() === 'modern' ? '现代模式 (Web Audio API)' : '传统模式 (直接控制)'}
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {controlMode() === 'modern'
              ? '现代模式使用Web Audio API，支持更精确的音量控制'
              : '传统模式直接控制媒体元素音量，兼容性更好'}
          </p>
        </div>
      </div>
    </Show>
  );
};


// 注册菜单命令
GM_registerMenuCommand('调整音量', () => {

  audioController.initialize();
  setPanelShow(true);
});

// 注册切换控制模式菜单命令
GM_registerMenuCommand('切换音量控制模式', () => {

  audioController.toggleControlMode();
  setControlMode(audioController.getControlMode());

  // 显示当前模式的通知
  const modeName = audioController.getControlMode() === 'modern' ? '现代模式 (Web Audio API)' : '传统模式 (直接控制)';
  if (typeof GM_notification === 'function') {
    GM_notification({
      title: '音量控制器',
      text: `已切换到${modeName}`,
      timeout: 2000
    });
  } else {
    alert(`音量控制器: 已切换到${modeName}`);
  }
});
render(() => <VolumePanel />, document.body);

