export function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start += chunkSize - overlap; // slide forward with overlap
  }

  return chunks;
}

export function chunkDocument(parsedChunks) {
  const result = [];

  for (const chunk of parsedChunks) {
    const subChunks = chunkText(chunk.text);

    subChunks.forEach((text, i) => {
      result.push({
        ...chunk, // carry all metadata (source, date, type, page, etc.)
        text,
        chunkIndex: i,
        chunkTotal: subChunks.length,
        // Unique ID for ChromaDB upsert
        id: `${chunk.source}_${chunk.page || chunk.row || 0}_chunk${i}`,
      });
    });
  }

  return result;
}
