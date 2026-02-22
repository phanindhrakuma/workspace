import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
    const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
    const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);
    const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);

    return (
        <ToastContext.Provider value={{ success, error, info, warning }}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
                {toasts.map(toast => (
                    <div key={toast.id} className={`animate-slide-up px-5 py-3.5 rounded-xl shadow-glass-lg backdrop-blur-xl border text-sm font-medium flex items-center gap-3
            ${toast.type === 'success' ? 'bg-green-50/90 dark:bg-green-900/80 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200' : ''}
            ${toast.type === 'error' ? 'bg-red-50/90 dark:bg-red-900/80 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200' : ''}
            ${toast.type === 'info' ? 'bg-blue-50/90 dark:bg-blue-900/80 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200' : ''}
            ${toast.type === 'warning' ? 'bg-amber-50/90 dark:bg-amber-900/80 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200' : ''}
          `}>
                        <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ'}</span>
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
