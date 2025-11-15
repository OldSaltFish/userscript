import { createSignal, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';

interface ToastProps {
  message: string;
  duration?: number;
  type?: 'success' | 'error' | 'info';
}

const [toastVisible, setToastVisible] = createSignal(false);
const [toastMessage, setToastMessage] = createSignal('');
const [toastType, setToastType] = createSignal<'success' | 'error' | 'info'>('info');

export function showToast({ message, duration = 2000, type = 'info' }: ToastProps) {
  setToastMessage(message);
  setToastType(type);
  setToastVisible(true);

  const timer = setTimeout(() => {
    setToastVisible(false);
  }, duration);

  return () => clearTimeout(timer);
}

const Toast = () => {
  const getTypeStyles = () => {
    switch (toastType()) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'info':
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <Show when={toastVisible()}>
      <Portal>
        <div class="fixed top-4 right-4 z-50 flex items-center justify-center">
          <div 
            class={`px-4 py-2 rounded-md shadow-lg transform transition-all duration-300 ${getTypeStyles()}`}
            style="animation: fadeInOut 2s ease-in-out;"
          >
            {toastMessage()}
          </div>
        </div>
        <style>{`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
          }
        `}</style>
      </Portal>
    </Show>
  );
};

export default Toast;