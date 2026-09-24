/**
 * Utility for parsing and formatting feature lists for subscription packages.
 * Supports:
 * - JavaScript/TypeScript array strings with quotes and trailing commas
 * - JSON arrays
 * - Bullet lists (- , * , • , +)
 * - Numbered lists (1. , 2) , [3])
 * - Plain multi-line text (newline separated)
 * - Comma-separated quoted strings
 * 
 * Preserves the exact serial order as input.
 */

export function parseFeaturesList(raw: string): string[] {
  if (!raw || typeof raw !== "string") return [];
  const text = raw.trim();
  if (!text) return [];

  // 1. Try parsing JSON array directly
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter((item) => item.length > 0);
      }
    } catch {
      // Fall through to line-by-line parsing
    }
  }

  // 2. Line by line parsing
  const lines = text.split(/\r?\n/);
  const items: string[] = [];

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Skip isolated brackets, closing array syntax, semicolons
    if (/^[\[\]\{\};,]+$/.test(line)) continue;

    // Check if line contains multiple quoted items e.g. "Item 1", "Item 2"
    const multiQuotePattern = /["'“`‘]([^"'”`’]+)["'”`’]/g;
    const matches = Array.from(line.matchAll(multiQuotePattern));
    if (matches.length > 1) {
      for (const m of matches) {
        const extracted = m[1].trim();
        if (extracted) items.push(extracted);
      }
      continue;
    }

    // Strip trailing comma, semicolon
    line = line.replace(/[,;]+$/, "").trim();

    // Strip bullet points or numbered prefixes
    line = line.replace(/^(?:[-*•+>]|\(?\d+[\.\)]|\[\d+\])\s*/, "");

    // Strip surrounding quotes
    if (
      (line.startsWith('"') && line.endsWith('"')) ||
      (line.startsWith("'") && line.endsWith("'")) ||
      (line.startsWith("“") && line.endsWith("”")) ||
      (line.startsWith("‘") && line.endsWith("’")) ||
      (line.startsWith("`") && line.endsWith("`"))
    ) {
      line = line.slice(1, -1).trim();
    }

    // Secondary cleanup of trailing commas or stray quotes
    line = line.replace(/[,;]+$/, "").trim();
    if (
      (line.startsWith('"') && line.endsWith('"')) ||
      (line.startsWith("'") && line.endsWith("'"))
    ) {
      line = line.slice(1, -1).trim();
    }

    // Unescape quotes
    line = line.replace(/\\"/g, '"').replace(/\\'/g, "'");

    if (line) {
      items.push(line);
    }
  }

  // If results is 0 or 1, but text contains multiple comma-separated quoted tokens on single line
  if (items.length <= 1 && text.includes(",")) {
    const quoteMatches = Array.from(text.matchAll(/["'“`‘]([^"'”`’]+)["'”`’]/g));
    if (quoteMatches.length > 1) {
      return quoteMatches.map((m) => m[1].trim()).filter(Boolean);
    }
  }

  return items;
}

/**
 * Formats a list of features as quoted lines with trailing commas,
 * ready for copying or pasting in code/JSON.
 */
export function formatFeaturesAsQuotedLines(features: string[]): string {
  if (!features || !features.length) return "";
  return features.map((f) => `  "${f}",`).join("\n");
}
