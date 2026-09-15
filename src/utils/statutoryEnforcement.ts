import { Violation, ComplianceVerdict } from '../types';

export interface StatutoryActionOrder {
  orderTitle: string;
  legalActSection: string;
  urgency: 'ROUTINE' | 'ELEVATED' | 'CRITICAL_URGENT';
  statutoryDirective: string;
  penaltySection: string;
  penaltiesSummary: string;
  nextSteps: string[];
}

export function deriveStatutoryActionOrder(
  verdict: ComplianceVerdict,
  violations: Violation[] = []
): StatutoryActionOrder {
  const criticals = violations.filter((v) => v.severity === 'critical');

  if (verdict === 'COMPLIANT' && violations.length === 0) {
    return {
      orderTitle: 'STATUTORY CONFORMITY CERTIFICATION GRANTED',
      legalActSection: 'Rule 6 & Rule 11, Legal Metrology (Packaged Commodities) Rules, 2011',
      urgency: 'ROUTINE',
      statutoryDirective:
        'The inspected packaged commodity conforms with all mandatory declarations under Rule 6(1) and Fourth Schedule specifications. Authorized for unrestricted pan-India commercial circulation.',
      penaltySection: 'N/A (Full Statutory Compliance Verified)',
      penaltiesSummary: 'No penalty or compounding proceedings indicated.',
      nextSteps: [
        'Dossier registered in National Metrology Database.',
        'Routine surveillance schedule assigned.',
      ],
    };
  }

  if (criticals.length > 0) {
    return {
      orderTitle: 'STATUTORY SHOW-CAUSE & SEIZURE DIRECTIVE',
      legalActSection: 'Section 15 & Section 36(1), Legal Metrology Act, 2009',
      urgency: 'CRITICAL_URGENT',
      statutoryDirective:
        'Critical infractions identified regarding mandatory net quantity or origin declarations. The manufacturer/packer is directed to explain within 7 days why compounding or prosecution should not be initiated.',
      penaltySection: 'Section 36(1) of LM Act, 2009',
      penaltiesSummary: 'Fine up to ₹25,000 for first offence, ₹50,000 for second offence, or imprisonment up to 1 year.',
      nextSteps: [
        'Issue formal statutory show-cause notice under Rule 6.',
        'Batch inventory hold notice communicated to distributor.',
      ],
    };
  }

  return {
    orderTitle: 'STATUTORY RECTIFICATION & COMPOUNDING NOTICE',
    legalActSection: 'Section 18 & Section 48, Legal Metrology Act, 2009',
    urgency: 'ELEVATED',
    statutoryDirective:
      'Non-standard formatting or missing secondary declarations detected. Notice issued for compounding under Section 48 or remediation of retail packaging.',
    penaltySection: 'Section 36(2) of LM Act, 2009',
    penaltiesSummary: 'Compounding fine up to ₹10,000 per violation clause.',
    nextSteps: [
      'Remediation timeline: 14 business days to affix corrective sticker labels.',
      'Re-inspection scheduled with field inspectorate.',
    ],
  };
}
