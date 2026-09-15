import React, { useState } from 'react';
import { Settings, Sliders, ShieldCheck, Database, Save, CheckCircle2, Cpu } from 'lucide-react';
import { SystemConfig } from '../../types';

interface SettingsViewProps {
  config: SystemConfig;
  onSaveConfig: (updated: Partial<SystemConfig>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveConfig(localConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700">System Configuration</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Inspection Engine Controls</span>
          </div>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
            PackSure AI Calibration & Thresholds
          </h2>
          <p className="text-xs font-medium text-slate-600">
            Tune optical character recognition sensitivity, statutory penalty rules, and pipeline execution mode.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Save className="h-4 w-4" />
          <span>Save Settings</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          <span>System configuration parameters successfully updated!</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pipeline Execution Mode */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Cpu className="h-4 w-4 text-blue-700" />
            <span>Inspection Engine Mode</span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
              <input
                type="radio"
                name="mode"
                checked={localConfig.mode === 'live'}
                onChange={() => setLocalConfig({ ...localConfig, mode: 'live' })}
                className="mt-0.5"
              />
              <div>
                <div className="font-bold text-slate-900">Live AI Enforcement Mode</div>
                <div className="text-slate-500">
                  Runs multimodal optical analysis on every uploaded label with cloud OCR vision models.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
              <input
                type="radio"
                name="mode"
                checked={localConfig.mode === 'demo'}
                onChange={() => setLocalConfig({ ...localConfig, mode: 'demo' })}
                className="mt-0.5"
              />
              <div>
                <div className="font-bold text-slate-900">Offline & Demo Mode</div>
                <div className="text-slate-500">
                  Pre-configured statutory calibration datasets for high-speed offline simulation.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Optical Sensitivity Thresholds */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Sliders className="h-4 w-4 text-blue-700" />
            <span>OCR Calibration & Sensitivity</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700">
                <span>Minimum Confidence Threshold</span>
                <span className="text-blue-700">{localConfig.ocrConfidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={localConfig.ocrConfidenceThreshold}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, ocrConfidenceThreshold: Number(e.target.value) })
                }
                className="mt-2 w-full accent-blue-700"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Tokens with confidence below this threshold are flagged for secondary inspection.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.autoFlagViolations}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, autoFlagViolations: e.target.checked })
                  }
                  className="rounded accent-blue-700"
                />
                <span>Automatically Flag Violations to Enforcement Docket</span>
              </label>
              <p className="mt-1 text-[11px] text-slate-500">
                Automatically indexes detected infractions into the Statutory Violation Center.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
