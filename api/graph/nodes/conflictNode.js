const FIELD_PATTERNS = [
  {
    label: "Price",
    re: /price\s*:\s*([^\n]+)/i,
    keywords: ["price", "cost", "charge", "fee", "rate", "how much", "pricing"],
  },
  {
    label: "Annual Cost",
    re: /(?:total\s+annual\s+cost|annual\s+cost)\s*:\s*([^\n]+)/i,
    keywords: ["annual", "yearly", "year", "total cost", "annual cost"],
  },
  {
    label: "Discount",
    re: /(?:discount|annual\s+subscribers?\s+receive)\s*[:\s]+([^\n.]+)/i,
    keywords: ["discount", "offer", "deal", "rebate", "off", "saving"],
  },
  {
    label: "Users",
    re: /up\s+to\s+([\d,]+\s+users)/i,
    keywords: ["user", "users", "seats", "team", "members", "people"],
  },
  {
    label: "Support",
    re: /support\s*[:\-]?\s*([^\n]+)/i,
    keywords: ["support", "help", "assistance", "service"],
  },
];

function extractFields(text) {
  const fields = {};
  for (const { label, re } of FIELD_PATTERNS) {
    const match = text.match(re);
    if (match) fields[label] = match[1].trim();
  }
  return fields;
}

function relevantFields(question) {
  const q = question.toLowerCase();
  // If no specific field matches, return all fields (generic question)
  const matched = FIELD_PATTERNS.filter(({ keywords }) =>
    keywords.some((kw) => q.includes(kw)),
  ).map(({ label }) => label);
  return matched.length > 0 ? new Set(matched) : null; // null = show all
}

export function conflictNode(state) {
  const { chunks, question } = state;
  const conflicts = [];
  const timelineMap = new Map();

  const allowedFields = relevantFields(question || "");

  for (let i = 0; i < chunks.length; i++) {
    for (let j = i + 1; j < chunks.length; j++) {
      const a = chunks[i];
      const b = chunks[j];

      if (a.metadata.source === b.metadata.source) continue;
      if (a.metadata.type !== b.metadata.type) continue;

      const fieldsA = extractFields(a.text);
      const fieldsB = extractFields(b.text);

      const sharedFields = Object.keys(fieldsA).filter(
        (k) => fieldsB[k] !== undefined && fieldsA[k] !== fieldsB[k],
      );

      if (sharedFields.length === 0) continue;

      const dateA = new Date(a.metadata.date || 0);
      const dateB = new Date(b.metadata.date || 0);
      const trusted = dateA >= dateB ? a : b;
      const rejected = dateA >= dateB ? b : a;

      conflicts.push({
        trusted,
        rejected,
        explanation: `Conflict between "${trusted.metadata.source.split("/").pop()}" (${trusted.metadata.date}) and "${rejected.metadata.source.split("/").pop()}" (${rejected.metadata.date}). Trusting newer source.`,
      });

      // Only add timeline entries for fields relevant to the question
      for (const label of sharedFields) {
        if (allowedFields && !allowedFields.has(label)) continue;

        if (!timelineMap.has(label)) timelineMap.set(label, []);
        const entries = timelineMap.get(label);

        const addEntry = (chunk, fields) => {
          const alreadyAdded = entries.some(
            (e) =>
              e.source === chunk.metadata.source && e.value === fields[label],
          );
          if (!alreadyAdded) {
            entries.push({
              date: chunk.metadata.date || null,
              value: fields[label],
              source: chunk.metadata.source,
              isTrusted: chunk === trusted,
            });
          }
        };

        addEntry(a, fieldsA);
        addEntry(b, fieldsB);
      }
    }
  }

  const timeline = [];
  for (const [label, entries] of timelineMap.entries()) {
    const sorted = entries.sort(
      (a, b) => new Date(a.date || 0) - new Date(b.date || 0),
    );
    timeline.push({ topic: label, entries: sorted });
  }

  return { ...state, conflicts, timeline };
}
