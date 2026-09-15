import React from 'react';
import { Sparkles, Scan, FileSearch, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface ScanningAnimationProps {
  stage: number;
  message: string;
  error?: string | null;
  onCancel?: () => void;
}

export const ScanningAnimation: React.FC<ScanningAnimationProps> = ({
  stage,
  message,
  error,
  onCancel,
}) => {
  const steps = [
    { num: 1, title: 'Optical Pre-Processing', desc: 'Grayscale & contrast enhancement' },
    { num: 2, title: 'Label Ingestion', desc: 'Panel geometry & clarity check' },
    { num: 3, title: 'OCR Tokenization', desc: 'Text & bounding box extraction' },
    { num: 4, title: 'Statutory Verification', desc: 'Checking against PCR 2011 clauses' },
    { num: 5, title: 'Dossier Generation', desc: 'Formulating inspection certificate' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        {/* Animated optical scan beam effect */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 animate-pulse" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-blue-500/20 p-2 text-blue-400">
              <Scan className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Metrology Inspection Pipeline</h3>
              <p className="text-xs text-slate-400">Legal Metrology Act, 2009 Statutory Audit</p>
            </div>
          </div>
          <span className="rounded-full bg-blue-900/60 px-2.5 py-1 text-xs font-semibold text-blue-300 border border-blue-700/50">
            Step {stage} of 5
          </span>
        </div>

        {/* Radar / Scanner Visual Animation */}
        <div className="relative my-6 flex h-36 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
          
          {/* Circular radar rings */}
          <div className="absolute h-28 w-28 rounded-full border border-blue-500/20 animate-ping" />
          <div className="absolute h-20 w-20 rounded-full border border-cyan-400/40" />
          
          {/* Center pulsating core */}
          <div className="relative z-10 flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            <span className="mt-2 font-mono text-[11px] font-semibold text-cyan-300">
              ANALYZING PACKAGING MATRIX
            </span>
          </div>
        </div>

        {/* Current status message */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-3 text-xs text-slate-300">
          {error ? (
            <div className="flex items-start gap-2 text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-blue-400 animate-spin" />
              <span className="font-medium text-slate-200">{message}</span>
            </div>
          )}
        </div>

        {/* Step progression */}
        <div className="mt-5 space-y-2">
          {steps.map((s) => {
            const isDone = s.num < stage;
            const isCurrent = s.num === stage;
            return (
              <div
                key={s.num}
                className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  isCurrent
                    ? 'bg-blue-900/40 border border-blue-700/50 text-white font-semibold'
                    : isDone
                    ? 'text-emerald-400 font-medium'
                    : 'text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? '✓' : s.num}
                  </span>
                  <span>{s.title}</span>
                </div>
                <span className="text-[10px] opacity-75">{s.desc}</span>
              </div>
            );
          })}
        </div>

        {onCancel && (
          <div className="mt-5 flex justify-end">
            <button
              onClick={onCancel}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancel Inspection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
