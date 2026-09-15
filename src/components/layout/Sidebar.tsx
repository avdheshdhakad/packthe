import React, { useState } from 'react';
import {
  LayoutDashboard,
  ScanLine,
  ListTodo,
  FileCheck2,
  Boxes,
  AlertTriangle,
  BarChart3,
  Scale,
  Eye,
  Users,
  Settings,
  Shield,
  Bot,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { UserRole } from '../../types';
import { mobileApp } from '../../services/mobileAppService';

export type NavView =
  | 'landing'
  | 'dashboard'
  | 'scanner'
  | 'result'
  | 'reports'
  | 'repository'
  | 'violations'
  | 'analytics'
  | 'rules'
  | 'evidence'
  | 'users'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  userRole: UserRole;
  criticalViolationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  criticalViolationsCount = 3,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (view: NavView) => {
    mobileApp.triggerHaptic();
    onNavigate(view);
    setMobileMenuOpen(false);
  };
  const navItems = [
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'scanner' as NavView,
      label: 'Product Scan',
      icon: ScanLine,
      highlight: true,
      badge: 'Pipeline',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 font-bold',
    },
    ...(currentView === 'result'
      ? [
          {
            id: 'result' as NavView,
            label: 'Inspection Result',
            icon: FileCheck2,
            highlight: true,
            badge: 'Active',
            badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
          },
        ]
      : []),
    { id: 'reports' as NavView, label: 'Compliance Reports', icon: FileCheck2 },
    { id: 'repository' as NavView, label: 'Product Repository', icon: Boxes },
    {
      id: 'violations' as NavView,
      label: 'Violation Center',
      icon: AlertTriangle,
      badge: criticalViolationsCount > 0 ? criticalViolationsCount : undefined,
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
    },
    { id: 'analytics' as NavView, label: 'Analytics', icon: BarChart3 },
    { id: 'rules' as NavView, label: 'Statutory Rules', icon: Scale },
    { id: 'evidence' as NavView, label: 'Evidence Viewer', icon: Eye },
    { id: 'users' as NavView, label: 'User Roles', icon: Users },
    { id: 'settings' as NavView, label: 'System Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/90 bg-white p-4 shadow-xs md:flex">
        <div className="mb-3 px-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Enforcement Navigation
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                  item.highlight
                    ? isActive
                      ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                      : 'border border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100'
                    : isActive
                    ? 'bg-blue-50/90 text-blue-700 border border-blue-200/80 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive ? (item.highlight ? 'text-white' : 'text-blue-600') : (item.highlight ? 'text-blue-600' : 'text-slate-500')
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${
                      item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Legal Metrology Quick Stamp Box */}
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-slate-700">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
            <Shield className="h-4 w-4 text-blue-600" />
            <span>PCR 2011 Mandate</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
            Digital certification under Legal Metrology Act, 2009 & Packaged Commodities Rules.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur-lg md:hidden">
        <button
          onClick={() => handleMobileNav('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => handleMobileNav('scanner')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            currentView === 'scanner' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
            <ScanLine className="h-4 w-4" />
          </div>
          <span>Scan</span>
        </button>

        <button
          onClick={() => handleMobileNav('reports')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            currentView === 'reports' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <FileCheck2 className="h-5 w-5" />
          <span>Reports</span>
        </button>

        <button
          onClick={() => handleMobileNav('violations')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            currentView === 'violations' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <div className="relative">
            <AlertTriangle className="h-5 w-5" />
            {criticalViolationsCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[8px] font-bold text-white">
                {criticalViolationsCount}
              </span>
            )}
          </div>
          <span>Violations</span>
        </button>

        <button
          onClick={() => {
            mobileApp.triggerHaptic();
            setMobileMenuOpen(true);
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            ['repository', 'analytics', 'rules', 'evidence', 'users', 'settings'].includes(currentView)
              ? 'text-blue-600'
              : 'text-slate-500'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>

      {/* Mobile "More" Sheet Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs md:hidden">
          <div className="rounded-t-3xl border-t border-slate-200 bg-white p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>All Inspection Tools</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleMobileNav('repository')}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-bold transition-all ${
                  currentView === 'repository'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Boxes className="h-4 w-4 text-blue-600" />
                <span>Product Repository</span>
              </button>

              <button
                onClick={() => handleMobileNav('analytics')}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-bold transition-all ${
                  currentView === 'analytics'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => handleMobileNav('rules')}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-bold transition-all ${
                  currentView === 'rules'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Scale className="h-4 w-4 text-blue-600" />
                <span>Statutory Rules</span>
              </button>

              <button
                onClick={() => handleMobileNav('evidence')}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-bold transition-all ${
                  currentView === 'evidence'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Eye className="h-4 w-4 text-blue-600" />
                <span>Evidence Vault</span>
              </button>

              <button
                onClick={() => handleMobileNav('users')}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-bold transition-all ${
                  currentView === 'users'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="h-4 w-4 text-blue-600" />
                <span>User Roles</span>
              </button>

              <button
                onClick={() => handleMobileNav('settings')}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-bold transition-all ${
                  currentView === 'settings'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Settings className="h-4 w-4 text-blue-600" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
