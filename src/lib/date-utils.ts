/**
 * Parses a date string into a UTC timestamp (milliseconds).
 * If no timezone is provided, it assumes IST (+05:30).
 */
export function parseEventDate(dateStr: string | null | undefined): number {
    if (!dateStr || dateStr.toUpperCase() === "TBA") return 0;

    let sanitizedStr = dateStr.trim();

    // 1. Handle 'IST' or other timezone suffixes early
    if (sanitizedStr.includes("IST")) {
        sanitizedStr = sanitizedStr.replace("IST", "+05:30");
    }

    // 2. Handle ISO 8601 with explicit timezone (Z or +/-XX:XX)
    const hasTimezone = /Z|[+-]\d{2}:?\d{2}$/.test(sanitizedStr);
    
    // 3. Handle DD/MM/YYYY or D/M/YY
    const slashMatch = sanitizedStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slashMatch) {
        const [_, day, month, yearStr] = slashMatch;
        let year = parseInt(yearStr);
        if (yearStr.length === 2) {
            year += year < 70 ? 2000 : 1900;
        }
        // Force to IST 00:00:00
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00+05:30`).getTime();
    }

    // 4. Handle YYYY-MM-DD
    const yyyyMmDdMatch = sanitizedStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyyMmDdMatch) {
        const [_, year, month, day] = yyyyMmDdMatch;
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00+05:30`).getTime();
    }

    // 5. General parsing
    let date = new Date(sanitizedStr);
    
    // If it failed to parse or doesn't have a timezone, try appending IST offset
    if (isNaN(date.getTime()) || (!hasTimezone && !sanitizedStr.includes("T"))) {
        // Only append if it looks like it might need it (doesn't already have an offset)
        if (!hasTimezone) {
            const withOffset = new Date(sanitizedStr + " +05:30");
            if (!isNaN(withOffset.getTime())) {
                return withOffset.getTime();
            }
        }
    }

    const finalTs = date.getTime();
    if (!isNaN(finalTs)) return finalTs;

    // 6. Fallback: Try regex matching for formats like "September 11, 2024 10:00 AM"
    const wordMonthMatch = sanitizedStr.match(
        /([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})(.*)/,
    );
    if (wordMonthMatch) {
        const [_, monthStr, day, year, rest] = wordMonthMatch;
        const timeStr = rest.trim() || "00:00:00";
        const tempDate = new Date(`${monthStr} ${day}, ${year} ${timeStr} +05:30`);
        if (!isNaN(tempDate.getTime())) {
            return tempDate.getTime();
        }
    }

    console.warn(`[date-utils] Failed to parse date string: "${dateStr}"`);
    return 0;
}

/**
 * Formats a date string into a human-readable date in IST.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr.toUpperCase() === "TBA") return dateStr || "";
  const ts = parseEventDate(dateStr);
  if (ts === 0) return dateStr;
  
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata"
  });
}
