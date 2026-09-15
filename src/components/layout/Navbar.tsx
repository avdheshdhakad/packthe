import React from 'react';
import { ShieldCheck, Bell, Sparkles, Settings, Sun, Moon } from 'lucide-react';
import { User, Scan, ComplianceRule, Violation } from '../../types';
import { GlobalSearchBar } from '../search/GlobalSearchBar';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onOpenSettings?: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  mode: 'demo' | 'live';
  onToggleMode: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  scans: Scan[];
  rules: ComplianceRule[];
  violations: Violation[];
  onSelectScan: (scanId: string) => void;
  onSelectRule?: (ruleCode: string) => void;
  onSelectViolation?: (violationId: string) => void;
  onViewAllInRepository?: (query: string) => void;
  onStartScan?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onOpenSettings,
  onOpenNotifications,
  unreadCount = 2,
  mode,
  onToggleMode,
  theme = 'light',
  onToggleTheme,
  scans,
  rules,
  violations,
  onSelectScan,
  onSelectRule,
  onSelectViolation,
  onViewAllInRepository,
  onStartScan,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 shadow-xs backdrop-blur-md pt-[env(safe-area-inset-top)]">
      {/* Official Government Tricolor Strip */}
      <div className="flex h-1 w-full">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & National Emblem Header */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm ring-1 ring-blue-500/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                Pack<span className="text-blue-600">Sure</span>
              </span>
              <span className="hidden rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 sm:inline-block">
                PCR 2011 COMPLIANT
              </span>
            </div>
            <p className="hidden text-[10px] font-semibold tracking-wide text-slate-500 md:block">
              DIRECTORATE OF LEGAL METROLOGY • MINISTRY OF CONSUMER AFFAIRS
            </p>
          </div>
        </div>

        {/* Global Quick Search (Desktop) */}
        <div className="hidden max-w-md flex-1 px-4 lg:block xl:px-8">
          <GlobalSearchBar
            scans={scans}
            rules={rules}
            violations={violations}
            onSelectScan={onSelectScan}
            onSelectRule={onSelectRule}
            onSelectViolation={onSelectViolation}
            onViewAllInRepository={onViewAllInRepository}
            onStartScan={onStartScan}
          />
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Search Button & Overlay (Mobile / Tablet) */}
          <div className="lg:hidden">
            <GlobalSearchBar
              scans={scans}
              rules={rules}
              violations={violations}
              onSelectScan={onSelectScan}
              onSelectRule={onSelectRule}
              onSelectViolation={onSelectViolation}
              onViewAllInRepository={onViewAllInRepository}
              onStartScan={onStartScan}
            />
          </div>

          {/* Mode Switcher */}
          <button
            onClick={onToggleMode}
            title="Toggle between Pre-calibrated Demo Dataset and Live Scanner"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              mode === 'demo'
                ? 'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">{mode === 'demo' ? 'DEMO SAMPLES' : 'LIVE OCR'}</span>
            <span className="sm:hidden">{mode === 'demo' ? 'DEMO' : 'OCR'}</span>
          </button>

          {/* Theme Quick Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </button>
          )}

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
            title="Inspection notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
              title="System Configuration & Engine Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}

          {/* Role Switcher for SIH Judges */}
          <div className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 pl-2.5 shadow-2xs">
            <div className="hidden text-right text-[11px] sm:block">
              <div className="font-bold text-slate-900">{currentUser.name.split(' ')[0]}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                {currentUser.role.replace('_', ' ')}
              </div>
            </div>

            <select
              value={currentUser.id}
              onChange={(e) => {
                const found = allUsers.find((u) => u.id === e.target.value);
                if (found) onSelectUser(found);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
              title="Switch user role"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.role.toUpperCase()}: {u.name.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
