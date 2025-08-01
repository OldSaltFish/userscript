import { Component, useContext } from 'solid-js';
import { ConfigPanelContext } from '../contexts';

interface StatusIndicatorProps {
    isActive: boolean;
}


export const StatusIndicator: Component<StatusIndicatorProps> = (props) => {
    const { setShowConfigPanel } = useContext(ConfigPanelContext)!;
    return (
        <div
            class="status-indicator"
            onClick={(e) => {
                e.stopPropagation();
                setShowConfigPanel(true); // 新增点击事件回调
            }}
        >
            <div class={`status-dot ${props.isActive ? 'active' : ''}`} />
            <span>摇滚手势: {props.isActive ? '激活中' : '未激活'}</span>
        </div>
    );
};