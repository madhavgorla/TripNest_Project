import React from 'react';
import { AlertCircle, Trash2, XCircle, X } from 'lucide-react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  actionType: 'delete' | 'cancel' | 'reactivate';
  confirmButtonText: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  message,
  actionType,
  confirmButtonText,
  isProcessing = false,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const isDelete = actionType === 'delete';
  const isCancel = actionType === 'cancel';

  return (
    <div
      id="in-app-confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-[#0F172A] p-6 sm:p-7 shadow-2xl text-slate-200">
        {/* Close Button */}
        <button
          id="confirm-modal-close-btn"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon & Badge */}
        <div className="flex items-center space-x-3 mb-4">
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center border ${
              isDelete
                ? 'bg-rose-950/50 border-rose-800/60 text-rose-400'
                : isCancel
                ? 'bg-amber-950/50 border-amber-800/60 text-amber-400'
                : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-400'
            }`}
          >
            {isDelete ? (
              <Trash2 className="h-5 w-5" />
            ) : isCancel ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>
          <div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block ${
                isDelete ? 'text-rose-400' : isCancel ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {isDelete ? 'Delete Confirmation' : isCancel ? 'Status Update' : 'Action Confirmation'}
            </span>
            <h3 className="text-lg font-bold text-white font-serif">{title}</h3>
          </div>
        </div>

        {/* Body Message */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light mb-6">
          {message}
        </p>

        {/* Button Actions */}
        <div className="flex items-center justify-end space-x-3 border-t border-slate-800 pt-4">
          <button
            id="confirm-modal-cancel-action-btn"
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Go Back
          </button>

          <button
            id="confirm-modal-proceed-btn"
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center space-x-2 ${
              isDelete
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-900/40'
                : isCancel
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-900/40'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-emerald-900/40'
            }`}
          >
            {isProcessing ? (
              <span>Processing...</span>
            ) : (
              <span>{confirmButtonText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
