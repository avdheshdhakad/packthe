/**
 * Digital Signature Storage and Rendering Helper for Legal Metrology Certificates
 */

export interface StoredSignOff {
  signed: boolean;
  signedBy: string;
  signedAt: string;
  badgeNumber: string;
  department?: string;
  signatureDataUrl: string;
  signatureType: 'draw' | 'typed';
  sealPlaced: boolean;
  sealPlacement: string;
  sealType?: string;
  notes?: string;
}

/**
 * Render an authentic cursive officer signature onto an offscreen canvas and export as PNG data URL.
 * Guaranteed 100% compatible with jsPDF doc.addImage(..., 'PNG').
 */
export function generateCursiveSignaturePng(name: string, title?: string): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Smooth rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw cursive signature text in fountain pen blue
  ctx.font = 'italic bold 42px "Caveat", "Brush Script MT", "Segoe Script", "Dancing Script", cursive, sans-serif';
  ctx.fillStyle = '#1d4ed8'; // Government blue ballpoint/fountain ink
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 24, 54);

  // Dynamic aesthetic underline flourish
  ctx.beginPath();
  ctx.moveTo(20, 84);
  ctx.bezierCurveTo(110, 68, 250, 94, 380, 80);
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Signature tail flourish loop
  ctx.beginPath();
  ctx.moveTo(380, 80);
  ctx.bezierCurveTo(405, 70, 415, 88, 395, 94);
  ctx.bezierCurveTo(375, 98, 390, 82, 420, 84);
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Terminal accent dot
  ctx.beginPath();
  ctx.arc(426, 84, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#1e40af';
  ctx.fill();

  if (title) {
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(title, 24, 114);
  }

  return canvas.toDataURL('image/png');
}

const STORAGE_PREFIX = 'lm_signoff_';
const USER_SIG_PREFIX = 'lm_user_sig_';

export function saveScanSignOff(scanId: string, signOff: StoredSignOff): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${scanId}`, JSON.stringify(signOff));
    if (signOff.signedBy) {
      localStorage.setItem(`${USER_SIG_PREFIX}${signOff.signedBy.toLowerCase().replace(/\s+/g, '_')}`, signOff.signatureDataUrl);
    }
  } catch (err) {
    console.warn('Failed to store signOff in localStorage:', err);
  }
}

export function getScanSignOff(scanId: string): StoredSignOff | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${scanId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getUserSavedSignature(userName: string): string | null {
  try {
    return localStorage.getItem(`${USER_SIG_PREFIX}${userName.toLowerCase().replace(/\s+/g, '_')}`);
  } catch {
    return null;
  }
}

// Generate default realistic signatures for the system officers
export const DEFAULT_OFFICER_SIGNATURES: Record<string, string> = {
  'Smt. Priya Sharma': generateCursiveSignaturePng('P. Sharma', 'Legal Metrology Officer'),
  'Rajesh Kumar Verma': generateCursiveSignaturePng('R. K. Verma', 'Inspector Legal Metrology'),
  'Dr. Ramesh Chandra': generateCursiveSignaturePng('R. Chandra', 'Director / Admin'),
};
