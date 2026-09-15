import { Declaration, Violation } from '../types';

export interface NetQuantityValidationResult {
  isValid: boolean;
  isIllegalAbbreviation: boolean;
  isCount: boolean;
  isMetric: boolean;
  detectedText: string;
  quantityNumber?: number;
  unit?: string;
  status: 'detected' | 'invalid' | 'low_confidence' | 'missing';
  remarks: string;
}

export interface MrpValidationResult {
  isValid: boolean;
  hasPrice: boolean;
  hasCurrencySymbol: boolean;
  hasTaxInclusivity: boolean;
  price?: number;
  status: 'detected' | 'invalid' | 'low_confidence' | 'missing';
  remarks: string;
}

/**
 * Validates Net Quantity declarations against Rule 6(1)(c) & Rule 11
 * of the Legal Metrology (Packaged Commodities) Rules, 2011.
 *
 * CRITICAL STATUTORY RULES:
 * 1. Commodities sold by weight: 'g' (gram), 'kg' (kilogram).
 * 2. Commodities sold by volume: 'ml' or 'mL' (millilitre), 'l' or 'L' (litre).
 * 3. Commodities sold by measure: 'm' (metre), 'cm' (centimetre).
 * 4. Commodities sold by count/number (e.g. tablets, capsules, bottles, napkins, items):
 *    Under Rule 6(1)(c) Proviso & Rule 11, the statutory symbols are 'N' (Number) or 'U' (Unit).
 *    Examples: "60N", "60 N", "10 N", "30 N", "100 N", "1 N", "1 U" are 100% COMPLIANT.
 * 5. Prohibited illegal abbreviations: "gms", "gm", "kgs", "ltr", "ltrs", "mls".
 */
export function validateNetQuantity(rawText: string = ''): NetQuantityValidationResult {
  const text = (rawText || '').trim();
  if (!text || text === 'NOT FOUND' || text === 'Not Detected') {
    return {
      isValid: false,
      isIllegalAbbreviation: false,
      isCount: false,
      isMetric: false,
      detectedText: text,
      status: 'missing',
      remarks: 'Net quantity declaration missing on scanned label.',
    };
  }

  // Check for prohibited non-standard unit abbreviations under Rule 11
  // (e.g. "gms", "gm", "kgs", "ltr", "ltrs", "mls")
  const illegalMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(gms|gm|kgs|ltr|ltrs|mls)\b/i);
  if (illegalMatch) {
    return {
      isValid: false,
      isIllegalAbbreviation: true,
      isCount: false,
      isMetric: false,
      detectedText: text,
      quantityNumber: parseFloat(illegalMatch[1]),
      unit: illegalMatch[2],
      status: 'invalid',
      remarks: `Illegal non-standard unit abbreviation "${illegalMatch[2]}" prohibited under Rule 11 of Legal Metrology (Packaged Commodities) Rules, 2011. Standard SI symbol is "${illegalMatch[2].toLowerCase().startsWith('gm') ? 'g' : illegalMatch[2].toLowerCase().startsWith('kg') ? 'kg' : 'l'}".`,
    };
  }

  // 1. Statutory Count / Number: e.g. "60N", "60 N", "10 N", "30N", "100 N", "1 U"
  // Rule 6(1)(c) Proviso and Rule 11 mandate 'N' or 'U' for commodities sold by number.
  const countMatch =
    text.match(/\b(\d+)\s*([NU])\b/i) ||
    text.match(/(\d+)\s*([NU])(?:\s|$|[,.-])/i) ||
    text.match(/\b(\d+)\s*(tablets?|capsules?|units?|pieces?|wipes?|sheets?)\b/i);

  if (countMatch) {
    const qty = parseInt(countMatch[1], 10);
    const unit = countMatch[2].toUpperCase();
    const isStatutorySymbol = unit === 'N' || unit === 'U';

    return {
      isValid: true,
      isIllegalAbbreviation: false,
      isCount: true,
      isMetric: false,
      detectedText: text,
      quantityNumber: qty,
      unit: isStatutorySymbol ? unit : 'N',
      status: 'detected',
      remarks: isStatutorySymbol
        ? `Standard count unit '${unit}' (Number of commodities) verified under Rule 6(1)(c) & Rule 11 of Legal Metrology Rules, 2011.`
        : `Count declared as ${qty} ${countMatch[2]}. Note: Rule 11 recommends official symbol 'N' or 'U'.`,
    };
  }

  // 2. Standard Metric SI Units: g, kg, ml, l, cm, m
  const metricMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(g|kg|ml|l|cm|m)\b/i) ||
    text.match(/\b(\d+(?:\.\d+)?)\s*(gram|grams|kilogram|kilograms|millilitre|millilitres|litre|litres|liter)\b/i);

  if (metricMatch) {
    const qty = parseFloat(metricMatch[1]);
    const rawUnit = metricMatch[2].toLowerCase();
    let normUnit = rawUnit;
    if (rawUnit.startsWith('gram')) normUnit = 'g';
    else if (rawUnit.startsWith('kilo')) normUnit = 'kg';
    else if (rawUnit.startsWith('milli')) normUnit = 'ml';
    else if (rawUnit.startsWith('lit')) normUnit = 'l';

    return {
      isValid: true,
      isIllegalAbbreviation: false,
      isCount: false,
      isMetric: true,
      detectedText: text,
      quantityNumber: qty,
      unit: normUnit,
      status: 'detected',
      remarks: `Standard metric SI unit '${normUnit}' verified under Rule 6(1)(c) & Eleventh Schedule of Legal Metrology Rules, 2011.`,
    };
  }

  // If text has "net quantity" or "net qty" followed by a number
  const looseMatch = text.match(/(?:net\s*(?:quantity|qty|wt|weight)|qty)\s*[:.-]?\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/i);
  if (looseMatch) {
    const num = parseFloat(looseMatch[1]);
    const unit = (looseMatch[2] || '').trim();
    if (unit && /^(n|u|g|kg|ml|l|m|cm)$/i.test(unit)) {
      return {
        isValid: true,
        isIllegalAbbreviation: false,
        isCount: /^[nu]$/i.test(unit),
        isMetric: /^[g|kg|ml|l|m|cm]$/i.test(unit),
        detectedText: text,
        quantityNumber: num,
        unit: unit.toUpperCase(),
        status: 'detected',
        remarks: `Standard metric/count unit '${unit.toUpperCase()}' verified under Rule 6(1)(c).`,
      };
    }
  }

  return {
    isValid: false,
    isIllegalAbbreviation: false,
    isCount: false,
    isMetric: false,
    detectedText: text,
    status: 'low_confidence',
    remarks: 'Net quantity expression could not be definitively validated against standard SI or count units (g, kg, ml, l, N).',
  };
}

/**
 * Validates MRP declarations against Rule 6(1)(e) of the Legal Metrology
 * (Packaged Commodities) Rules, 2011.
 *
 * CRITICAL STATUTORY RULES:
 * 1. Maximum Retail Price must be declared in Indian currency: "₹" or "Rs."
 * 2. Mandatorily accompanied by exact phrase: "(inclusive of all taxes)" or "(incl. of all taxes)".
 */
export function validateMRP(rawText: string = ''): MrpValidationResult {
  const text = (rawText || '').trim();
  if (!text || text === 'NOT FOUND' || text === 'Not Detected') {
    return {
      isValid: false,
      hasPrice: false,
      hasCurrencySymbol: false,
      hasTaxInclusivity: false,
      status: 'missing',
      remarks: 'Maximum Retail Price (MRP) declaration missing on packaging panel.',
    };
  }

  const hasCurrencySymbol = /(?:₹|rs\.?|inr)\b/i.test(text);
  const priceMatch = text.match(/(?:₹|rs\.?|inr|mrp|price)\s*[:.-]?\s*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
    text.match(/\b([0-9]+(?:\.[0-9]{1,2})?)\s*(?:\/-|\.00|\b)/);
  const hasPrice = !!priceMatch;
  const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;

  const hasTaxInclusivity = /(?:incl\.?|inclusive)\s*(?:of)?\s*all\s*taxes/i.test(text);

  if (hasPrice && hasTaxInclusivity) {
    return {
      isValid: true,
      hasPrice: true,
      hasCurrencySymbol,
      hasTaxInclusivity: true,
      price,
      status: 'detected',
      remarks: 'Maximum Retail Price complies with Rule 6(1)(e) format and statutory tax inclusion clause.',
    };
  }

  if (hasPrice && !hasTaxInclusivity) {
    return {
      isValid: false,
      hasPrice: true,
      hasCurrencySymbol,
      hasTaxInclusivity: false,
      price,
      status: 'invalid',
      remarks: 'MRP declared without mandatory "(inclusive of all taxes)" clause required under Rule 6(1)(e).',
    };
  }

  return {
    isValid: false,
    hasPrice: false,
    hasCurrencySymbol,
    hasTaxInclusivity,
    status: 'low_confidence',
    remarks: 'MRP declaration ambiguous or illegible on packaging panel.',
  };
}

/**
 * Cross-references extracted declarations against Legal Metrology statutory rules,
 * cleans up AI hallucinations, and filters out false-positive violations
 * (such as flagging valid '60N' count declarations).
 */
export function crossValidateDeclarations(
  declarations: Declaration[],
  fullText: string = '',
  violations: Violation[] = []
): { declarations: Declaration[]; violations: Violation[] } {
  const updatedDeclarations: Declaration[] = [...declarations];
  let updatedViolations: Violation[] = [...violations];

  // 1. Cross-reference Net Quantity
  const netQtyIndex = updatedDeclarations.findIndex((d) => d.type === 'net_quantity');
  if (netQtyIndex !== -1) {
    const dec = updatedDeclarations[netQtyIndex];
    const val = dec.detectedValue || '';
    const validation = validateNetQuantity(val);

    if (validation.isValid) {
      // Valid statutory declaration (e.g. 60N, 60 N, 500 g, 1 kg)
      updatedDeclarations[netQtyIndex] = {
        ...dec,
        status: 'detected',
        confidence: Math.max(dec.confidence || 0, 96),
        remarks: validation.remarks,
      };

      // Remove any spurious violation claiming invalid/missing net quantity for this compliant value
      updatedViolations = updatedViolations.filter((v) => {
        const isQtyRule = v.ruleCode === 'PCR-03' || v.title?.toLowerCase().includes('quantity');
        if (!isQtyRule) return true;

        // If the violation claimed 60N or other valid unit was invalid/non-standard, eliminate false positive
        const violValue = (v.detectedValue || '').toLowerCase();
        if (
          violValue.includes('60n') ||
          violValue.includes('60 n') ||
          validation.isValid
        ) {
          return false; // Remove spurious violation
        }
        return true;
      });
    } else if (validation.isIllegalAbbreviation) {
      updatedDeclarations[netQtyIndex] = {
        ...dec,
        status: 'invalid',
        confidence: dec.confidence || 88,
        remarks: validation.remarks,
      };
    }
  }

  // 2. Cross-reference MRP
  const mrpIndex = updatedDeclarations.findIndex((d) => d.type === 'mrp');
  if (mrpIndex !== -1) {
    const dec = updatedDeclarations[mrpIndex];
    const val = dec.detectedValue || '';
    const validation = validateMRP(val);

    if (validation.isValid) {
      updatedDeclarations[mrpIndex] = {
        ...dec,
        status: 'detected',
        confidence: Math.max(dec.confidence || 0, 96),
        remarks: validation.remarks,
      };

      // Remove false-positive MRP violations if it actually has inclusive taxes
      updatedViolations = updatedViolations.filter((v) => {
        const isMrpRule = v.ruleCode === 'PCR-05' || v.title?.toLowerCase().includes('mrp') || v.title?.toLowerCase().includes('retail price');
        if (!isMrpRule) return true;
        if (v.title?.toLowerCase().includes('missing') && validation.hasPrice) return false;
        if (v.title?.toLowerCase().includes('inclusive') && validation.hasTaxInclusivity) return false;
        return true;
      });
    } else if (!validation.hasTaxInclusivity && validation.hasPrice) {
      updatedDeclarations[mrpIndex] = {
        ...dec,
        status: 'invalid',
        remarks: validation.remarks,
      };
    }
  }

  return {
    declarations: updatedDeclarations,
    violations: updatedViolations,
  };
}
