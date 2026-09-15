import React, { useState } from 'react';
import {
  Scale,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Shield,
  Trash2,
  Edit2,
  ExternalLink,
  X,
} from 'lucide-react';
import { ComplianceRule, DeclarationType, ViolationSeverity } from '../../types';

interface RulesManagerProps {
  rules: ComplianceRule[];
  onToggleRule: (ruleId: string, active: boolean) => void;
  onSaveRule: (rule: Partial<ComplianceRule>) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
}

export const RulesManager: React.FC<RulesManagerProps> = ({
  rules,
  onToggleRule,
  onSaveRule,
  onDeleteRule,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState<Partial<ComplianceRule>>({
    ruleCode: 'PCR-09',
    declarationName: '',
    declarationType: 'commodity_name',
    required: true,
    validationType: 'presence',
    expectedFormat: '',
    severity: 'high',
    description: '',
    legalMetrologyReference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    active: true,
  });

  const filteredRules = rules.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.ruleCode.toLowerCase().includes(q) ||
      r.declarationName.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.legalMetrologyReference.toLowerCase().includes(q) ||
      r.expectedFormat.toLowerCase().includes(q) ||
      r.severity.toLowerCase().includes(q)
    );
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.declarationName || !newRule.ruleCode) return;
    await onSaveRule({
      ...newRule,
      id: `rule-${Date.now()}`,
    });
    setShowAddModal(false);
    setNewRule({
      ruleCode: `PCR-0${rules.length + 2}`,
      declarationName: '',
      declarationType: 'commodity_name',
      required: true,
      validationType: 'presence',
      expectedFormat: '',
      severity: 'high',
      description: '',
      legalMetrologyReference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      active: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700">Statutory Specifications</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Legal Metrology Act, 2009</span>
          </div>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Packaged Commodities Rules (PCR) 2011 Master Standards
          </h2>
          <p className="text-xs font-medium text-slate-600">
            Enforced mandatory declarations, unit standards, and verification algorithms under Rule 6(1).
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Statutory Rule</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search statutory rules by clause code, declaration title, or legal text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 rounded p-0.5 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Rules Table */}
      {filteredRules.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900">No matching statutory rules found</h3>
          <p className="mt-1 text-xs text-slate-500">
            No Legal Metrology rules match &ldquo;<span className="font-semibold text-slate-700">{search}</span>&rdquo;.
          </p>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setSearch('')}
              className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shadow-sm"
            >
              Clear Search
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className={`rounded-2xl border bg-white p-5 shadow-2xs transition-all ${
              rule.active ? 'border-slate-200 hover:border-blue-300' : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white">
                  {rule.ruleCode}
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{rule.declarationName}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={`rounded px-1.5 py-0.5 font-bold uppercase ${
                        rule.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : rule.severity === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rule.severity} Severity
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">
                      Validation: {rule.validationType}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-500">
                      {rule.legalMetrologyReference}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => onToggleRule(rule.id, !rule.active)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    rule.active
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {rule.active ? 'Active Standard' : 'Disabled'}
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600">{rule.description}</p>

            <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-700 font-mono">
              <span className="font-bold text-slate-500">Expected Standard Pattern: </span>
              {rule.expectedFormat}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900">Add New Statutory Rule</h3>
            <p className="text-xs text-slate-500">
              Configure a statutory validation rule for packaging inspections.
            </p>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700">Clause Code</label>
                <input
                  type="text"
                  required
                  value={newRule.ruleCode}
                  onChange={(e) => setNewRule({ ...newRule, ruleCode: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">Declaration Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Best Before / Expiry Date"
                  value={newRule.declarationName}
                  onChange={(e) => setNewRule({ ...newRule, declarationName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700">Severity</label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as ViolationSeverity })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700">Validation Method</label>
                  <select
                    value={newRule.validationType}
                    onChange={(e) => setNewRule({ ...newRule, validationType: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900"
                  >
                    <option value="presence">Presence (Compulsory)</option>
                    <option value="unit">Metric Unit Validation</option>
                    <option value="date_validity">Date Format Validation</option>
                    <option value="format">Structured Pattern</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Description & Statutory Purpose</label>
                <textarea
                  rows={2}
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-slate-900"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 font-bold text-white hover:bg-blue-800"
                >
                  Save Standard Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
