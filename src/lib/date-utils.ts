export function parseEventDate(dateStr: string | null): number {
    if (!dateStr) return 0;

    // Handle DD/MM/YYYY
    const ddMmYyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddMmYyyyMatch) {
        const [_, day, month, year] = ddMmYyyyMatch;
        // Month is 0-indexed in JS Date
        return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
        ).getTime();
    }

    // Ensure 'IST' is handled properly if it exists by stripping it (JS Date handles timezone poorly)
    // or replacing it with +05:30. Let's replace 'IST' with '+05:30' if it looks like a time string
    let sanitizedStr = dateStr;
    if (sanitizedStr.includes("IST")) {
        sanitizedStr = sanitizedStr.replace("IST", "+05:30");
    }

    const parsed = new Date(sanitizedStr).getTime();
    if (!isNaN(parsed)) {
        return parsed;
    }

    // Fallback: Try regex matching for formats like "September 11, 2024"
    const wordMonthMatch = dateStr.match(
        /([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})(.*)/,
    );
    if (wordMonthMatch) {
        const [_, monthStr, day, year, rest] = wordMonthMatch;
        const timeStr = rest.trim() || "";
        // Reconstruct a standard format
        const tempDate = new Date(`${monthStr} ${day}, ${year} ${timeStr}`);
        if (!isNaN(tempDate.getTime())) {
            return tempDate.getTime();
        }
    }

    // Return 0 if completely unparseable
    return 0;
}
