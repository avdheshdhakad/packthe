import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  Filter,
  Eye,
  FileCheck2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Package,
  X,
} from 'lucide-react';
import { Scan } from '../../types';

interface ProductRepositoryProps {
  scans: Scan[];
  onSelectScan: (scanId: string) => void;
  onOpenReport: (scanId: string) => void;
  initialSearch?: string;
}

export const ProductRepository: React.FC<ProductRepositoryProps> = ({
  scans,
  onSelectScan,
  onOpenReport,
  initialSearch = '',
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [verdictFilter, setVerdictFilter] = useState('all');

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const categories = Array.from(new Set(scans.map((s) => s.category).filter(Boolean)));

  const filteredScans = scans.filter((s) => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (verdictFilter !== 'all' && s.verdict !== verdictFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const inName = s.productName.toLowerCase().includes(q);
      const inBrand = s.brand.toLowerCase().includes(q);
      const inBarcode = s.barcode ? s.barcode.toLowerCase().includes(q) : false;
      const inCategory = s.category ? s.category.toLowerCase().includes(q) : false;
      const inVerdict = s.verdict.toLowerCase().includes(q);
      const inLocation = s.inspectionLocation ? s.inspectionLocation.toLowerCase().includes(q) : false;
      const inDeclarations = s.declarations.some(
        (d) =>
          d.detectedValue.toLowerCase().includes(q) ||
          d.label.toLowerCase().includes(q) ||
          d.ruleCode.toLowerCase().includes(q)
      );
      return inName || inBrand || inBarcode || inCategory || inVerdict || inLocation || inDeclarations;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700">Packaging Archives</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Legal Metrology Central Registry</span>
          </div>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Inspected Commodity Repository
          </h2>
          <p className="text-xs font-medium text-slate-600">
            Catalog of inspected packaged commodities, declarations, and issued statutory certificates.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700">
            {scans.length} Commodities Cataloged
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, brand, barcode, MRP, net quantity, or location..."
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

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="all">All Verdicts</option>
            <option value="COMPLIANT">Compliant Only</option>
            <option value="NON-COMPLIANT">Non-Compliant Only</option>
          </select>
        </div>
      </div>

      {/* Commodities Grid */}
      {filteredScans.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900">No matching commodities found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {search ? (
              <>No packaging records match your query &ldquo;<span className="font-semibold text-slate-700">{search}</span>&rdquo; and selected filters.</>
            ) : (
              'No packaging records match your selected filters.'
            )}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setVerdictFilter('all');
              }}
              className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shadow-sm"
            >
              Reset Search & Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredScans.map((s) => {
            const isCompliant = s.verdict === 'COMPLIANT';
            return (
              <div
                key={s.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all"
              >
                <div>
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      src={s.imageUrl}
                      alt={s.productName}
                      className="h-full w-full object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute right-2 top-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase shadow-xs ${
                          isCompliant
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isCompliant ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        <span>{s.complianceScore}% {isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs font-extrabold text-slate-900 line-clamp-1">
                      {s.productName}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500">
                      {s.brand} • {s.category}
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                    <div>Package: {s.packagingType}</div>
                    <div>Inspection: {s.inspectionLocation || 'Central Zone'}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <button
                    onClick={() => onSelectScan(s.id)}
                    className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Inspect Label</span>
                  </button>

                  <button
                    onClick={() => onOpenReport(s.id)}
                    className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    <span>Certificate</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
