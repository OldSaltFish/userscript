// 上下文，用于深层（层层嵌套的情况下）传递数据
import { createContext } from "solid-js";

export const ConfigPanelContext = createContext<{
    showConfigPanel: boolean;
    setShowConfigPanel: (v: boolean) => void;
}>();