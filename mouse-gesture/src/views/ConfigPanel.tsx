import { createSignal, Component } from 'solid-js';
import type { Config } from '../types/configManager';

interface ConfigPanelProps {
  initialConfig: Config;
  onSave: (config: Config) => void;
  onClose: () => void;
}

export const ConfigPanel: Component<ConfigPanelProps> = (props) => {
  const [sensitivity, setSensitivity] = createSignal(props.initialConfig.sensitivity);
  const [enabled, setEnabled] = createSignal(props.initialConfig.enabled);
  const [showIndicator, setShowIndicator] = createSignal(props.initialConfig.showIndicator); // 新增状态

  return (
    <div class="rock-scroll-config-panel">
      <div class="config-header">
        <h2>滚动控制设置</h2>
        <p>调整鼠标摇滚手势的参数</p>
      </div>

      <div class="setting-group">
        <div class="setting-title">
          <h3>滚动灵敏度</h3>
          <span class="value-display">{sensitivity()}</span>
        </div>
        <div class="slider-container">
          <input
            type="range"
            class="rock-scroll-slider"
            min="1"
            max="10"
            value={sensitivity()}
            step="0.5"
            onInput={(e) => setSensitivity(parseFloat(e.currentTarget.value))}
          />
        </div>
        <p>控制滚动速度，数值越大滚动越快</p>
      </div>

      <div class="setting-group">
        <div class="setting-title">
          <h3>启用摇滚手势</h3>
          <div class="toggle-container">
            <label class="rock-scroll-toggle">
              <input
                type="checkbox"
                checked={enabled()}
                onChange={(e) => setEnabled(e.currentTarget.checked)}
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <p>开启或关闭鼠标摇滚手势功能</p>
      </div>
      {/* 新增：显示状态指示器开关 */}
      <div class="setting-group">
        <div class="setting-title">
          <h3>显示状态指示器</h3>
          <div class="toggle-container">
            <label class="rock-scroll-toggle">
              <input
                type="checkbox"
                checked={showIndicator()}
                onChange={(e) => setShowIndicator(e.currentTarget.checked)}
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <p>在屏幕右下角显示当前手势激活状态</p>
      </div>
      <div class="config-actions">
        <button
          class="config-btn save-btn"
          onClick={() =>
            props.onSave({
              enabled: enabled(),
              sensitivity: sensitivity(),
              showIndicator: showIndicator(), // 保存新配置项
            })
          }
        >
          保存设置
        </button>
        <button class="config-btn close-btn" onClick={props.onClose}>
          关闭
        </button>
      </div>
    </div>
  );
};