// Parses a comma-separated list of allowed frontend origins (FRONTEND_ORIGIN).
// Each entry must be an http(s) URL; it is normalised to its origin, so a
// trailing slash or path ("http://localhost:3000/") is ignored.

export interface ParsedOrigins {
  origins: string[];
  invalid: string[];
}

export function parseOrigins(value: string): ParsedOrigins {
  const origins: string[] = [];
  const invalid: string[] = [];

  for (const raw of value.split(',').map((s) => s.trim()).filter(Boolean)) {
    try {
      const url = new URL(raw);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        invalid.push(raw);
        continue;
      }
      if (!origins.includes(url.origin)) origins.push(url.origin);
    } catch {
      invalid.push(raw);
    }
  }

  return { origins, invalid };
}
