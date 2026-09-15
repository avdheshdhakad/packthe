import { BoundingBox } from '../types';

/**
 * Default consistent padding multiplier (12%, within the 10-15% statutory packaging window)
 * to ensure bounding boxes contain full text tokens and diacritics without clipping.
 */
export const DEFAULT_PADDING_MULTIPLIER = 0.12; // 12% padding

export interface DynamicBoxOptions {
  paddingMultiplier?: number;
  minWidth?: number;
  maxWidth?: number;
  clampToContainer?: boolean;
}

/**
 * Dynamically calculates the required horizontal width (and vertical clearance)
 * of a bounding box based on the actual text content length found by the OCR engine.
 *
 * @param text The exact text characters detected by the OCR engine
 * @param currentHeight The normalized height (%) of the text line
 * @param baseWidth Optional initial width detected by vision/OCR model
 * @param options Configuration options including padding multiplier
 */
export function calculateDynamicWidth(
  text: string,
  currentHeight: number = 4.5,
  baseWidth: number = 0,
  options: DynamicBoxOptions = {}
): number {
  const cleanText = (text || '').trim();
  const len = cleanText.length;
  if (len === 0) return Math.max(baseWidth, 4);

  const paddingMultiplier =
    typeof options.paddingMultiplier === 'number'
      ? options.paddingMultiplier
      : DEFAULT_PADDING_MULTIPLIER;

  // Approximate character aspect ratio for packaging fonts:
  // Most industrial packaging fonts (Helvetica, Arial, DIN, Futura, Univers) have
  // glyph width ≈ 0.48 - 0.58 of the font height.
  // In percentage coordinates, character width scales with the line height.
  const charWidthFactor = Math.max(1.15, currentHeight * 0.48);

  // Address multi-word and multi-line packaging declarations:
  // If text is unusually long (e.g., full manufacturer address or consumer care cell > 40 chars),
  // it often wraps over 2-3 lines on the physical package.
  let estimatedRawWidth: number;
  if (len <= 15) {
    // Short values: e.g. "₹ 199.00", "500 g", "60 N", "12/2024"
    estimatedRawWidth = Math.max(baseWidth, len * charWidthFactor * 1.05);
  } else if (len <= 35) {
    // Medium values: e.g. "MRP: Rs. 149.00 (Incl. of all taxes)", "Country of Origin: India"
    estimatedRawWidth = Math.max(baseWidth, len * charWidthFactor * 0.95);
  } else {
    // Long multi-word sentences: e.g. Manufacturer address, Consumer Care cell
    // Estimate width based on typical packaging panel column width (45% - 85%)
    const singleLineEstimate = len * charWidthFactor * 0.85;
    estimatedRawWidth = Math.max(baseWidth, Math.min(82, singleLineEstimate));
  }

  // Incorporate the consistent padding multiplier (e.g., 10-15%)
  const widthWithPadding = estimatedRawWidth * (1 + paddingMultiplier);

  const minWidth = options.minWidth ?? 4;
  const maxWidth = options.maxWidth ?? 96;

  return Math.max(minWidth, Math.min(maxWidth, Math.round(widthWithPadding * 10) / 10));
}

/**
 * Adjusts an existing BoundingBox or creates a new one dynamically calibrated
 * to the actual text content length found by the OCR engine.
 *
 * Ensures the full text is contained without clipping on left, right, or boundary edges.
 */
export function calculateDynamicBoundingBox(
  baseBox?: Partial<BoundingBox> | null,
  textContent?: string,
  options: DynamicBoxOptions = {}
): BoundingBox {
  const paddingMultiplier =
    typeof options.paddingMultiplier === 'number'
      ? options.paddingMultiplier
      : DEFAULT_PADDING_MULTIPLIER;

  const text = (textContent || '').trim();
  const len = text.length;

  // Defaults if no box provided
  let x = typeof baseBox?.x === 'number' ? baseBox.x : 10;
  let y = typeof baseBox?.y === 'number' ? baseBox.y : 15;
  let height = typeof baseBox?.height === 'number' ? baseBox.height : 4.5;
  const existingWidth = typeof baseBox?.width === 'number' ? baseBox.width : 0;

  // If text wraps over multiple lines (e.g., text length > 45 characters),
  // dynamically expand height slightly to avoid vertical text clipping.
  if (len > 45 && height < 7) {
    height = Math.round((height * 1.45) * 10) / 10;
  } else if (len > 75 && height < 10) {
    height = Math.round((height * 1.8) * 10) / 10;
  }

  // Dynamically compute width based on text length + consistent padding
  let dynamicWidth = calculateDynamicWidth(text, height, existingWidth, {
    paddingMultiplier,
    ...options,
  });

  // Clamp and adjust coordinates to avoid clipping at container boundaries
  const clampToContainer = options.clampToContainer !== false;
  if (clampToContainer) {
    // If x + dynamicWidth exceeds boundary (98.5%), shift x leftward if possible
    if (x + dynamicWidth > 98.5) {
      const overflow = x + dynamicWidth - 98.5;
      if (x - overflow >= 1.5) {
        x = Math.round((x - overflow) * 10) / 10;
      } else {
        x = 1.5;
        dynamicWidth = Math.min(dynamicWidth, 97);
      }
    }
    // Prevent top/bottom clipping
    if (y + height > 98.5) {
      y = Math.max(1.5, 98.5 - height);
    }
  }

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    width: Math.round(dynamicWidth * 10) / 10,
    height: Math.round(height * 10) / 10,
    contentLength: len,
    paddingMultiplier,
    isDynamicallySized: true,
  };
}
