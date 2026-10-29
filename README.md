# RAG Quiz Generator

A full-stack app that accepts a text-based PDF, indexes its text chunks in a lightweight local JSON vector store, uses Gemini to generate five multiple-choice questions grounded in retrieved document content, and evaluates answers on the server.

## Requirements

- Node.js 20+
- No Docker or separate database server required
- Gemini API key from Google AI Studio

## 1. Install dependencies

From the project root in VS Code terminal:

```powershell
npm install
Copy-Item server/.env.example server/.env
```

Open `server/.env` and add your `GEMINI_API_KEY`.

## 2. Local vector storage

No database service is needed. The backend stores chunk embeddings in `server/data/vectors.json` and ranks matching passages using cosine similarity. The data file is created automatically when you upload a PDF.

## 3. Start the app

From the project root:

```powershell
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

## How it works

1. Upload a text-based PDF.
2. The server extracts text with `pdf-parse`, splits it into overlapping chunks, embeds chunks with Gemini, and stores them in the local JSON vector store.
3. The server retrieves relevant chunks and asks Gemini for exactly five document-grounded questions.
4. The frontend receives questions/options only. The answer key remains server-side.
5. Submit answers to get a server-calculated score and review.

## Notes / limitations

- Scanned/image-only PDFs need OCR; this starter reports an error when no extractable text is found.
- This starter keeps quiz sessions in server memory. Restarting the server clears quiz sessions; document chunks remain in `server/data/vectors.json`.
- The local JSON vector store is intended for development/demo use. It loads the stored vectors into memory and writes updates to disk; for large datasets or multi-user production use, replace it with a managed vector database.
- Gemini model names can change. If your account does not support the configured model, update `GEMINI_MODEL` and `GEMINI_EMBEDDING_MODEL` in `server/.env` to currently available models.
- API key usage may incur charges or be subject to quotas. Never commit `server/.env`.

## Troubleshooting

- `GEMINI_API_KEY is missing`: set it in `server/.env`, then restart the backend.
- Vector storage errors: ensure the backend can write to `server/data/`.
- No text extracted: use a text-based PDF or add OCR support.
- Gemini 429/quota error: check your API quota and try later.
- Port in use: change `PORT` in `server/.env` or close the process using that port.

## GitHub

Create an empty public repository, then run:

```powershell
git init
git add .
git commit -m "Build RAG quiz generator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Replace the repository URL with your own. Do not push `.env` or private PDFs.
