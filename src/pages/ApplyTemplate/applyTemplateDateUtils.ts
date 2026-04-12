import { format } from "date-fns";

/**
 * Parse values from MyInput datetime, RSuite DatePicker (Date), or ISO-ish strings.
 * Avoids `new Date("DD-MM-YYYY ...")` which is locale-ambiguous and breaks Spring LocalDate query params.
 */
export function parseApplyTemplateDateTime(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const raw = value.trim();
    const dmy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
    if (dmy) {
      const dd = Number(dmy[1]);
      const mm = Number(dmy[2]);
      const yyyy = Number(dmy[3]);
      const hh = dmy[4] != null ? Number(dmy[4]) : 0;
      const min = dmy[5] != null ? Number(dmy[5]) : 0;
      if (![dd, mm, yyyy, hh, min].some(n => Number.isNaN(n))) {
        const d = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
        if (!Number.isNaN(d.getTime())) return d;
      }
    }
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/** For @RequestParam LocalDate — always yyyy-MM-dd */
export function formatLocalDateForApi(value: unknown): string {
  const d = parseApplyTemplateDateTime(value);
  return d ? format(d, "yyyy-MM-dd") : "";
}

/** For JSON LocalDateTime / ISO-style fields Spring accepts */
export function formatLocalDateTimeForApi(value: unknown): string {
  const d = parseApplyTemplateDateTime(value);
  return d ? format(d, "yyyy-MM-dd'T'HH:mm:ss") : "";
}
