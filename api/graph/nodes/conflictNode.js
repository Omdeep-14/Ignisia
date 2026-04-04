export function conflictNode(state) {
  const { chunks } = state;
  const uniqueConflicts = new Map();

  for (let i = 0; i < chunks.length; i++) {
    for (let j = i + 1; j < chunks.length; j++) {
      const a = chunks[i];
      const b = chunks[j];

      // Skip chunks from the same source
      if (a.metadata.source === b.metadata.source) continue;

      // Removed strict type checking to allow Email vs PDF conflicts as requested by the user twist

      // Check for numeric/price contradictions
      const priceRe = /\$?[\d,]+\.?\d*\s*(USD|INR|GBP|EUR|%)?/gi;
      const pricesA = new Set(
        (a.text.match(priceRe) || []).map((p) => p.trim().toLowerCase()),
      );
      const pricesB = new Set(
        (b.text.match(priceRe) || []).map((p) => p.trim().toLowerCase()),
      );

      const hasOverlappingTopics = a.text
        .toLowerCase()
        .split(" ")
        .filter((w) => w.length > 5)
        .some((w) => b.text.toLowerCase().includes(w));

      const hasDifferentValues =
        pricesA.size > 0 &&
        pricesB.size > 0 &&
        [...pricesA].every((p) => !pricesB.has(p));

      if (hasOverlappingTopics && hasDifferentValues) {
        const dateA = new Date(a.metadata.date || 0);
        const dateB = new Date(b.metadata.date || 0);
        const trusted = dateA >= dateB ? a : b;
        const rejected = dateA >= dateB ? b : a;

        const explanation = `Conflict between "${trusted.metadata.source}" (${trusted.metadata.date || "unknown date"}) and "${rejected.metadata.source}" (${rejected.metadata.date || "unknown date"}). Trusting newer source.`;
        const pairKey = [trusted.metadata.source, rejected.metadata.source].sort().join("|");

        if (!uniqueConflicts.has(pairKey)) {
           uniqueConflicts.set(pairKey, {
             trusted,
             rejected,
             explanation,
           });
        }
      }
    }
  }

  const conflicts = Array.from(uniqueConflicts.values());

  return { ...state, conflicts };
}
