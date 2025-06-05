import { createSignal, Component, createEffect, createContext, useContext } from 'solid-js';
import { ConfigManager, Config } from './types/configManager';
import { CoreGesture } from './CoreGesture';
import { ConfigPanel } from './views/ConfigPanel';
import { ConfigPanelContext } from './contexts';
import './App.less';
export const App: Component = () => {
  const [showConfigPanel, setShowConfigPanel] = createSignal(false);
  const [config, setConfig] = createSignal(ConfigManager.getConfig());

  // 更新配置
  const updateConfig = (newConfig: Config) => {
    const updated = ConfigManager.updateConfig(newConfig);
    setConfig(updated);
  };

  // 注册菜单命令
  GM_registerMenuCommand('打开配置面板', () => {
    setShowConfigPanel(true);
  });

  GM_registerMenuCommand('启用/禁用功能', () => {
    const newEnabled = !config().enabled;
    updateConfig({ ...config(), enabled: newEnabled });
  });

  return (
    <>
      {/* 核心手势组件，始终存在（即使指示器关闭，组件本身也会挂载事件监听） */}
      <ConfigPanelContext.Provider value={{ showConfigPanel: showConfigPanel(), setShowConfigPanel }}>
        <CoreGesture config={config()} />
      </ConfigPanelContext.Provider>


      {/* 配置面板 */}
      {showConfigPanel() && (
        <ConfigPanel
          initialConfig={config()}
          onSave={(newConfig) => {
            updateConfig(newConfig);
            setShowConfigPanel(false);
          }}
          onClose={() => setShowConfigPanel(false)}
        />
      )}
    </>
  );
};

export default App;