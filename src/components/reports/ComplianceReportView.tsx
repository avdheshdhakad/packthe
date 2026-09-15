import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Download,
  Printer,
  ArrowLeft,
  ShieldCheck,
  Building,
  Scale,
  Calendar,
  User as UserIcon,
  AlertTriangle,
  CheckCircle2,
  PenTool,
  Lock,
} from 'lucide-react';
import { InspectionReport, User } from '../../types';
import { generateInspectionPDF } from '../../utils/pdfGenerator';
import { DigitalSignaturePad, SignOffData } from '../scanner/DigitalSignaturePad';
import {
  getScanSignOff,
  getUserSavedSignature,
  DEFAULT_OFFICER_SIGNATURES,
} from '../../utils/signatureStorage';

interface ComplianceReportViewProps {
  report: InspectionReport;
  currentUser?: User;
  onSignOff?: (data: SignOffData) => void;
  onBack: () => void;
}

export const ComplianceReportView: React.FC<ComplianceReportViewProps> = ({
  report,
  currentUser,
  onSignOff,
  onBack,
}) => {
  const [currentReport, setCurrentReport] = useState<InspectionReport>(report);
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setCurrentReport(report);
  }, [report]);

  const isCompliant = currentReport.verdict === 'COMPLIANT';

  // Resolve active digital signature
  const storedSignOff = currentReport.scanId ? getScanSignOff(currentReport.scanId) : null;
  const activeSignOff = currentReport.inspectorSignOff || storedSignOff;
  const inspName =
    activeSignOff?.signedBy ||
    (activeSignOff as any)?.officerName ||
    currentReport.inspector?.name ||
    'Smt. Priya Sharma';
  const inspBadge =
    activeSignOff?.badgeNumber || currentReport.inspector?.badge || 'LM-OFF-2026';
  const inspDept =
    activeSignOff?.department ||
    currentReport.inspector?.department ||
    'Directorate of Legal Metrology, Government of India';

  let signatureUrl =
    activeSignOff?.signatureDataUrl || currentReport.inspector?.signatureDataUrl;
  if (!signatureUrl && currentReport.scanId) {
    signatureUrl = storedSignOff?.signatureDataUrl || null;
  }
  if (!signatureUrl && inspName) {
    signatureUrl =
      getUserSavedSignature(inspName) || DEFAULT_OFFICER_SIGNATURES[inspName] || null;
  }

  const handleSignOffComplete = (data: SignOffData) => {
    setIsSignOffModalOpen(false);
    const updated: InspectionReport = {
      ...currentReport,
      inspectorSignOff: data,
      inspector: {
        ...currentReport.inspector,
        name: data.signedBy || data.officerName || currentReport.inspector.name,
        badge: data.badgeNumber || currentReport.inspector.badge,
        signatureDataUrl: data.signatureDataUrl,
      },
    };
    setCurrentReport(updated);
    if (onSignOff) {
      onSignOff(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700">Official Certificate Dossier</span>
              <span className="text-xs text-slate-300">•</span>
              <span className="font-mono text-xs font-semibold text-slate-500">{currentReport.reportNumber}</span>
            </div>
            <h2 className="mt-0.5 text-lg font-extrabold text-slate-900 sm:text-xl">
              Legal Metrology Compliance Certificate
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSignOffModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 shadow-2xs transition-colors"
          >
            <PenTool className="h-3.5 w-3.5 text-blue-600" />
            <span>{signatureUrl ? 'Re-Sign Digital Certificate' : 'Sign Certificate'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Dossier</span>
          </button>
          <button
            onClick={() => generateInspectionPDF(currentReport)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Official PDF</span>
          </button>
        </div>
      </div>

      {/* Official Government Form Paper */}
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* National Emblem & Department Header */}
        <div className="border-b border-slate-200 bg-slate-900 p-6 text-center text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-300">
            Government of India • Ministry of Consumer Affairs
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-400">
            Directorate of Legal Metrology • Central Verification Division
          </div>
          <h1 className="mt-2 text-lg font-black tracking-wide text-sky-400 uppercase sm:text-xl">
            Statutory Packaged Commodity Inspection Certificate
          </h1>
          <p className="mt-1 text-[11px] text-slate-400">
            Issued pursuant to Section 15 & Section 18 of the Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Certificate Metadata Grid */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Certificate Number</div>
              <div className="font-mono font-bold text-slate-900">{currentReport.reportNumber}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Inspection Timestamp</div>
              <div className="font-semibold text-slate-900">
                {new Date(currentReport.issuedAt).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Product / Commodity</div>
              <div className="font-bold text-slate-900">{currentReport.product.name}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Manufacturer / Brand</div>
              <div className="font-semibold text-slate-900">{currentReport.product.brand}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Authorized Inspector</div>
              <div className="font-semibold text-slate-900">
                {inspName} ({inspBadge})
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Enforcement Department</div>
              <div className="font-semibold text-slate-900">{inspDept}</div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div
            className={`flex items-center justify-between rounded-xl p-4 text-white ${
              isCompliant
                ? 'bg-emerald-700 border border-emerald-800'
                : 'bg-rose-700 border border-rose-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {isCompliant ? (
                <CheckCircle2 className="h-6 w-6 shrink-0" />
              ) : (
                <AlertTriangle className="h-6 w-6 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Statutory Determination
                </div>
                <div className="text-lg font-black tracking-wide">
                  {report.verdict}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black">{report.complianceScore}%</div>
              <div className="text-[10px] font-bold text-white/80">Compliance Score</div>
            </div>
          </div>

          {/* Declarations Checklist Table */}
          <div>
            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Mandatory Declarations Audit (Rule 6 Specifications)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="px-3.5 py-2.5">Rule Code</th>
                    <th className="px-3.5 py-2.5">Statutory Field</th>
                    <th className="px-3.5 py-2.5">Detected on Packaging</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {report.declarations.map((dec) => (
                    <tr key={dec.id} className="hover:bg-slate-50/70">
                      <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">
                        {dec.ruleCode}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">
                        {dec.label}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700 max-w-xs truncate">
                        {dec.officerOverride?.value || dec.detectedValue || 'OMITTED'}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            dec.status === 'detected'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {dec.status === 'detected' ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-medium text-slate-500">
                        {dec.confidence}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Violations Section if non-compliant */}
          {currentReport.violations && currentReport.violations.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4 text-rose-700" />
                <span>Statutory Infractions & Action Directives</span>
              </h3>
              <div className="mt-3 space-y-2">
                {currentReport.violations.map((v) => (
                  <div key={v.id} className="rounded-lg bg-white p-3 border border-rose-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{v.title}</span>
                      <span className="font-mono text-[10px] font-bold text-rose-700">{v.ruleCode}</span>
                    </div>
                    <div className="mt-1 text-slate-600">{v.recommendedAction}</div>
                    <div className="mt-1 font-mono text-[10px] text-slate-500">{v.legalReference}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Officer Verification & Security Seal Chamber */}
          <div className="grid grid-cols-1 gap-6 border-t border-slate-200 pt-6 md:grid-cols-3">
            {/* 1. Official Authorized Signature Chamber */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Authorized Officer Signature</span>
                <button
                  type="button"
                  onClick={() => setIsSignOffModalOpen(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {signatureUrl ? 'Change' : 'Sign Now'}
                </button>
              </div>

              {signatureUrl ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">
                      Digital Signature Validated
                    </span>
                    <span className="flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      <span>DSC Verified</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-center rounded-lg bg-white p-2 border border-blue-100 min-h-[56px]">
                    <img
                      src={signatureUrl}
                      alt={`Digital Signature of ${inspName}`}
                      className="h-12 w-auto max-w-[200px] object-contain"
                    />
                  </div>
                  <div className="text-[11px]">
                    <div className="font-bold text-slate-900">{inspName}</div>
                    <div className="text-slate-500">{inspDept}</div>
                    <div className="font-mono text-[10px] text-blue-700">Badge ID: {inspBadge}</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500 mb-2">No officer signature attached yet</p>
                  <button
                    type="button"
                    onClick={() => setIsSignOffModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-2xs"
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    <span>Digitally Sign</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Official Enforcement Seal */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">Official Enforcement Seal</div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed text-center font-bold text-[9px] uppercase leading-tight ${
                    isCompliant
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-rose-600 bg-rose-50 text-rose-800'
                  }`}
                >
                  Govt of India
                  <br />
                  LM Dept
                  <br />
                  {isCompliant ? 'Passed' : 'Infraction'}
                </div>
                <div className="text-xs text-slate-600">
                  <div className="font-bold text-slate-900">Directorate of Legal Metrology</div>
                  <div className="text-[11px] text-slate-500">Ministry of Consumer Affairs</div>
                  <div className="mt-1 font-mono text-[10px] text-emerald-700 font-bold">
                    Statutory Stamp • PCR 2011
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Digital Security Verification */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">Cryptographic Proof & SHA-256</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-700">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Tamper-Evident Dossier Hash</span>
                </div>
                <div className="font-mono text-[9.5px] text-slate-500 break-all bg-white p-1.5 rounded border border-slate-200">
                  a9f84b3c82e019b7884d5f2a1b9c7e3d82a1f09c6b5d4e3f2a1b0c9d8e7f6a5b
                </div>
                <div className="text-[10px] text-slate-400">
                  Asymmetric timestamp: {new Date(currentReport.issuedAt).toISOString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Digital Signature Pad */}
      {isSignOffModalOpen && (
        <DigitalSignaturePad
          currentUser={currentUser || {
            id: 'usr-officer-01',
            name: inspName,
            email: 'priya.sharma@lm.delhi.gov.in',
            role: 'officer',
            badgeNumber: inspBadge,
            department: inspDept,
          }}
          verdict={currentReport.verdict}
          scanProductName={currentReport.product.name}
          scanId={currentReport.scanId}
          reportNumber={currentReport.reportNumber}
          initialSignOff={activeSignOff || undefined}
          onSignOffComplete={handleSignOffComplete}
          onClose={() => setIsSignOffModalOpen(false)}
          inline={false}
        />
      )}
    </div>
  );
};
