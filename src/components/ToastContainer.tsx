import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-notifications-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-3 ${
            t.type === 'success'
              ? 'border-[#D4A853]/60 bg-[#111827]/95 text-white'
              : t.type === 'error'
              ? 'border-rose-500/50 bg-rose-950/90 text-rose-200'
              : 'border-slate-700 bg-[#111827]/95 text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2.5 overflow-hidden">
            {t.type === 'success' ? (
              <Sparkles className="h-4 w-4 text-[#D4A853] shrink-0" />
            ) : t.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-slate-400 shrink-0" />
            )}
            <span className="text-xs font-semibold truncate">{t.message}</span>
          </div>

          <button
            onClick={() => dismissToast(t.id)}
            className="ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
