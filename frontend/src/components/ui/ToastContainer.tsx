'use client';

import React from 'react';
import { useToastStore, ToastType } from '../../stores/toastStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        
        // Signal uses mostly dark minimalistic toasts, we'll mimic that with colored icons
        return (
          <div 
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 bg-bg-elevated text-text-primary px-4 py-3 rounded-xl shadow-lg border border-border-subtle min-w-[300px] animate-in slide-in-from-bottom-5 fade-in duration-200"
          >
            <Icon className={`h-5 w-5 shrink-0 ${
              toast.type === 'success' ? 'text-success' :
              toast.type === 'error' ? 'text-error' :
              'text-info'
            }`} />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-primary transition-colors p-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
