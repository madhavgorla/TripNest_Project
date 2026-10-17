import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, AlertTriangle, ShieldAlert, Sparkles, X } from 'lucide-react';

export const SignOutConfirmModal: React.FC = () => {
  const {
    isSignOutConfirmOpen,
    cancelSignOut,
    confirmSignOut,
    userProfile
  } = useApp();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSignOutConfirmOpen) {
        cancelSignOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSignOutConfirmOpen, cancelSignOut]);

  if (!isSignOutConfirmOpen || !userProfile) return null;

  return (
    <div
      id="sign-out-confirm-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={cancelSignOut}
    >
      <div
        id="sign-out-confirm-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-out-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0B0F19] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          id="close-sign-out-modal-btn"
          onClick={cancelSignOut}
          className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Cancel and close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-sm">
            <LogOut className="h-5 w-5" />
          </div>
          <div>
            <h3 id="sign-out-modal-title" className="text-lg font-bold text-white tracking-tight">
              Confirm Sign Out
            </h3>
            <p className="text-xs text-neutral-400">
              Revoke session & active VIP privileges
            </p>
          </div>
        </div>

        {/* Active Member Status Card */}
        <div className="mb-4 rounded-xl border border-[#E2C076]/30 bg-gradient-to-br from-[#121A2E] to-[#0A101D] p-4 text-left">
          <div className="flex items-center space-x-3">
            <img
              src={userProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
              alt={userProfile.name}
              className="h-11 w-11 rounded-full object-cover border border-[#E2C076]/40"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-white truncate">{userProfile.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E2C076]/15 border border-[#E2C076]/30 px-2 py-0.5 text-[10px] font-bold text-[#E2C076]">
                  <Sparkles className="h-2.5 w-2.5" />
                  VIP
                </span>
              </div>
              <p className="text-xs text-neutral-400 truncate">{userProfile.email}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px]">
                <span className="font-semibold text-[#E2C076]">{userProfile.membershipTier}</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300">{(userProfile.points || 0).toLocaleString()} Reward Miles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Notice */}
        <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-left">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 leading-relaxed">
              <p className="font-semibold mb-1 text-rose-100">
                Golden VIP Status Will Be Revoked on This Device
              </p>
              <p className="text-neutral-300 text-[11px]">
                Signing out will terminate your authenticated passport credentials. Your active <strong className="text-[#E2C076]">{userProfile.membershipTier}</strong> perks, booking vouchers, and VIP concierge access will be removed until you sign in again.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            id="cancel-sign-out-btn"
            onClick={cancelSignOut}
            className="w-full rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.98]"
          >
            Stay Logged In
          </button>

          <button
            type="button"
            id="confirm-sign-out-btn"
            onClick={confirmSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-4 py-3 text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all active:scale-[0.98]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Confirm Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
