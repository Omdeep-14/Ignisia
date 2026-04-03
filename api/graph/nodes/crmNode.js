export function crmNode(state) {
  const { question, answer, sources, conflicts } = state;

  const crmTicket = {
    id: `TKT-${Date.now()}`,
    createdAt: new Date().toISOString(),
    query: question,
    summary: answer.slice(0, 300) + (answer.length > 300 ? "..." : ""),
    fullAnswer: answer,
    sources: sources,
    hasConflict: conflicts.length > 0,
    conflictNote: conflicts.map((c) => c.explanation).join("; ") || null,
    status: "open",
  };

  return { ...state, crmTicket };
}
