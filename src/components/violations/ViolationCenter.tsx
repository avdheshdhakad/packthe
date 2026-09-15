import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Eye,
  Search,
  Scale,
  FileSpreadsheet,
  Building,
  MapPin,
  Clock,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Violation, User, BoundingBox } from '../../types';

interface ViolationCenterProps {
  violations: Violation[];
  currentUser: User;
  onResolveViolation: (violationId: string, resolved: boolean) => void;
  onViewEvidence: (scanId: string, boundingBox?: BoundingBox) => void;
}

export const ViolationCenter: React.FC<ViolationCenterProps> = ({
  violations,
  currentUser,
  onResolveViolation,
  onViewEvidence,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = violations.filter((v) => {
    if (filterSeverity !== 'all' && v.severity !== filterSeverity) return false;
    if (filterStatus === 'unresolved' && v.resolved) return false;
    if (filterStatus === 'resolved' && !v.resolved) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.ruleCode.toLowerCase().includes(q) ||
        v.detectedValue.toLowerCase().includes(q) ||
        v.legalReference.toLowerCase().includes(q) ||
        v.expectedValue.toLowerCase().includes(q) ||
        v.recommendedAction.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = violations.filter((v) => v.severity === 'critical' && !v.resolved).length;
  const highCount = violations.filter((v) => v.severity === 'high' && !v.resolved).length;
  const resolvedCount = violations.filter((v) => v.resolved).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-700">Enforcement Action Docket</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Legal Metrology Act, 2009</span>
          </div>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Statutory Violation Center
          </h2>
          <p className="text-xs font-medium text-slate-600">
            Detected infractions against Legal Metrology (Packaged Commodities) Rules, 2011 with statutory penalty references.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
            {violations.filter((v) => !v.resolved).length} Active Infractions
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">Critical Infractions</span>
            <ShieldAlert className="h-4 w-4 text-rose-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">{criticalCount}</div>
          <div className="text-[11px] font-medium text-rose-600">Seizure / Section 36(1) notices</div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">High / Medium Infractions</span>
            <AlertTriangle className="h-4 w-4 text-amber-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{highCount}</div>
          <div className="text-[11px] font-medium text-amber-600">Non-standard formats or units</div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Resolved / Compounded</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{resolvedCount}</div>
          <div className="text-[11px] font-medium text-emerald-600">Formal remediation registered</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by rule code (e.g. PCR-03), commodity, detected value, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 rounded p-0.5 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="unresolved">Active Only</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Violations List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-2xs">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <div className="mt-2 text-sm font-bold text-slate-800">No Violations Found</div>
            <p className="mt-1 text-xs text-slate-500">
              No statutory infractions match your current filter parameters.
            </p>
          </div>
        ) : (
          filtered.map((v, idx) => {
            const isResolved = v.resolved;
            return (
              <div
                key={v.id ? `${v.id}-${idx}` : `vc-viol-${idx}`}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  isResolved
                    ? 'border-slate-200 bg-slate-50/70 opacity-75'
                    : v.severity === 'critical'
                    ? 'border-rose-200 bg-white shadow-2xs hover:border-rose-300'
                    : 'border-slate-200 bg-white shadow-2xs hover:border-slate-300'
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                        {v.ruleCode}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          v.severity === 'critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : v.severity === 'high'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {v.severity} Severity
                      </span>
                      {isResolved && (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                          Remediated
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {v.scanId && (
                        <button
                          onClick={() => onViewEvidence(v.scanId, v.boundingBox)}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-600" />
                          <span>View Evidence</span>
                        </button>
                      )}

                      <button
                        onClick={() => onResolveViolation(v.id, !isResolved)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                          isResolved
                            ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{isResolved ? 'Re-open' : 'Mark Resolved'}</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-slate-900">{v.title}</h3>

                  <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-2">
                    <div>
                      <span className="font-semibold text-slate-500">Detected Label Value: </span>
                      <span className="font-mono font-bold text-rose-700">{v.detectedValue}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Statutory Requirement: </span>
                      <span className="font-medium text-slate-800">{v.expectedValue}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">{v.legalReference}</span>
                    </div>
                    <div className="font-medium text-blue-700">
                      Action: {v.recommendedAction}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
