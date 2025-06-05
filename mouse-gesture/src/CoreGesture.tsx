import { createSignal, onMount, onCleanup, Component, createEffect, Show } from 'solid-js';
import { Config } from './types/configManager';
import { StatusIndicator } from './components/StatusIndicator';

interface CoreGestureProps {
  config: Config;
}

export const CoreGesture: Component<CoreGestureProps> = (props) => {
  const [isActive, setIsActive] = createSignal(false);
  let startY = 0;
  let lastY = 0;
  const buttonState = { left: false, right: false };

  // 事件处理函数
  const handleMouseDown = (e: MouseEvent) => {
    if (!props.config.enabled) return;

    if (e.buttons === 3) {
      setIsActive(true);
      buttonState.left = true;
      buttonState.right = true;
      startY = e.clientY;
      lastY = e.clientY;
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isActive() || !props.config.enabled) return;

    if (buttonState.left && buttonState.right) {
      const currentY = e.clientY;
      const deltaY = lastY - currentY;
      lastY = currentY;

      window.scrollBy({
        top: deltaY * props.config.sensitivity,
        behavior: 'smooth' // 固定使用原生平滑滚动[3](@ref)
      });
    }
    e.preventDefault();
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isActive()) return;

    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      buttonState.right = false;
    } else if (e.button === 0) {
      buttonState.left = false;
    }

    // if (!buttonState.left && !buttonState.right) {
    //   setIsActive(false);
    // }
  };

  const preventContextMenu = (e: MouseEvent) => {
    if (isActive()) {
      setIsActive(false);
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // 挂载时添加事件监听
  onMount(() => {
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('contextmenu', preventContextMenu, true);
  });

  // 清理时移除事件监听
  onCleanup(() => {
    document.removeEventListener('mousedown', handleMouseDown, true);
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('mouseup', handleMouseUp, true);
    document.removeEventListener('contextmenu', preventContextMenu, true);
  });

  // 根据配置中的showIndicator决定是否渲染状态指示器
  return (
    <Show when={props.config.showIndicator}>
      <StatusIndicator isActive={isActive()} />
    </Show>
  );
};