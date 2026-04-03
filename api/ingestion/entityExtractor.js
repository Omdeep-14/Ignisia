import { llm } from "../config/config.js";
import { supabase } from "../config/config.js";

export async function extractAndStoreEntities(documents, orgId) {
  for (const doc of documents) {
    try {
      const response = await llm.invoke([
        {
          role: "user",
          content: `Extract all numeric or factual claims from this text.
Return a JSON array only. No explanation, no markdown.
Format: [{"entity": "Q3 revenue", "value": "$4.2M"}]
If nothing found return: []

Text: ${doc.pageContent}`,
        },
      ]);

      const raw = response.content.trim().replace(/```json|```/g, "");
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed) || parsed.length === 0) continue;

      const rows = parsed.map((item) => ({
        org_id: orgId,
        entity_name: item.entity.toLowerCase().trim(),
        value: item.value,
        source: doc.metadata.source,
        source_type: doc.metadata.type,
        date: doc.metadata.date ?? new Date().toISOString(),
      }));

      const { error } = await supabase.from("entities").insert(rows);
      if (error) console.error("[entities] insert error:", error.message);
    } catch (err) {
      console.error("[entities] extraction failed for chunk:", err.message);
    }
  }
}
