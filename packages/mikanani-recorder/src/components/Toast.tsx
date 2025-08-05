import { createRoot, createSignal } from "solid-js";

// Toast组件
const Toast = () => {
  const [visible, setVisible] = createSignal(false);
  const [message, setMessage] = createSignal('');
  
  const show = (text: string, duration = 2000) => {
    setMessage(text);
    setVisible(true);
    setTimeout(() => setVisible(false), duration);
  };
  
  return {
    show,
    component: () => (
    <div 
      class={`fixed left-50vw top-50vh transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 flex items-center gap-2 justify-center ${visible() ? 'opacity-100' : 'opacity-0 pointer-events-none'} bg-gray-900 text-white`}
    >
      {message()}
    </div>
    )
  };
};

// 创建全局Toast实例
export const toast = createRoot(Toast);

// 全局Toast调用方法
export const showToast = (message: string, duration?: number) => {
  toast.show(message, duration);
  debugger;
};