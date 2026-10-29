import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");
const storePath = path.join(dataDir, "vectors.json");
let recordsPromise;

async function records() {
  if (!recordsPromise) {
    recordsPromise = (async () => {
      await fs.mkdir(dataDir, { recursive: true });
      try {
        const parsed = JSON.parse(await fs.readFile(storePath, "utf8"));
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
      }
    })();
  }
  return recordsPromise;
}

async function persist(items) {
  await fs.mkdir(dataDir, { recursive: true });
  const tempPath = `${storePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(items), "utf8");
  await fs.rename(tempPath, storePath);
}

export async function addChunks({ ids, embeddings, documents, metadatas }) {
  const items = await records();
  const next = items.filter(item => !ids.includes(item.id));
  for (let i = 0; i < ids.length; i++) {
    next.push({ id: ids[i], embedding: embeddings[i], text: documents[i], metadata: metadatas[i] });
  }
  await persist(next);
  recordsPromise = Promise.resolve(next);
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return -1;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : -1;
}

export async function searchChunks({ documentId, queryEmbedding, limit = 12 }) {
  const items = await records();
  return items
    .filter(item => item.metadata?.documentId === documentId)
    .map(item => ({ ...item, score: cosineSimilarity(queryEmbedding, item.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function getChunkCount(documentId) {
  return (await records()).filter(item => item.metadata?.documentId === documentId).length;
}

export async function getStoreStatus() {
  try { await records(); return "ready"; }
  catch { return "error"; }
}
