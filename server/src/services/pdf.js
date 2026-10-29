import fs from "node:fs/promises";
import pdfParse from "pdf-parse";

export async function extractPdfText(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const parsed = await pdfParse(buffer);
    const text = (parsed.text || "").replace(/\u0000/g, "").trim();
    if (text.length < 100) {
      throw new Error("Very little text could be extracted. This may be a scanned PDF; this starter supports text-based PDFs only.");
    }
    return { text, pages: parsed.numpages || null };
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
}

export function chunkText(text, chunkSize = 1200, overlap = 180) {
  const normalized = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);
    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf(" ", end);
      if (boundary > start + Math.floor(chunkSize * 0.65)) end = boundary;
    }
    const chunk = normalized.slice(start, end).trim();
    if (chunk.length > 40) chunks.push(chunk);
    if (end >= normalized.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}
