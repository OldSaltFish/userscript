export interface Config {
  enabled: boolean;
  sensitivity: number;
  showIndicator: boolean; // 新增配置项：是否显示状态指示器
}

export const ConfigManager = {
  getConfig: (): Config => ({
    enabled: GM_getValue('enabled', true),
    sensitivity: GM_getValue('sensitivity', 5),
    showIndicator: GM_getValue('showIndicator', true), // 默认显示指示器
  }),

  saveConfig: (config: Config) => {
    GM_setValue('enabled', config.enabled);
    GM_setValue('sensitivity', config.sensitivity);
    GM_setValue('showIndicator', config.showIndicator);
    return config;
  },

  updateConfig: (newValues: Partial<Config>) => {
    const currentConfig = ConfigManager.getConfig();
    const updatedConfig = { ...currentConfig, ...newValues };
    return ConfigManager.saveConfig(updatedConfig);
  }
};