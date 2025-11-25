import React, { createContext, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 space-y-2 print:hidden">
        {toasts.map((toast) => {
          const base =
            'pointer-events-auto flex items-center gap-2 rounded-md px-3 py-2 text-xs shadow-sm border';
          const style =
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-slate-50 text-slate-800 border-slate-200';
          return (
            <div key={toast.id} className={`${base} ${style}`}>
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

