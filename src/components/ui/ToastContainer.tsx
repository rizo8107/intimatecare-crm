import React, { useState, useCallback } from 'react';
import Toast, { ToastProps, ToastType } from './Toast';

export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  children?: React.ReactNode;
}

export type ToastOptions = {
  type: ToastType;
  message: string;
  duration?: number;
};

// Create a unique ID for each toast
let toastId = 0;

// Create a context to access the toast functions from anywhere in the app
export const ToastContext = React.createContext<{
  showToast: (options: ToastOptions) => void;
  hideToast: (id: string) => void;
}>({
  showToast: () => {},
  hideToast: () => {},
});

export const useToast = () => React.useContext(ToastContext);

const ToastContainer: React.FC<ToastContainerProps> = ({ 
  position = 'top-right',
  children
}) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  const hideToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = `toast-${toastId++}`;
    const toast: ToastProps = {
      id,
      type: options.type,
      message: options.message,
      duration: options.duration,
      onClose: (id) => hideToast(id),
    };
    setToasts((prevToasts) => [...prevToasts, toast]);
    return id;
  }, [hideToast]);

  const contextValue = React.useMemo(() => ({
    showToast,
    hideToast,
  }), [showToast, hideToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={`fixed z-50 ${getPositionClasses()} w-80`}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContainer;
