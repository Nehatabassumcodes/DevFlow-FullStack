import { z } from 'zod';

// Shared building blocks for the project and task schemas.

export function uuidSchema(label: string) {
  return z.string({ invalid_type_error: `${label} must be a string` }).uuid(`Invalid ${label}`);
}

// Accepts "YYYY-MM-DD" (treated as midnight UTC) or a full ISO 8601 date-time
// that includes a timezone ("2026-10-01T09:00:00Z" / "...+05:30"). A time
// without a timezone is rejected because its meaning would depend on the server.
const ISO_DATE =
  /^(\d{4})-(\d{2})-(\d{2})(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2}))?$/;

export function dateSchema(label: string) {
  const invalid = `${label} must be a valid ISO date (YYYY-MM-DD) or date-time with timezone`;
  return z
    .string({ invalid_type_error: invalid })
    .trim()
    .transform((value, ctx) => {
      const match = ISO_DATE.exec(value);
      if (match) {
        const [, y, m, d] = match;
        const asUtc = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
        const calendarOk =
          asUtc.getUTCFullYear() === Number(y) &&
          asUtc.getUTCMonth() === Number(m) - 1 &&
          asUtc.getUTCDate() === Number(d);
        const parsed = new Date(value);
        if (calendarOk && !Number.isNaN(parsed.getTime())) return parsed;
      }
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: invalid });
      return z.NEVER;
    });
}

// Optional long text: trimmed, and an empty string is stored as null.
export function descriptionSchema(max = 2000) {
  return z
    .string({ invalid_type_error: 'Description must be a string' })
    .trim()
    .max(max, `Description must be at most ${max} characters`)
    .transform((value) => (value === '' ? null : value));
}
