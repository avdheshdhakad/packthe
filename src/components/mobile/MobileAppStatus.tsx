import React, { useState } from 'react';
import { WifiOff, RefreshCw, Smartphone, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface MobileAppStatusProps {
  isOnline: boolean;
  onRetryConnection: () => void;
  backExitToast: boolean;
}

export const MobileAppStatus: React.FC<MobileAppStatusProps> = ({
  isOnline,
  onRetryConnection,
  backExitToast,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetryConnection();
    setTimeout(() => setIsRetrying(false), 800);
  };

  return (
    <>
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0 text-amber-700 animate-pulse" />
            <span>Offline Mode Active — Using cached inspection rules & records.</span>
          </div>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin text-amber-600' : ''}`} />
            <span>{isRetrying ? 'Checking...' : 'Retry'}</span>
          </button>
        </div>
      )}

      {/* Android Double-Back to Exit Toast */}
      {backExitToast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-sm animate-fade-in">
          Press back again to exit PackSure AI
        </div>
      )}

      {/* Mobile Browser PWA Install Prompt Banner */}
      {isInstallable && !isInstalled && !installDismissed && (
        <div className="fixed bottom-20 left-4 right-4 z-40 flex items-center justify-between rounded-2xl border border-blue-200 bg-white p-3.5 shadow-lg md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Install PackSure AI Mobile App</div>
              <div className="text-[11px] text-slate-500">Fast offline access & native camera scanner</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={install}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500"
            >
              Install
            </button>
            <button
              onClick={() => setInstallDismissed(true)}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Add to Home Screen Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-900">Install on iPhone / iPad</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              1. Tap the <strong className="text-slate-900">Share button</strong> (box with arrow) in Safari's bottom toolbar.<br />
              2. Scroll down the list and tap <strong className="text-slate-900">Add to Home Screen</strong>.<br />
              3. Tap <strong className="text-slate-900">Add</strong> in the top-right corner.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const AppLoadingSplash: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6">
      {/* Tricolor Header */}
      <div className="absolute top-0 left-0 right-0 flex h-1.5 w-full">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      <div className="flex flex-col items-center text-center">
        {/* App Logo Emblem */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg ring-4 ring-blue-100">
          <ShieldCheck className="h-10 w-10 text-white" />
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">
          Pack<span className="text-blue-600">Sure</span> <span className="text-xs font-bold uppercase tracking-widest text-blue-600">AI</span>
        </h1>
        <p className="mt-1 text-xs font-semibold tracking-wide text-slate-500">
          LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011
        </p>

        {/* Loading Bar & Indicator */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full origin-left-right animate-[pulse_1.2s_ease-in-out_infinite] bg-blue-600" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Initializing OCR engine & regulatory rules...
          </span>
        </div>
      </div>

      {/* Footer Credentials */}
      <div className="absolute bottom-6 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Directorate of Legal Metrology • Android Mobile Edition
      </div>
    </div>
  );
};
