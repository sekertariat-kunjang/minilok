import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        <div style={{ flexShrink: 0 }}>
                            {t.type === 'success' && <CheckCircle2 className="text-success" size={20} />}
                            {t.type === 'error' && <AlertCircle className="text-danger" size={20} />}
                            {t.type === 'info' && <Info style={{ color: '#3b82f6' }} size={20} />}
                        </div>
                        <div style={{ flexGrow: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                            {t.message}
                        </div>
                        <button
                            onClick={() => removeToast(t.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
