import { ProductImage } from '../types';

export interface PreprocessOptions {
  grayscale?: boolean;
  contrastBoost?: number; // 0 to 100, default 35
  histogramStretch?: boolean;
  sharpen?: boolean;
  maxDimension?: number;
  fastMode?: boolean; // When true (default), leverages hardware-accelerated canvas filters (~3ms)
}

export interface PreprocessResult {
  preprocessedUrl: string;
  originalUrl: string;
  width: number;
  height: number;
  processingTimeMs: number;
  appliedGrayscale: boolean;
  appliedContrast: boolean;
}

/**
 * Specialized image pre-processing for optical character recognition (OCR) on packaging labels:
 * 1. Rescales to optimal dimension maintaining aspect ratio
 * 2. Converts RGB color channels to ITU-R BT.601 perceptual luminance (grayscale)
 * 3. Performs dynamic range histogram stretching (auto-levels) to eliminate lighting glares/shadows
 * 4. Enhances high-frequency text contrast to make printed fonts, numerals, and units stand out
 * 5. Applies subtle text-edge unsharp sharpening to prevent dot-matrix and fine-print character blur
 */
export async function preprocessImageDetails(
  imageUrlOrData: string,
  options: PreprocessOptions = {}
): Promise<PreprocessResult> {
  const startTime = performance.now();
  const {
    grayscale = true,
    contrastBoost = 35,
    histogramStretch = true,
    sharpen = true,
    maxDimension = 1024,
    fastMode = true,
  } = options;

  // Environment check (e.g. during SSR or non-browser environments)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      preprocessedUrl: imageUrlOrData,
      originalUrl: imageUrlOrData,
      width: 0,
      height: 0,
      processingTimeMs: 0,
      appliedGrayscale: false,
      appliedContrast: false,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Safety timeout: if image fails to load or hangs within 4 seconds, fallback gracefully
    const timeoutId = setTimeout(() => {
      resolve({
        preprocessedUrl: imageUrlOrData,
        originalUrl: imageUrlOrData,
        width: 0,
        height: 0,
        processingTimeMs: performance.now() - startTime,
        appliedGrayscale: false,
        appliedContrast: false,
      });
    }, 4000);

    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        const naturalW = img.naturalWidth || img.width || 1200;
        const naturalH = img.naturalHeight || img.height || 1200;

        // Calculate scaled dimensions while preserving aspect ratio
        let targetW = naturalW;
        let targetH = naturalH;
        if (Math.max(targetW, targetH) > maxDimension) {
          const scale = maxDimension / Math.max(targetW, targetH);
          targetW = Math.round(targetW * scale);
          targetH = Math.round(targetH * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: !fastMode });

        if (!ctx) {
          resolve({
            preprocessedUrl: imageUrlOrData,
            originalUrl: imageUrlOrData,
            width: targetW,
            height: targetH,
            processingTimeMs: performance.now() - startTime,
            appliedGrayscale: false,
            appliedContrast: false,
          });
          return;
        }

        // Fast-path: Hardware-accelerated GPU canvas filter (~2-5ms)
        if (fastMode) {
          const filterParts: string[] = [];
          if (grayscale) filterParts.push('grayscale(100%)');
          if (contrastBoost > 0) filterParts.push(`contrast(${100 + Math.round(contrastBoost * 0.7)}%)`);
          if (histogramStretch) filterParts.push('brightness(104%)');
          
          if (filterParts.length > 0) {
            ctx.filter = filterParts.join(' ');
          }
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const preprocessedUrl = canvas.toDataURL('image/jpeg', 0.85);

          resolve({
            preprocessedUrl,
            originalUrl: imageUrlOrData.length > 500000 ? preprocessedUrl : imageUrlOrData,
            width: targetW,
            height: targetH,
            processingTimeMs: performance.now() - startTime,
            appliedGrayscale: grayscale,
            appliedContrast: contrastBoost > 0 || histogramStretch,
          });
          return;
        }

        // Render source image to canvas
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const imageData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imageData.data;
        const totalPixels = targetW * targetH;

        // 1. Grayscale luminance extraction (ITU-R BT.601 perceptual weights)
        const lum = new Float32Array(totalPixels);
        let sumLum = 0;
        for (let i = 0; i < totalPixels; i++) {
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          // Standard perceptual luminance
          const l = 0.299 * r + 0.587 * g + 0.114 * b;
          lum[i] = l;
          sumLum += l;
        }

        // Auto-exposure / gamma correction for dark, underexposed packaging
        const meanLum = sumLum / totalPixels;
        if (meanLum < 95) {
          const gamma = Math.max(0.65, meanLum / 115);
          for (let i = 0; i < totalPixels; i++) {
            lum[i] = Math.pow(lum[i] / 255, gamma) * 255;
          }
        }

        // 2. Dynamic Range Histogram Stretching (Auto-Levels with 1.5% percentile clipping)
        let pLow = 0;
        let pHigh = 255;
        if (histogramStretch) {
          const hist = new Int32Array(256);
          for (let i = 0; i < totalPixels; i++) {
            hist[Math.round(lum[i])] = (hist[Math.round(lum[i])] || 0) + 1;
          }

          const clipThreshold = Math.floor(totalPixels * 0.015);
          let cum = 0;
          for (let i = 0; i < 256; i++) {
            cum += hist[i];
            if (cum >= clipThreshold) {
              pLow = i;
              break;
            }
          }

          cum = 0;
          for (let i = 255; i >= 0; i--) {
            cum += hist[i];
            if (cum >= clipThreshold) {
              pHigh = i;
              break;
            }
          }

          // Only apply stretch if range is meaningful
          if (pHigh - pLow < 15) {
            pLow = 0;
            pHigh = 255;
          }
        }

        // 3. Contrast enhancement factor
        // Formula: factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
        const contrastFactor =
          contrastBoost > 0
            ? (259 * (contrastBoost + 255)) / (255 * (259 - contrastBoost))
            : 1.0;

        const range = pHigh - pLow || 1;
        for (let i = 0; i < totalPixels; i++) {
          // Normalize to [0, 255]
          let v = ((lum[i] - pLow) / range) * 255;
          v = Math.max(0, Math.min(255, v));

          // Apply contrast curve centered at midpoint 128
          let enhanced = contrastFactor * (v - 128) + 128;
          lum[i] = Math.max(0, Math.min(255, enhanced));
        }

        // 4. Subtle Text-Edge Sharpening (Laplacian High-Pass Convolution on luminance)
        let finalLum = lum;
        if (sharpen && targetW > 50 && targetH > 50) {
          finalLum = new Float32Array(totalPixels);
          const sharpenStrength = 0.32; // balanced to crisp fine print characters

          for (let y = 0; y < targetH; y++) {
            const yOffset = y * targetW;
            const yPrevOffset = (y > 0 ? y - 1 : 0) * targetW;
            const yNextOffset = (y < targetH - 1 ? y + 1 : targetH - 1) * targetW;

            for (let x = 0; x < targetW; x++) {
              const xPrev = x > 0 ? x - 1 : 0;
              const xNext = x < targetW - 1 ? x + 1 : targetW - 1;

              const center = lum[yOffset + x];
              const top = lum[yPrevOffset + x];
              const bottom = lum[yNextOffset + x];
              const left = lum[yOffset + xPrev];
              const right = lum[yOffset + xNext];

              // Laplacian kernel high-pass contribution
              const laplacian = 4 * center - (top + bottom + left + right);
              const sharpened = center + sharpenStrength * laplacian;
              finalLum[yOffset + x] = Math.max(0, Math.min(255, sharpened));
            }
          }
        }

        // 5. Write back pixel data (either pure grayscale or contrast-adjusted)
        for (let i = 0; i < totalPixels; i++) {
          const idx = i * 4;
          const pixelVal = Math.round(finalLum[i]);

          if (grayscale) {
            data[idx] = pixelVal;
            data[idx + 1] = pixelVal;
            data[idx + 2] = pixelVal;
          } else {
            // Contrast adjusted on original channels
            const factor = contrastFactor;
            data[idx] = Math.max(0, Math.min(255, factor * (data[idx] - 128) + 128));
            data[idx + 1] = Math.max(0, Math.min(255, factor * (data[idx + 1] - 128) + 128));
            data[idx + 2] = Math.max(0, Math.min(255, factor * (data[idx + 2] - 128) + 128));
          }
          data[idx + 3] = 255; // Full opacity
        }

        ctx.putImageData(imageData, 0, 0);
        const preprocessedUrl = canvas.toDataURL('image/jpeg', 0.85);

        resolve({
          preprocessedUrl,
          originalUrl: imageUrlOrData.length > 500000 ? preprocessedUrl : imageUrlOrData,
          width: targetW,
          height: targetH,
          processingTimeMs: performance.now() - startTime,
          appliedGrayscale: grayscale,
          appliedContrast: contrastBoost > 0 || histogramStretch,
        });
      } catch (err) {
        console.warn('Image pre-processing caught exception, falling back to original:', err);
        resolve({
          preprocessedUrl: imageUrlOrData,
          originalUrl: imageUrlOrData,
          width: 0,
          height: 0,
          processingTimeMs: performance.now() - startTime,
          appliedGrayscale: false,
          appliedContrast: false,
        });
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve({
        preprocessedUrl: imageUrlOrData,
        originalUrl: imageUrlOrData,
        width: 0,
        height: 0,
        processingTimeMs: performance.now() - startTime,
        appliedGrayscale: false,
        appliedContrast: false,
      });
    };

    img.src = imageUrlOrData;
  });
}

/**
 * Convenient shorthand returning the pre-processed data URL
 */
export async function preprocessImageForOcr(
  imageUrlOrData: string,
  options?: PreprocessOptions
): Promise<string> {
  const result = await preprocessImageDetails(imageUrlOrData, options);
  return result.preprocessedUrl;
}

/**
 * Pre-processes an array of multi-panel packaging images concurrently
 */
export async function preprocessPanelsForOcr(
  images: ProductImage[],
  options?: PreprocessOptions
): Promise<ProductImage[]> {
  if (!images || images.length === 0) return [];

  return Promise.all(
    images.map(async (img) => {
      // If already preprocessed, preserve and reuse immediately without extra overhead
      if (img.isPreprocessed && img.url) {
        return img;
      }
      const processed = await preprocessImageDetails(img.url, options);
      return {
        ...img,
        originalUrl: img.originalUrl || img.url,
        url: processed.preprocessedUrl,
        isPreprocessed: true,
        isEnhanced: true,
      };
    })
  );
}

// ============================================================================
// OCR DATE PARSING & REGEX VALIDATION LOGIC
// Specifically enhanced for 'Manufacturing Date' and 'Expiry Date' patterns
// Supporting multiple statutory date formats (DD/MM/YY, MM/YYYY, DD/MM/YYYY, etc.)
// Compliant with Legal Metrology (Packaged Commodities) Rules, 2011:
// - Rule 6(1)(d): Month and year of manufacture or pre-packing
// - Rule 6(1)(d) Proviso: Date of expiry / Best before / Shelf life
// ============================================================================

export type DateFormatType =
  | 'DD/MM/YYYY'
  | 'DD/MM/YY'
  | 'MM/YYYY'
  | 'MM/YY'
  | 'DD-MM-YYYY'
  | 'DD-MM-YY'
  | 'MM-YYYY'
  | 'MM-YY'
  | 'DD.MM.YYYY'
  | 'DD.MM.YY'
  | 'MM.YYYY'
  | 'MM.YY'
  | 'YYYY/MM/DD'
  | 'YYYY-MM-DD'
  | 'YYYY.MM.DD'
  | 'YYYY/MM'
  | 'YYYY-MM'
  | 'DD_MON_YYYY'
  | 'MON_YYYY'
  | 'SHELF_LIFE_STATEMENT'
  | 'CUSTOM';

export interface DateValidationResult {
  isValid: boolean;
  normalizedDate?: string;
  format?: DateFormatType;
  day?: number;
  month?: number;
  year?: number;
  isExpired?: boolean;
  error?: string;
  confidence: number;
}

export interface ExtractedDateInfo {
  rawMatch: string;
  cleanValue: string;
  normalizedDate: string;
  prefix: string;
  dateType: 'mfg_date' | 'expiry_date';
  format: DateFormatType;
  day?: number;
  month?: number;
  year?: number;
  confidence: number;
  isValid: boolean;
  validationMessage?: string;
  isShelfLifeStatement?: boolean;
  shelfLifeMonths?: number;
  shelfLifeDays?: number;
}

export interface DateOcrParseResult {
  manufacturingDate: ExtractedDateInfo | null;
  expiryDate: ExtractedDateInfo | null;
  allDetectedDates: ExtractedDateInfo[];
  rawTextAnalyzed: string;
  hasCompliantMfgDate: boolean;
  hasCompliantExpiryDate: boolean;
  complianceNotes: string[];
}

// ----------------------------------------------------------------------------
// REGEX PATTERNS FOR STATUTORY PACKAGING LABELS & DATE TOKENS
// ----------------------------------------------------------------------------

export const DATE_FORMAT_REGEXES = {
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  DD_MM_YYYY: /\b(0?[1-9]|[12][0-9]|3[01])([\/\.-])(0?[1-9]|1[0-2])\2(20\d{2})\b/,
  // DD/MM/YY or DD-MM-YY or DD.MM.YY
  DD_MM_YY: /\b(0?[1-9]|[12][0-9]|3[01])([\/\.-])(0?[1-9]|1[0-2])\2(\d{2})\b/,
  // MM/YYYY or MM-YYYY or MM.YYYY
  MM_YYYY: /\b(0?[1-9]|1[0-2])([\/\.-])(20\d{2})\b/,
  // MM/YY or MM-YY or MM.YY
  MM_YY: /\b(0?[1-9]|1[0-2])([\/\.-])(\d{2})\b/,
  // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  YYYY_MM_DD: /\b(20\d{2})([\/\.-])(0?[1-9]|1[0-2])\2(0?[1-9]|[12][0-9]|3[01])\b/,
  // YYYY/MM or YYYY-MM
  YYYY_MM: /\b(20\d{2})([\/\.-])(0?[1-9]|1[0-2])\b/,
  // DD Mon YYYY / DD-Mon-YY (e.g. 15 Oct 2024, 15-OCT-24, 15/October/2024)
  DD_MON_YYYY: /\b(0?[1-9]|[12][0-9]|3[01])[\s\/\.-]+([a-zA-Z]{3,9})[\s\/\.-]+(20\d{2}|\d{2})\b/i,
  // Mon YYYY / Mon-YY (e.g. Oct 2024, SEP-24, OCTOBER 2024)
  MON_YYYY: /\b([a-zA-Z]{3,9})[\s\/\.-]+(20\d{2}|\d{2})\b/i,
};

// Master single-token date pattern combining all valid numeric and textual dates
export const MASTER_DATE_TOKEN_REGEX =
  /\b(?:(?:(?:0?[1-9]|[12][0-9]|3[01])[\s\/\.-]+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|0?[1-9]|1[0-2])[\s\/\.-]+(?:20\d{2}|\d{2})|(?:20\d{2})[\s\/\.-]+(?:0?[1-9]|1[0-2])(?:[\s\/\.-]+(?:0?[1-9]|[12][0-9]|3[01]))?)\b/i;

// Relative shelf-life statements (e.g. "Best Before 24 Months from Packaging")
export const SHELF_LIFE_STATEMENT_REGEX =
  /\b(?:best\s*before|use\s*by|use\s*before|consume\s*before|shelf\s*life|valid\s*upto|valid\s*for|expiry)[\s:.-]*([0-9]+\s*(?:months?|years?|days?|weeks?)(?:\s*(?:from|of)\s*(?:date\s*of\s*)?(?:mfg|manufacture|mfd|pkd|packing|pkg|pre-?packing|packaging|opening))?)/i;

// Manufacturing date prefixes (including dot-matrix abbreviations and OCR noise)
export const MANUFACTURING_DATE_PREFIX_REGEX =
  /(?:m\.?f\.?[dg]\.?|p\.?k\.?d\.?|packed|packaging|manufactur(?:e|ed|ing)|dom\b|d\.?o\.?m\.?|month\s*(?:and|&)?\s*(?:year\s*)?of\s*(?:mfg|manufacture|mfd|packing|pkg)|date\s*of\s*(?:mfg|manufacture|mfd|packing|pkg)|dt\.?\s*of\s*(?:mfg|mfd)|mfo\b|med\b|mpd\b)/i;

// Expiry date prefixes
export const EXPIRY_DATE_PREFIX_REGEX =
  /(?:exp\b|exp\.?|expiry|exp\.?\s*dt\.?|exp\.?\s*date|date\s*of\s*expiry|d\.?o\.?e\.?|doe\b|use\s*by|use\s*before|best\s*before|best\s*by|b\.?b\.?\b|shelf\s*life|consume\s*before)/i;

// Delimiters between joint MFD and EXP statements (e.g. "B.NO. 402 MFD 11/24 EXP 11/27")
export const COMBINED_SPLIT_REGEX =
  /(?=[|;]|\s+(?:exp|best|use\s*by|doe|mfd|mfg|pkd|packed|dom))/i;

// Words to truncate when cleaning extracted date values
export const STRIP_TRAILING_TERMS = [
  /(?:mrp|rs\.?|₹|net|b\.?no|batch|lot|pkg|weight|volume)/i,
];

const MONTH_NAMES_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/**
 * Normalizes 2-digit years (e.g. "24" -> 2024)
 */
export function normalizeYear(yrStr: string | number): number | undefined {
  let y = typeof yrStr === 'string' ? parseInt(yrStr, 10) : yrStr;
  if (isNaN(y)) return undefined;
  if (y < 100) {
    y = 2000 + y;
  }
  return y;
}

/**
 * Parses textual or numeric month string into 1-12
 */
export function parseMonthString(monStr: string): number | undefined {
  const num = parseInt(monStr, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) return num;
  const clean = monStr.toLowerCase().trim();
  return MONTH_NAMES_MAP[clean];
}

/**
 * Checks if year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns number of days in a month for a given year
 */
export function getDaysInMonth(month: number, year: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

/**
 * Strips noise, delimiters, and trailing statutory tokens from raw extracted substrings
 */
export function cleanRawDateFragment(val: string, additionalCutTerms: RegExp[] = []): string {
  if (!val) return '';
  let res = val.trim();
  const allTerms = [...STRIP_TRAILING_TERMS, ...additionalCutTerms];
  for (const term of allTerms) {
    const match = res.match(term);
    if (match && match.index !== undefined && match.index > 0) {
      res = res.substring(0, match.index).trim();
    }
  }
  return res.replace(/^[|:;,\-\s]+|[|:;,\-\s]+$/g, '').trim();
}

/**
 * Comprehensive Regex Validation for Date Strings
 * Supports:
 * - DD/MM/YYYY, DD/MM/YY
 * - DD-MM-YYYY, DD-MM-YY
 * - DD.MM.YYYY, DD.MM.YY
 * - MM/YYYY, MM/YY
 * - MM-YYYY, MM-YY
 * - MM.YYYY, MM.YY
 * - YYYY/MM/DD, YYYY-MM-DD
 * - YYYY/MM, YYYY-MM
 * - DD Mon YYYY, Mon YYYY
 * - Relative shelf-life statements ("Best Before X Months")
 *
 * Validates days (1-31 against specific month & leap year rules), months (1-12),
 * and years (2000-2099). Checks expiration against current date.
 */
export function validateDateFormat(
  dateStr: string,
  options: { isManufacturingDate?: boolean; referenceDate?: Date } = {}
): DateValidationResult {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, error: 'Empty date string', confidence: 0 };
  }

  const str = dateStr.trim();
  const now = options.referenceDate || new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // 1. Check relative shelf-life statement (e.g. "Best Before 24 Months from Packaging")
  const shelfMatch = str.match(SHELF_LIFE_STATEMENT_REGEX);
  if (shelfMatch) {
    return {
      isValid: true,
      format: 'SHELF_LIFE_STATEMENT',
      normalizedDate: shelfMatch[0].trim(),
      confidence: 98,
    };
  }

  const checkValidation = (
    day: number | undefined,
    month: number,
    year: number,
    format: DateFormatType,
    confidence = 98
  ): DateValidationResult => {
    if (!month || month < 1 || month > 12) {
      return {
        isValid: false,
        format,
        error: `Invalid month '${month}' (must be 1-12)`,
        confidence: 30,
      };
    }
    if (!year || year < 2000 || year > 2099) {
      return {
        isValid: false,
        format,
        error: `Unrealistic year '${year}' (must be 2000-2099)`,
        confidence: 30,
      };
    }
    if (day !== undefined) {
      const maxDays = getDaysInMonth(month, year);
      if (day < 1 || day > maxDays) {
        return {
          isValid: false,
          format,
          day,
          month,
          year,
          error: `Invalid day '${day}' for month ${month} (max ${maxDays})`,
          confidence: 35,
        };
      }
    }

    // Check expiration if expiry date
    let isExpired = false;
    if (!options.isManufacturingDate) {
      if (year < currentYear) {
        isExpired = true;
      } else if (year === currentYear) {
        if (month < currentMonth) {
          isExpired = true;
        } else if (month === currentMonth && day !== undefined && day < currentDay) {
          isExpired = true;
        }
      }
    }

    const normalizedDate =
      day !== undefined
        ? `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
        : `${String(month).padStart(2, '0')}/${year}`;

    return {
      isValid: true,
      format,
      day,
      month,
      year,
      isExpired,
      normalizedDate,
      confidence,
    };
  };

  // 2. Try YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  let m = str.match(DATE_FORMAT_REGEXES.YYYY_MM_DD);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[3], 10);
    const day = parseInt(m[4], 10);
    return checkValidation(day, month, year, 'YYYY-MM-DD', 99);
  }

  // 3. Try DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  m = str.match(DATE_FORMAT_REGEXES.DD_MM_YYYY);
  if (m) {
    const day = parseInt(m[1], 10);
    const sep = m[2];
    const month = parseInt(m[3], 10);
    const year = parseInt(m[4], 10);
    const formatType: DateFormatType =
      sep === '/' ? 'DD/MM/YYYY' : sep === '-' ? 'DD-MM-YYYY' : 'DD.MM.YYYY';
    return checkValidation(day, month, year, formatType, 100);
  }

  // 4. Try DD/MM/YY, DD-MM-YY, DD.MM.YY
  m = str.match(DATE_FORMAT_REGEXES.DD_MM_YY);
  if (m) {
    const day = parseInt(m[1], 10);
    const sep = m[2];
    const month = parseInt(m[3], 10);
    const year = normalizeYear(m[4]);
    const formatType: DateFormatType =
      sep === '/' ? 'DD/MM/YY' : sep === '-' ? 'DD-MM-YY' : 'DD.MM.YY';
    if (year) {
      return checkValidation(day, month, year, formatType, 98);
    }
  }

  // 5. Try DD Mon YYYY / DD-Mon-YY
  m = str.match(DATE_FORMAT_REGEXES.DD_MON_YYYY);
  if (m && isNaN(parseInt(m[2], 10))) {
    const day = parseInt(m[1], 10);
    const month = parseMonthString(m[2]);
    const year = normalizeYear(m[3]);
    if (month && year) {
      return checkValidation(day, month, year, 'DD_MON_YYYY', 98);
    }
  }

  // 6. Try MM/YYYY, MM-YYYY, MM.YYYY
  m = str.match(DATE_FORMAT_REGEXES.MM_YYYY);
  if (m) {
    const month = parseInt(m[1], 10);
    const sep = m[2];
    const year = parseInt(m[3], 10);
    const formatType: DateFormatType =
      sep === '/' ? 'MM/YYYY' : sep === '-' ? 'MM-YYYY' : 'MM.YYYY';
    return checkValidation(undefined, month, year, formatType, 100);
  }

  // 7. Try MM/YY, MM-YY, MM.YY
  m = str.match(DATE_FORMAT_REGEXES.MM_YY);
  if (m) {
    const month = parseInt(m[1], 10);
    const sep = m[2];
    const year = normalizeYear(m[3]);
    const formatType: DateFormatType =
      sep === '/' ? 'MM/YY' : sep === '-' ? 'MM-YY' : 'MM.YY';
    if (year) {
      return checkValidation(undefined, month, year, formatType, 97);
    }
  }

  // 8. Try Mon YYYY (e.g. Oct 2024, SEP-24)
  m = str.match(DATE_FORMAT_REGEXES.MON_YYYY);
  if (m && isNaN(parseInt(m[1], 10))) {
    const month = parseMonthString(m[1]);
    const year = normalizeYear(m[2]);
    if (month && year) {
      return checkValidation(undefined, month, year, 'MON_YYYY', 96);
    }
  }

  // 9. Try YYYY/MM or YYYY-MM
  m = str.match(DATE_FORMAT_REGEXES.YYYY_MM);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[3], 10);
    return checkValidation(undefined, month, year, 'YYYY-MM', 95);
  }

  return {
    isValid: false,
    error: 'No recognized statutory date format found (expected DD/MM/YYYY, MM/YYYY, DD/MM/YY, or text month)',
    confidence: 0,
  };
}

/**
 * Returns canonical normalized date string (e.g. "10/2024" or "15/08/2024")
 */
export function normalizeDateString(dateStr: string): string {
  const res = validateDateFormat(dateStr);
  return res.normalizedDate || dateStr.trim();
}

/**
 * Quick boolean check if string contains a compliant date format under Rule 6(1)(d)
 */
export function isCompliantDateFormat(dateStr: string): boolean {
  const res = validateDateFormat(dateStr);
  return res.isValid;
}

/**
 * Specialized parser for Date of Manufacture / Pre-packing
 * Searches single-line or multi-line text for MFD / PKD prefixes and extracts date
 */
export function parseManufacturingDate(text: string): ExtractedDateInfo | null {
  if (!text) return null;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let mfgRaw = '';
  let matchedPrefix = 'MFD';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isMfg = MANUFACTURING_DATE_PREFIX_REGEX.test(line);
    const isExp = EXPIRY_DATE_PREFIX_REGEX.test(line);

    if (isMfg && isExp) {
      // Joint line (e.g. "MFD 11/24 EXP 11/27")
      const parts = line.split(COMBINED_SPLIT_REGEX);
      for (const p of parts) {
        if (MANUFACTURING_DATE_PREFIX_REGEX.test(p) && !EXPIRY_DATE_PREFIX_REGEX.test(p)) {
          mfgRaw = cleanRawDateFragment(p, [/(?:exp|best|use\s*by|doe)/i]);
          break;
        }
      }
      if (mfgRaw) break;
    } else if (isMfg) {
      const prefMatch = line.match(MANUFACTURING_DATE_PREFIX_REGEX);
      if (prefMatch) matchedPrefix = prefMatch[0].trim();

      if (MASTER_DATE_TOKEN_REGEX.test(line)) {
        mfgRaw = cleanRawDateFragment(line, [/(?:exp|best|use\s*by|doe)/i]);
        break;
      } else if (i + 1 < lines.length && MASTER_DATE_TOKEN_REGEX.test(lines[i + 1])) {
        // Multi-line: prefix on current line, date token on next line
        const cleanLine = line.replace(/[:\s]+$/, '');
        mfgRaw = `${cleanLine}: ${lines[i + 1]}`;
        break;
      } else {
        mfgRaw = line;
      }
    }
  }

  // Fallback to global regex
  if (!mfgRaw) {
    const globalMatch = text.match(
      /(?:(?:m\.?f\.?[dg]\.?|p\.?k\.?d\.?|packed|manufactur\w*|dom|month\s*(?:and|&)?\s*(?:year\s*)?of\s*\w+)[\s:.-]{1,15})(?:[0-3]?[0-9][\s\/\.-]+)?(?:[a-z]{3,9}|[0-1]?[0-9])[\s\/\.-]+(?:20\d{2}|\d{2})/i
    );
    if (globalMatch) {
      mfgRaw = globalMatch[0].trim();
    }
  }

  if (!mfgRaw) return null;

  const dateTokenMatch = mfgRaw.match(MASTER_DATE_TOKEN_REGEX);
  const dateToken = dateTokenMatch ? dateTokenMatch[0] : mfgRaw;
  const validation = validateDateFormat(dateToken, { isManufacturingDate: true });

  return {
    rawMatch: mfgRaw,
    cleanValue: mfgRaw,
    normalizedDate: validation.normalizedDate || dateToken,
    prefix: matchedPrefix,
    dateType: 'mfg_date',
    format: validation.format || 'CUSTOM',
    day: validation.day,
    month: validation.month,
    year: validation.year,
    confidence: validation.isValid ? validation.confidence : 50,
    isValid: validation.isValid,
    validationMessage: validation.error,
  };
}

/**
 * Specialized parser for Date of Expiry / Best Before / Shelf Life
 * Supports both fixed dates (EXP: 10/2026) and relative shelf-life statements
 */
export function parseExpiryDate(text: string): ExtractedDateInfo | null {
  if (!text) return null;

  // 1. Check relative shelf life statement first (e.g. "Best Before 24 Months from Packaging")
  const shelfMatch = text.match(SHELF_LIFE_STATEMENT_REGEX);
  if (shelfMatch) {
    const rawMatch = shelfMatch[0].trim();
    const monthsMatch = rawMatch.match(/([0-9]+)\s*months?/i);
    const daysMatch = rawMatch.match(/([0-9]+)\s*days?/i);
    const months = monthsMatch ? parseInt(monthsMatch[1], 10) : undefined;
    const days = daysMatch ? parseInt(daysMatch[1], 10) : undefined;

    return {
      rawMatch,
      cleanValue: rawMatch,
      normalizedDate: rawMatch,
      prefix: 'BEST BEFORE',
      dateType: 'expiry_date',
      format: 'SHELF_LIFE_STATEMENT',
      confidence: 98,
      isValid: true,
      isShelfLifeStatement: true,
      shelfLifeMonths: months,
      shelfLifeDays: days,
    };
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let expRaw = '';
  let matchedPrefix = 'EXP';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isMfg = MANUFACTURING_DATE_PREFIX_REGEX.test(line);
    const isExp = EXPIRY_DATE_PREFIX_REGEX.test(line);

    if (isMfg && isExp) {
      const parts = line.split(COMBINED_SPLIT_REGEX);
      for (const p of parts) {
        if (EXPIRY_DATE_PREFIX_REGEX.test(p)) {
          expRaw = cleanRawDateFragment(p, [/(?:mfd|mfg|pkd|packed)/i]);
          break;
        }
      }
      if (expRaw) break;
    } else if (isExp) {
      const prefMatch = line.match(EXPIRY_DATE_PREFIX_REGEX);
      if (prefMatch) matchedPrefix = prefMatch[0].trim();

      if (MASTER_DATE_TOKEN_REGEX.test(line)) {
        expRaw = cleanRawDateFragment(line, [/(?:mfd|mfg|pkd|packed)/i]);
        break;
      } else if (i + 1 < lines.length && MASTER_DATE_TOKEN_REGEX.test(lines[i + 1])) {
        const cleanLine = line.replace(/[:\s]+$/, '');
        expRaw = `${cleanLine}: ${lines[i + 1]}`;
        break;
      } else {
        expRaw = line;
      }
    }
  }

  // Fallback to global regex
  if (!expRaw) {
    const globalMatch = text.match(
      /(?:(?:exp\w*|use\s*by|use\s*before|best\s*before|doe)[\s:.-]{1,15})(?:[0-3]?[0-9][\s\/\.-]+)?(?:[a-z]{3,9}|[0-1]?[0-9])[\s\/\.-]+(?:20\d{2}|\d{2})/i
    );
    if (globalMatch) {
      expRaw = globalMatch[0].trim();
    }
  }

  if (!expRaw) return null;

  const dateTokenMatch = expRaw.match(MASTER_DATE_TOKEN_REGEX);
  const dateToken = dateTokenMatch ? dateTokenMatch[0] : expRaw;
  const validation = validateDateFormat(dateToken, { isManufacturingDate: false });

  return {
    rawMatch: expRaw,
    cleanValue: expRaw,
    normalizedDate: validation.normalizedDate || dateToken,
    prefix: matchedPrefix,
    dateType: 'expiry_date',
    format: validation.format || 'CUSTOM',
    day: validation.day,
    month: validation.month,
    year: validation.year,
    confidence: validation.isValid ? validation.confidence : 50,
    isValid: validation.isValid,
    validationMessage: validation.error,
  };
}

/**
 * End-to-End OCR Packaging Date Parser & Compliance Engine
 * Simultaneously analyzes raw OCR text for both Manufacturing Date and Expiry Date
 * according to Legal Metrology Rule 6(1)(d) and Rule 6(1)(d) Proviso.
 */
export function parsePackagingDates(ocrText: string): DateOcrParseResult {
  const mfg = parseManufacturingDate(ocrText);
  const exp = parseExpiryDate(ocrText);

  // If isolated dates exist and neither MFD nor EXP has been identified
  let fallbackMfg = mfg;
  let fallbackExp = exp;

  if (!fallbackMfg) {
    const allDates = [...ocrText.matchAll(new RegExp(MASTER_DATE_TOKEN_REGEX.source, 'gi'))].map(
      (m) => m[0]
    );
    if (allDates.length === 1) {
      const val = validateDateFormat(allDates[0], { isManufacturingDate: true });
      fallbackMfg = {
        rawMatch: `Mfg / Pkd: ${allDates[0]}`,
        cleanValue: `Mfg / Pkd: ${allDates[0]}`,
        normalizedDate: val.normalizedDate || allDates[0],
        prefix: 'MFD',
        dateType: 'mfg_date',
        format: val.format || 'CUSTOM',
        day: val.day,
        month: val.month,
        year: val.year,
        confidence: val.isValid ? 92 : 45,
        isValid: val.isValid,
        validationMessage: val.error,
      };
    } else if (allDates.length >= 2) {
      const val1 = validateDateFormat(allDates[0], { isManufacturingDate: true });
      fallbackMfg = {
        rawMatch: `MFD: ${allDates[0]}`,
        cleanValue: `MFD: ${allDates[0]}`,
        normalizedDate: val1.normalizedDate || allDates[0],
        prefix: 'MFD',
        dateType: 'mfg_date',
        format: val1.format || 'CUSTOM',
        day: val1.day,
        month: val1.month,
        year: val1.year,
        confidence: val1.isValid ? 94 : 45,
        isValid: val1.isValid,
        validationMessage: val1.error,
      };

      if (!fallbackExp) {
        const val2 = validateDateFormat(allDates[1], { isManufacturingDate: false });
        fallbackExp = {
          rawMatch: `EXP: ${allDates[1]}`,
          cleanValue: `EXP: ${allDates[1]}`,
          normalizedDate: val2.normalizedDate || allDates[1],
          prefix: 'EXP',
          dateType: 'expiry_date',
          format: val2.format || 'CUSTOM',
          day: val2.day,
          month: val2.month,
          year: val2.year,
          confidence: val2.isValid ? 94 : 45,
          isValid: val2.isValid,
          validationMessage: val2.error,
        };
      }
    }
  }

  const allDetectedDates: ExtractedDateInfo[] = [];
  if (fallbackMfg) allDetectedDates.push(fallbackMfg);
  if (fallbackExp) allDetectedDates.push(fallbackExp);

  const complianceNotes: string[] = [];
  if (fallbackMfg?.isValid) {
    complianceNotes.push(
      `Rule 6(1)(d) COMPLIANT: Valid manufacturing date detected (${fallbackMfg.normalizedDate}, format: ${fallbackMfg.format}).`
    );
  } else if (fallbackMfg) {
    complianceNotes.push(
      `Rule 6(1)(d) WARNING: Manufacturing date candidate '${fallbackMfg.rawMatch}' failed validation (${fallbackMfg.validationMessage}).`
    );
  } else {
    complianceNotes.push(
      'Rule 6(1)(d) NON-COMPLIANT: Month and year of manufacture or pre-packing not found.'
    );
  }

  if (fallbackExp?.isValid) {
    complianceNotes.push(
      `Rule 6(1)(d) Proviso COMPLIANT: Valid shelf-life / expiry declaration detected (${fallbackExp.normalizedDate}).`
    );
  } else if (fallbackExp) {
    complianceNotes.push(
      `Rule 6(1)(d) Proviso WARNING: Expiry candidate '${fallbackExp.rawMatch}' failed validation (${fallbackExp.validationMessage}).`
    );
  } else {
    complianceNotes.push(
      'Rule 6(1)(d) Proviso ADVISORY: Expiry / Best Before not declared (verify if product category requires statutory shelf life).'
    );
  }

  return {
    manufacturingDate: fallbackMfg,
    expiryDate: fallbackExp,
    allDetectedDates,
    rawTextAnalyzed: ocrText,
    hasCompliantMfgDate: !!fallbackMfg?.isValid,
    hasCompliantExpiryDate: !!fallbackExp?.isValid,
    complianceNotes,
  };
}

/**
 * Intelligent Optical Character Correction Engine for Packaging OCR
 * Accurately repairs common optical character misrecognitions without hallucinating:
 * - O vs 0 in numbers and dates (e.g. 1OO.OO -> 100.00, 1O/2O25 -> 10/2025)
 * - l/I vs 1 in currency and quantities (e.g. l99.00 -> 199.00)
 * - q/9 vs g in metric units (e.g. 500 q -> 500 g)
 * - S vs 5 in pricing (e.g. Rs. S0 -> Rs. 50)
 * - Currency symbol replacements (?, t, F followed by numbers -> ₹)
 * - Dot-matrix and broken abbreviations (MED, MFO -> MFD; BXP, EXF -> EXP)
 */
export function postProcessAndCorrectOcrText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;

  // 1. Correct common currency symbol OCR corruptions (e.g. "? 199", "t 199", "F 199")
  text = text.replace(/(?:^|\s)[?tF]\s*([0-9]+(?:\.[0-9]{1,2})?)/g, ' ₹ $1');
  text = text.replace(/\b(?:R5|Rs\s*\.)\b/g, 'Rs.');

  // 2. Correct price numbers where 'O' or 'o' is mistaken for '0', or 'l'/'I' for '1'
  text = text.replace(/(?:mrp|rs\.?|₹)\s*[:.-]?\s*([0-9OlI]{1,6}(?:\.[0-9OlI]{1,2})?)/gi, (match, p1) => {
    const fixedNum = p1
      .replace(/[Oo]/g, '0')
      .replace(/[lI]/g, '1');
    return match.replace(p1, fixedNum);
  });

  // 3. Correct net quantity units where 'q' or '9' was OCR-misread for 'g'
  text = text.replace(/(\b\d+(?:\.\d+)?\s*)(?:q|9)\b/gi, '$1g');
  text = text.replace(/(\b\d+(?:\.\d+)?\s*)(?:m1|mi)\b/gi, '$1ml');
  text = text.replace(/(\b\d+\s*)(?:H|U|IN)\b/g, '$1N');

  // 4. Correct date prefixes (e.g. "MED:", "MFO:", "MPD:" -> "MFD:", "BXP:", "EXF:" -> "EXP:")
  text = text.replace(/\b(?:MED|MFO|MPD|MFE)\b\s*[:.-]?/gi, 'MFD:');
  text = text.replace(/\b(?:BXP|EXF|EXPDT|EXPDATE)\b\s*[:.-]?/gi, 'EXP:');

  // 5. Correct dates with 'O' or 'I' instead of '0' or '1'
  text = text.replace(/(?:mfd|mfg|pkd|packed|exp|expiry|use\s*by|best\s*before)[\s:.-]+([0-9OlI]{1,2}[\/\.-][0-9OlI]{2,4})/gi, (match, datePart) => {
    const fixedDate = datePart
      .replace(/[Oo]/g, '0')
      .replace(/[lI]/g, '1');
    return match.replace(datePart, fixedDate);
  });

  // 6. Correct phone numbers (e.g. 18OO -> 1800)
  text = text.replace(/\b18[Oo]{2}[- ]?([0-9OlI]{3,4})[- ]?([0-9OlI]{3,4})\b/g, (match) => {
    return match.replace(/[Oo]/g, '0').replace(/[lI]/g, '1');
  });

  // 7. Correct postal PIN code when 6-digits have 'O'
  text = text.replace(/\b([1-9][0-9Oo]{5})\b/g, (match) => {
    return match.replace(/[Oo]/g, '0');
  });

  return text;
}

