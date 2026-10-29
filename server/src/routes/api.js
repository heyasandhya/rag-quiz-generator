import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { env } from "../config/env.js";
import { extractPdfText, chunkText } from "../services/pdf.js";
import { embedTexts } from "../services/gemini.js";
import { addChunks, getStoreStatus } from "../services/vectorStore.js";
import { generateQuiz, submitQuiz } from "../services/quiz.js";

const router = Router();
const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (_req, _file, cb) => cb(null, `rag-pdf-${randomUUID()}.pdf`)
});
const upload = multer({
  storage,
  limits: { fileSize: env.maxPdfMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === "application/pdf" || path.extname(file.originalname).toLowerCase() === ".pdf";
    cb(isPdf ? null : new Error("Only PDF files are allowed."), isPdf);
  }
});

const documentStates = new Map();

router.get("/health", async (_req, res) => {
  const vectorStore = await getStoreStatus();
  res.json({ success: true, status: "ok", vectorStore, geminiConfigured: Boolean(env.geminiApiKey) });
});

router.post("/documents/upload", upload.single("pdf"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ success: false, message: "Please choose a PDF file." });
  const documentId = randomUUID();
  documentStates.set(documentId, { status: "processing", stage: "extracting_text", error: null });
  // Process synchronously so the response only reports ready after indexing succeeds.
  try {
    const { text, pages } = await extractPdfText(req.file.path);
    documentStates.set(documentId, { status: "processing", stage: "chunking", error: null });
    const chunks = chunkText(text);
    if (chunks.length < 2) throw new Error("The PDF contains too little text to index. Upload a longer document.");
    documentStates.set(documentId, { status: "processing", stage: "embedding", error: null });
    const embeddings = await embedTexts(chunks);
    documentStates.set(documentId, { status: "processing", stage: "indexing", error: null });
    const ids = chunks.map((_, i) => `${documentId}-${i}`);
    await addChunks({
      ids, embeddings, documents: chunks,
      metadatas: chunks.map((_, i) => ({ documentId, chunkIndex: i, originalName: String(req.file.originalname).slice(0, 200) }))
    });
    documentStates.set(documentId, { status: "ready", stage: "ready", error: null, pageCount: pages, chunkCount: chunks.length, filename: req.file.originalname });
    res.status(201).json({
      success: true,
      documentId,
      filename: req.file.originalname,
      pageCount: pages,
      chunkCount: chunks.length,
      status: "ready",
      message: "PDF processed and indexed successfully."
    });
  } catch (error) {
    await fs.unlink(req.file.path).catch(() => {});
    documentStates.set(documentId, { status: "error", stage: "error", error: error.message });
    next(error);
  }
});

router.get("/documents/:documentId/status", (req, res) => {
  const state = documentStates.get(req.params.documentId);
  if (!state) return res.status(404).json({ success: false, message: "Document not found in this server session." });
  res.json({ success: true, documentId: req.params.documentId, ...state });
});

router.post("/quizzes/generate", async (req, res, next) => {
  try {
    const { documentId } = req.body || {};
    if (!documentId || documentStates.get(documentId)?.status !== "ready") {
      return res.status(400).json({ success: false, message: "Upload and process a PDF before generating a quiz." });
    }
    const quiz = await generateQuiz(documentId);
    res.json({ success: true, ...quiz });
  } catch (error) { next(error); }
});

router.post("/quizzes/:quizId/submit", (req, res, next) => {
  try {
    const result = submitQuiz(req.params.quizId, req.body?.answers);
    res.json({ success: true, result });
  } catch (error) { next(error); }
});

export default router;
