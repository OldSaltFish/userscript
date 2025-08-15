// 油猴脚本API类型声明
declare function GM_getValue<T>(key: string, defaultValue?: T): T;
declare function GM_setValue(key: string, value: any): void;
declare function GM_registerMenuCommand(name: string, callback: () => void): void;

// 音量设置类型
interface VolumeSettings {
  [domain: string]: number;
}

// AudioContext 兼容性
interface Window {
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
}

// 音频控制器接口
interface IAudioController {
  initialize(): void;
  saveVolume(volume: number): void;
  getCurrentVolume(): number;
  applyVolumeToAll(): void;
}