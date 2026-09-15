export function extractCleanCountry(rawCountryText: string): string {
  if (!rawCountryText || !rawCountryText.trim()) return 'NOT FOUND';
  const text = rawCountryText.trim();
  const lower = text.toLowerCase();

  if (
    lower === 'not found' ||
    lower === 'missing' ||
    lower === 'not detected' ||
    lower === 'untraceable' ||
    lower === 'n/a' ||
    lower === 'unknown'
  ) {
    return 'NOT FOUND';
  }

  // Extract from explicit statutory origin prefix e.g. "Country of Origin: India", "Made in Vietnam"
  const prefixMatch = text.match(
    /(?:country\s*of\s*origin|origin|made\s*in|product\s*of|mfd\s*in|mfg\s*in)[\s:.-]+([A-Za-z\s]{2,28})/i
  );
  if (prefixMatch && prefixMatch[1]) {
    const candidate = prefixMatch[1].trim();
    const candidateLower = candidate.toLowerCase();
    if (/\b(?:india|bharat)\b/i.test(candidateLower)) return 'INDIA';
    if (/\b(?:china|prc|p\.r\.c)\b/i.test(candidateLower)) return 'CHINA';
    if (/\b(?:vietnam|viet\s*nam)\b/i.test(candidateLower)) return 'VIETNAM';
    if (/\b(?:thailand)\b/i.test(candidateLower)) return 'THAILAND';
    if (/\b(?:germany|deutschland)\b/i.test(candidateLower)) return 'GERMANY';
    if (/\b(?:united\s*states|usa|u\.s\.a|america)\b/i.test(candidateLower)) return 'UNITED STATES';
    if (/\b(?:japan|nippon)\b/i.test(candidateLower)) return 'JAPAN';
    if (/\b(?:korea|south\s*korea)\b/i.test(candidateLower)) return 'SOUTH KOREA';
    if (/\b(?:taiwan)\b/i.test(candidateLower)) return 'TAIWAN';
    if (/\b(?:malaysia)\b/i.test(candidateLower)) return 'MALAYSIA';
    if (/\b(?:indonesia)\b/i.test(candidateLower)) return 'INDONESIA';
    if (/\b(?:united\s*kingdom|uk|u\.k|britain|england)\b/i.test(candidateLower)) return 'UNITED KINGDOM';
    if (/\b(?:france)\b/i.test(candidateLower)) return 'FRANCE';
    if (/\b(?:italy|italia)\b/i.test(candidateLower)) return 'ITALY';
    if (/\b(?:australia)\b/i.test(candidateLower)) return 'AUSTRALIA';
    if (/\b(?:canada)\b/i.test(candidateLower)) return 'CANADA';
    if (/\b(?:bangladesh)\b/i.test(candidateLower)) return 'BANGLADESH';
    if (/\b(?:sri\s*lanka)\b/i.test(candidateLower)) return 'SRI LANKA';
    if (/\b(?:nepal)\b/i.test(candidateLower)) return 'NEPAL';
    if (candidate.length >= 3 && candidate.length <= 25 && !/\d/.test(candidate)) {
      return candidate.toUpperCase();
    }
  }

  // Exact word boundary checks to avoid false matches (e.g. 'binder' or 'industrial' matching 'ind')
  if (/\b(?:india|bharat)\b/i.test(lower) || /\b(?:made\s*in\s*ind)\b/i.test(lower)) return 'INDIA';
  if (/\b(?:china|prc|p\.r\.c)\b/i.test(lower)) return 'CHINA';
  if (/\b(?:vietnam|viet\s*nam)\b/i.test(lower)) return 'VIETNAM';
  if (/\b(?:thailand)\b/i.test(lower)) return 'THAILAND';
  if (/\b(?:germany|deutschland)\b/i.test(lower)) return 'GERMANY';
  if (/\b(?:united\s*states|usa|u\.s\.a|america)\b/i.test(lower)) return 'UNITED STATES';
  if (/\b(?:japan|nippon)\b/i.test(lower)) return 'JAPAN';
  if (/\b(?:south\s*korea|republic\s*of\s*korea)\b/i.test(lower)) return 'SOUTH KOREA';
  if (/\b(?:taiwan)\b/i.test(lower)) return 'TAIWAN';
  if (/\b(?:malaysia)\b/i.test(lower)) return 'MALAYSIA';
  if (/\b(?:indonesia)\b/i.test(lower)) return 'INDONESIA';
  if (/\b(?:united\s*kingdom|uk|u\.k)\b/i.test(lower)) return 'UNITED KINGDOM';
  if (/\b(?:france)\b/i.test(lower)) return 'FRANCE';
  if (/\b(?:italy)\b/i.test(lower)) return 'ITALY';
  if (/\b(?:australia)\b/i.test(lower)) return 'AUSTRALIA';
  if (/\b(?:canada)\b/i.test(lower)) return 'CANADA';
  if (/\b(?:bangladesh)\b/i.test(lower)) return 'BANGLADESH';
  if (/\b(?:sri\s*lanka)\b/i.test(lower)) return 'SRI LANKA';
  if (/\b(?:nepal)\b/i.test(lower)) return 'NEPAL';

  // If text is short and looks like a single valid country name
  if (text.length <= 25 && /^[a-zA-Z\s.-]+$/.test(text) && !lower.includes('ingredient') && !lower.includes('caution')) {
    return text.toUpperCase();
  }

  return 'NOT FOUND';
}
