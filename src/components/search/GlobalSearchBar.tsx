import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Package,
  Scale,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Camera,
  CheckCircle2,
  FileText,
  CornerDownLeft,
} from 'lucide-react';
import { Scan, ComplianceRule, Violation } from '../../types';

export interface GlobalSearchBarProps {
  scans: Scan[];
  rules: ComplianceRule[];
  violations: Violation[];
  onSelectScan: (scanId: string) => void;
  onSelectRule?: (ruleCode: string) => void;
  onSelectViolation?: (violationId: string) => void;
  onViewAllInRepository?: (query: string) => void;
  onStartScan?: () => void;
}

type SearchCategory = 'all' | 'products' | 'rules' | 'violations';

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  scans,
  rules,
  violations,
  onSelectScan,
  onSelectRule,
  onSelectViolation,
  onViewAllInRepository,
  onStartScan,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: Ctrl+K or Cmd+K or "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus mobile input when mobile modal opens
  useEffect(() => {
    if (mobileOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50);
    }
  }, [mobileOpen]);

  // Search Results Computation
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return {
        products: scans.slice(0, 4),
        rules: rules.slice(0, 3),
        violations: violations.slice(0, 2),
        isDefaultSuggestions: true,
      };
    }

    const matchedProducts = scans.filter((s) => {
      const inName = s.productName.toLowerCase().includes(trimmed);
      const inBrand = s.brand.toLowerCase().includes(trimmed);
      const inCategory = s.category.toLowerCase().includes(trimmed);
      const inBarcode = s.barcode ? s.barcode.toLowerCase().includes(trimmed) : false;
      const inLocation = s.inspectionLocation ? s.inspectionLocation.toLowerCase().includes(trimmed) : false;
      const inVerdict = s.verdict.toLowerCase().includes(trimmed);
      const inDeclarations = s.declarations.some(
        (d) =>
          d.detectedValue.toLowerCase().includes(trimmed) ||
          d.label.toLowerCase().includes(trimmed) ||
          d.ruleCode.toLowerCase().includes(trimmed)
      );
      return inName || inBrand || inCategory || inBarcode || inLocation || inVerdict || inDeclarations;
    });

    const matchedRules = rules.filter((r) => {
      return (
        r.ruleCode.toLowerCase().includes(trimmed) ||
        r.declarationName.toLowerCase().includes(trimmed) ||
        r.description.toLowerCase().includes(trimmed) ||
        r.legalMetrologyReference.toLowerCase().includes(trimmed) ||
        r.expectedFormat.toLowerCase().includes(trimmed)
      );
    });

    const matchedViolations = violations.filter((v) => {
      return (
        v.title.toLowerCase().includes(trimmed) ||
        v.ruleCode.toLowerCase().includes(trimmed) ||
        v.detectedValue.toLowerCase().includes(trimmed) ||
        v.legalReference.toLowerCase().includes(trimmed) ||
        v.recommendedAction.toLowerCase().includes(trimmed)
      );
    });

    return {
      products: matchedProducts,
      rules: matchedRules,
      violations: matchedViolations,
      isDefaultSuggestions: false,
    };
  }, [query, scans, rules, violations]);

  const totalResultsCount =
    searchResults.products.length + searchResults.rules.length + searchResults.violations.length;

  // Flatten active items for keyboard navigation
  const visibleItems = useMemo(() => {
    const items: Array<{
      type: 'product' | 'rule' | 'violation' | 'action';
      id: string;
      title: string;
      onSelect: () => void;
    }> = [];

    if (activeCategory === 'all' || activeCategory === 'products') {
      searchResults.products.forEach((p) => {
        items.push({
          type: 'product',
          id: p.id,
          title: p.productName,
          onSelect: () => {
            onSelectScan(p.id);
            setIsOpen(false);
            setMobileOpen(false);
          },
        });
      });
    }

    if (activeCategory === 'all' || activeCategory === 'rules') {
      searchResults.rules.forEach((r) => {
        items.push({
          type: 'rule',
          id: r.id,
          title: `${r.ruleCode}: ${r.declarationName}`,
          onSelect: () => {
            onSelectRule?.(r.ruleCode);
            setIsOpen(false);
            setMobileOpen(false);
          },
        });
      });
    }

    if (activeCategory === 'all' || activeCategory === 'violations') {
      searchResults.violations.forEach((v) => {
        items.push({
          type: 'violation',
          id: v.id,
          title: v.title,
          onSelect: () => {
            onSelectViolation?.(v.id);
            setIsOpen(false);
            setMobileOpen(false);
          },
        });
      });
    }

    return items;
  }, [searchResults, activeCategory, onSelectScan, onSelectRule, onSelectViolation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (visibleItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + visibleItems.length) % (visibleItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (visibleItems[selectedIndex]) {
        visibleItems[selectedIndex].onSelect();
      } else if (query.trim() && onViewAllInRepository) {
        onViewAllInRepository(query);
        setIsOpen(false);
        setMobileOpen(false);
      }
    }
  };

  const handleSelectSuggestion = (sampleTerm: string) => {
    setQuery(sampleTerm);
    inputRef.current?.focus();
    mobileInputRef.current?.focus();
  };

  const renderDropdownBody = () => (
    <div className="flex max-h-[70vh] flex-col overflow-y-auto">
      {/* Search Header & Category Filters */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50/95 px-3 py-2 text-[11px] backdrop-blur-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-lg px-2.5 py-1 font-bold transition-colors whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Results ({totalResultsCount})
          </button>
          <button
            onClick={() => setActiveCategory('products')}
            className={`rounded-lg px-2.5 py-1 font-bold transition-colors whitespace-nowrap ${
              activeCategory === 'products'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Commodities ({searchResults.products.length})
          </button>
          <button
            onClick={() => setActiveCategory('rules')}
            className={`rounded-lg px-2.5 py-1 font-bold transition-colors whitespace-nowrap ${
              activeCategory === 'rules'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Statutory Rules ({searchResults.rules.length})
          </button>
          {searchResults.violations.length > 0 && (
            <button
              onClick={() => setActiveCategory('violations')}
              className={`rounded-lg px-2.5 py-1 font-bold transition-colors whitespace-nowrap ${
                activeCategory === 'violations'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Violations ({searchResults.violations.length})
            </button>
          )}
        </div>

        {query && (
          <button
            onClick={() => setQuery('')}
            className="text-[10px] font-semibold text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Suggested Search Pills when query is empty */}
      {searchResults.isDefaultSuggestions && (
        <div className="border-b border-slate-100 bg-blue-50/50 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Popular Statutory Queries</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              'Jasmine Green Tea',
              'Tata Salt',
              'Fortune Sunflower Oil',
              'PCR-05 MRP',
              'PCR-03 Net Quantity',
              'PCR-04 Date of Packing',
              'Barcode',
              '₹69.00',
            ].map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => handleSelectSuggestion(pill)}
                className="rounded-lg border border-blue-200/80 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50/80 hover:text-blue-700 transition-colors"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results Fallback */}
      {totalResultsCount === 0 && (
        <div className="p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-800">
            No packaging records found for &ldquo;{query}&rdquo;
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Try searching by brand name, generic commodity, barcode number, or PCR clause code (e.g., PCR-01 to PCR-09).
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => handleSelectSuggestion('Tea')}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Search &ldquo;Tea&rdquo;
            </button>
            <button
              onClick={() => handleSelectSuggestion('PCR-05')}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Search &ldquo;PCR-05&rdquo;
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: PACKAGED COMMODITIES */}
      {(activeCategory === 'all' || activeCategory === 'products') &&
        searchResults.products.length > 0 && (
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3 text-blue-600" />
                Packaged Commodities ({searchResults.products.length})
              </span>
              {onViewAllInRepository && (
                <button
                  onClick={() => {
                    onViewAllInRepository(query);
                    setIsOpen(false);
                    setMobileOpen(false);
                  }}
                  className="font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  View in Repository <ArrowRight className="h-2.5 w-2.5" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              {searchResults.products.map((scan, sIdx) => {
                const isSelected =
                  visibleItems[selectedIndex]?.type === 'product' &&
                  visibleItems[selectedIndex]?.id === scan.id;

                const mrpDec = scan.declarations.find((d) => d.type === 'mrp');
                const netQtyDec = scan.declarations.find((d) => d.type === 'net_quantity');

                return (
                  <div
                    key={`search-prod-${scan.id}-${sIdx}`}
                    onClick={() => {
                      onSelectScan(scan.id);
                      setIsOpen(false);
                      setMobileOpen(false);
                    }}
                    className={`group flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 ring-1 ring-blue-300'
                        : 'hover:bg-slate-50 hover:ring-1 hover:ring-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 flex items-center justify-center p-0.5">
                        <img
                          src={scan.imageUrl}
                          alt={scan.productName}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-bold text-slate-900 group-hover:text-blue-600">
                            {scan.productName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate mt-0.5">
                          <span className="font-semibold text-slate-700">{scan.brand}</span>
                          <span>•</span>
                          <span>{scan.category}</span>
                          {scan.barcode && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-slate-500">
                                {scan.barcode}
                              </span>
                            </>
                          )}
                        </div>
                        {(mrpDec || netQtyDec) && (
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                            {mrpDec && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-slate-700 font-medium">
                                {mrpDec.detectedValue}
                              </span>
                            )}
                            {netQtyDec && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-slate-700 font-medium">
                                {netQtyDec.detectedValue}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1 ml-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${
                          scan.verdict === 'COMPLIANT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : scan.verdict === 'NON-COMPLIANT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {scan.verdict} ({scan.complianceScore}%)
                      </span>
                      <span className="text-[10px] text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
                        Inspect <ArrowRight className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* SECTION 2: STATUTORY LEGAL RULES */}
      {(activeCategory === 'all' || activeCategory === 'rules') &&
        searchResults.rules.length > 0 && (
          <div className="border-t border-slate-100 p-2">
            <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Scale className="h-3 w-3 text-indigo-600" />
              Legal Metrology PCR 2011 Clauses ({searchResults.rules.length})
            </div>

            <div className="space-y-1">
              {searchResults.rules.map((rule, rIdx) => {
                const isSelected =
                  visibleItems[selectedIndex]?.type === 'rule' &&
                  visibleItems[selectedIndex]?.id === rule.id;

                return (
                  <div
                    key={`search-rule-${rule.id}-${rIdx}`}
                    onClick={() => {
                      onSelectRule?.(rule.ruleCode);
                      setIsOpen(false);
                      setMobileOpen(false);
                    }}
                    className={`group flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 ring-1 ring-indigo-300'
                        : 'hover:bg-slate-50 hover:ring-1 hover:ring-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-800">
                          {rule.ruleCode}
                        </span>
                        <span className="truncate text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                          {rule.declarationName}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                            rule.severity === 'critical'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rule.severity}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                        {rule.legalMetrologyReference} — {rule.description}
                      </p>
                    </div>

                    <div className="shrink-0 ml-2">
                      <span className="text-[10px] font-semibold text-indigo-600 group-hover:underline flex items-center gap-0.5">
                        Rule Details <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* SECTION 3: VIOLATIONS DOCKET */}
      {(activeCategory === 'all' || activeCategory === 'violations') &&
        searchResults.violations.length > 0 && (
          <div className="border-t border-slate-100 p-2">
            <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-rose-600" />
              Flagged Violations ({searchResults.violations.length})
            </div>

            <div className="space-y-1">
              {searchResults.violations.map((violation, vIdx) => {
                const isSelected =
                  visibleItems[selectedIndex]?.type === 'violation' &&
                  visibleItems[selectedIndex]?.id === violation.id;

                return (
                  <div
                    key={`search-viol-${violation.id}-${vIdx}`}
                    onClick={() => {
                      onSelectViolation?.(violation.id);
                      setIsOpen(false);
                      setMobileOpen(false);
                    }}
                    className={`group flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition-all ${
                      isSelected
                        ? 'bg-rose-50/80 ring-1 ring-rose-300'
                        : 'hover:bg-slate-50 hover:ring-1 hover:ring-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-800">
                          {violation.ruleCode}
                        </span>
                        <span className="truncate text-xs font-bold text-slate-900 group-hover:text-rose-600">
                          {violation.title}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Detected: <span className="font-semibold text-rose-600">{violation.detectedValue}</span> •{' '}
                        {violation.recommendedAction}
                      </p>
                    </div>

                    <div className="shrink-0 ml-2">
                      <span className="text-[10px] font-semibold text-rose-600 group-hover:underline flex items-center gap-0.5">
                        Notice <ArrowRight className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* QUICK SYSTEM SHORTCUTS */}
      <div className="border-t border-slate-100 bg-slate-50/70 p-2.5 text-[11px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-slate-500 text-[10px]">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px]">↑↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px]">↵</kbd> to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px]">ESC</kbd> to close
            </span>
          </div>

          {onStartScan && (
            <button
              onClick={() => {
                onStartScan();
                setIsOpen(false);
                setMobileOpen(false);
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Launch Live OCR Inspection</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SEARCH BAR */}
      <div ref={containerRef} className="relative w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search commodities, brands, barcodes, or PCR rules..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-10 pr-16 text-xs text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />

          {/* Quick Clear Button or Keyboard Shortcut */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 sm:inline-block shadow-2xs">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* DESKTOP RESULTS DROPDOWN */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
            {renderDropdownBody()}
          </div>
        )}
      </div>

      {/* MOBILE SEARCH TRIGGER BUTTON (visible on mobile / tablet) */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
          title="Search Packaged Commodities"
        >
          <Search className="h-4 w-4" />
          {query && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
          )}
        </button>
      </div>

      {/* MOBILE SEARCH MODAL OVERLAY */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 p-3 backdrop-blur-xs lg:hidden">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[85vh]">
            {/* Mobile Search Header */}
            <div className="flex items-center gap-2 border-b border-slate-200 p-3">
              <Search className="h-4 w-4 text-blue-600 shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commodities, brands, barcodes, or PCR rules..."
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Done
              </button>
            </div>

            {/* Mobile Dropdown Body */}
            {renderDropdownBody()}
          </div>
        </div>
      )}
    </>
  );
};
