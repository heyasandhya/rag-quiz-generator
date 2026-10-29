import { useMemo, useState } from "react";
import {
  BookOpen, BrainCircuit, CheckCircle2, ChevronLeft, ChevronRight,
  CircleHelp, FileText, FileUp, LoaderCircle, RefreshCw, ShieldCheck,
  Sparkles, UploadCloud, XCircle, Zap
} from "lucide-react";
import api, { getErrorMessage } from "./services/api.js";

const stageLabels = {
  extracting_text: "Extracting PDF text",
  chunking: "Splitting text into chunks",
  embedding: "Generating embeddings",
  indexing: "Indexing document in ChromaDB",
  ready: "Document ready"
};

export default function App() {
  const [file, setFile] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  const currentQuestion = quiz?.questions?.[questionIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  function resetAll() {
    setFile(null); setDocumentInfo(null); setQuiz(null); setAnswers({});
    setResult(null); setBusy(false); setStage(""); setError(""); setQuestionIndex(0);
  }

  function selectFile(nextFile) {
    setError("");
    setDocumentInfo(null); setQuiz(null); setResult(null); setAnswers({});
    if (!nextFile) return;
    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF file.");
      return;
    }
    if (nextFile.size > 15 * 1024 * 1024) {
      setError("The PDF must be smaller than 15 MB.");
      return;
    }
    setFile(nextFile);
  }

  async function uploadPdf() {
    if (!file) return setError("Choose a PDF before continuing.");
    setBusy(true); setError(""); setStage("Uploading PDF");
    const form = new FormData();
    form.append("pdf", file);
    try {
      setStage("Extracting text and indexing document");
      const { data } = await api.post("/documents/upload", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setDocumentInfo(data);
      setStage("ready");
    } catch (e) {
      setError(getErrorMessage(e));
      setStage("");
    } finally { setBusy(false); }
  }

  async function generateQuiz() {
    if (!documentInfo?.documentId) return;
    setBusy(true); setError(""); setStage("Retrieving relevant passages and generating questions");
    try {
      const { data } = await api.post("/quizzes/generate", { documentId: documentInfo.documentId });
      setQuiz(data);
      setAnswers({});
      setQuestionIndex(0);
      setResult(null);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); setStage(""); }
  }

  async function submitQuiz() {
    if (!quiz) return;
    if (answeredCount < quiz.questions.length && !window.confirm(`You've answered ${answeredCount} of ${quiz.questions.length} questions. Submit anyway?`)) return;
    if (!window.confirm("Submit your quiz? You won't be able to change answers afterwards.")) return;
    setBusy(true); setError("");
    try {
      const { data } = await api.post(`/quizzes/${quiz.quizId}/submit`, { answers });
      setResult(data.result);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); }
  }

  const isQuiz = Boolean(quiz && !result);
  const isResults = Boolean(result);

  return (
    <div className="min-h-screen bg-soft text-ink">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button className="flex items-center gap-3 text-left" onClick={resetAll} aria-label="Go to dashboard">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-indigo-200"><BrainCircuit size={22}/></span>
            <span><span className="block text-sm font-extrabold tracking-tight sm:text-base">RAG Quiz Generator</span><span className="block text-xs text-muted">Learn from your own documents</span></span>
          </button>
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex"><ShieldCheck size={15}/> Document-grounded AI</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        {!isQuiz && !isResults && (
          <>
            <section className="mb-9 grid items-center gap-8 lg:grid-cols-[1.15fr_.85fr]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-brand"><Sparkles size={14}/> AI-powered study workspace</div>
                <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">Turn any PDF into your next <span className="text-brand">practice quiz.</span></h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-muted">Upload your notes, textbook chapter, or study guide. RAG retrieves relevant passages so your questions stay grounded in the document.</p>
                <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-600"/> 5 multiple-choice questions</span>
                  <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-600"/> Instant answer review</span>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 p-7 text-white shadow-card sm:p-8">
                <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[28px] border-white/10"></div>
                <div className="relative">
                  <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><Zap size={24}/></div>
                  <p className="text-sm font-semibold text-indigo-100">HOW IT WORKS</p>
                  <h2 className="mt-2 text-2xl font-bold">From document to understanding.</h2>
                  <div className="mt-6 space-y-4">
                    {[["01","Upload your PDF","We extract and prepare the text."],["02","Retrieve + generate","Relevant passages guide the AI."],["03","Take the quiz","Submit answers to see your score."]].map(([n,t,d]) => <div className="flex gap-3" key={n}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/15 text-xs font-extrabold">{n}</span><div><p className="font-bold">{t}</p><p className="mt-0.5 text-sm text-indigo-100">{d}</p></div></div>)}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
                <div className="mb-5 flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-brand"><FileUp size={21}/></div><div><h2 className="text-lg font-extrabold">Upload your document</h2><p className="mt-1 text-sm text-muted">PDF only · Maximum 15 MB · Text-based PDFs</p></div></div>
                <label onDragOver={e => {e.preventDefault(); setDragging(true);}} onDragLeave={() => setDragging(false)} onDrop={e => {e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files?.[0]);}} className={`flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${dragging ? "border-brand bg-indigo-50" : "border-slate-200 bg-slate-50/80 hover:border-indigo-300 hover:bg-indigo-50/50"}`}>
                  <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={e => selectFile(e.target.files?.[0])}/>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand shadow-sm"><UploadCloud size={28}/></span>
                  <span className="mt-4 font-bold">{file ? file.name : "Drop your PDF here or browse"}</span>
                  <span className="mt-1 text-sm text-muted">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload` : "Choose a document to get started"}</span>
                </label>
                {documentInfo && <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20}/><div><p className="font-bold text-emerald-900">Document indexed successfully</p><p className="mt-1 text-sm text-emerald-800">{documentInfo.filename} · {documentInfo.chunkCount} chunks{documentInfo.pageCount ? ` · ${documentInfo.pageCount} pages` : ""}</p></div></div>}
                {busy && <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand"><LoaderCircle className="animate-spin" size={17}/>{stage || "Working..."}</div>}
                {error && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><XCircle className="mt-0.5 shrink-0" size={17}/><span>{error}</span></div>}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button disabled={!file || busy || Boolean(documentInfo)} onClick={uploadPdf} className="btn-primary flex-1"><FileText size={17}/>{busy && !documentInfo ? "Processing..." : "Upload & process PDF"}</button>
                  <button disabled={!documentInfo || busy} onClick={generateQuiz} className="btn-secondary flex-1"><Sparkles size={17}/>{busy && documentInfo ? "Generating..." : "Generate 5 questions"}</button>
                </div>
                {documentInfo && <button onClick={() => {setFile(null);setDocumentInfo(null);setQuiz(null);setResult(null);setError("");}} className="mt-3 text-sm font-semibold text-brand hover:underline">Choose a different PDF</button>}
              </div>

              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                  <h3 className="font-extrabold">Your workflow</h3>
                  <div className="mt-5 space-y-4">
                    {[
                      [FileText,"Upload & extract","Text is extracted from your PDF."],
                      [BrainCircuit,"RAG + embeddings","Chunks are embedded and retrieved from ChromaDB."],
                      [CircleHelp,"AI quiz","Gemini creates five document-based questions."],
                      [CheckCircle2,"Score & review","Your answers are checked securely on the server."]
                    ].map(([Icon,title,desc],i)=><div className="flex gap-3" key={title}><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${documentInfo && i < 2 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}><Icon size={19}/></div><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-muted">{desc}</p></div></div>)}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Heads up:</strong> Scanned PDFs that contain only images need OCR. This version supports PDFs with selectable/extractable text.</div>
              </div>
            </section>
          </>
        )}

        {isQuiz && currentQuestion && (
          <section className="mx-auto max-w-3xl">
            <button onClick={() => {if(window.confirm("Leave this quiz? Your current answers will be lost.")){setQuiz(null);setAnswers({});}}} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-ink"><ChevronLeft size={17}/> Back to dashboard</button>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-extrabold text-brand">PRACTICE QUIZ</span><span className="text-sm font-semibold text-muted">Question {questionIndex + 1} of {quiz.questions.length}</span></div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand transition-all" style={{width:`${((questionIndex+1)/quiz.questions.length)*100}%`}}/></div>
              <h1 className="mt-8 text-2xl font-extrabold leading-snug sm:text-3xl">{currentQuestion.question}</h1>
              <div className="mt-7 space-y-3">
                {Object.entries(currentQuestion.options).map(([key,value])=><label key={key} className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${answers[currentQuestion.id]===key ? "border-brand bg-indigo-50 ring-1 ring-brand" : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"}`}><input className="sr-only" type="radio" name={currentQuestion.id} checked={answers[currentQuestion.id]===key} onChange={()=>setAnswers(a=>({...a,[currentQuestion.id]:key}))}/><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${answers[currentQuestion.id]===key ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>{key}</span><span className="pt-1 text-sm font-medium leading-6">{value}</span></label>)}
              </div>
              <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row"><button disabled={questionIndex===0} onClick={()=>setQuestionIndex(i=>i-1)} className="btn-outline"><ChevronLeft size={17}/> Previous</button>{questionIndex < quiz.questions.length-1 ? <button onClick={()=>setQuestionIndex(i=>i+1)} className="btn-primary">Next question <ChevronRight size={17}/></button> : <button disabled={busy} onClick={submitQuiz} className="btn-primary">{busy ? <LoaderCircle className="animate-spin" size={17}/> : <CheckCircle2 size={17}/>} Submit quiz</button>}</div>
              <p className="mt-5 text-center text-xs text-muted">{answeredCount} of {quiz.questions.length} answered · Your correct answers stay hidden until submission</p>
              {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </div>
          </section>
        )}

        {isResults && (
          <section className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-7 text-white shadow-card sm:p-10">
              <div className="flex flex-col items-center text-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15"><CheckCircle2 size={32}/></span>
                <p className="mt-5 text-sm font-bold uppercase tracking-widest text-indigo-100">Quiz complete</p>
                <h1 className="mt-2 text-4xl font-black sm:text-5xl">{result.score}<span className="text-2xl text-indigo-100">/{result.total}</span></h1>
                <p className="mt-2 text-lg font-semibold">{result.percentage}% score</p>
                <div className="mt-6 flex gap-3"><span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">{result.correctCount} correct</span><span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">{result.incorrectCount} incorrect</span></div>
                <button onClick={resetAll} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-brand hover:bg-indigo-50"><RefreshCw size={17}/> Start another quiz</button>
              </div>
            </div>
            <div className="mt-7 space-y-4">
              <h2 className="text-xl font-extrabold">Answer review</h2>
              {result.questions.map((q,i)=><article key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${q.isCorrect?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{q.isCorrect?<CheckCircle2 size={18}/>:<XCircle size={18}/>}</span><div className="min-w-0 flex-1"><p className="font-extrabold leading-6">{i+1}. {q.question}</p><div className="mt-4 space-y-2">{Object.entries(q.options).map(([key,value])=><div key={key} className={`rounded-xl px-3 py-2 text-sm ${key===q.correctAnswer?"bg-emerald-50 font-semibold text-emerald-800":key===q.selectedAnswer?"bg-red-50 text-red-800":"bg-slate-50 text-slate-600"}`}><strong>{key}.</strong> {value}{key===q.correctAnswer?" — Correct answer":key===q.selectedAnswer?" — Your answer":""}</div>)}</div><p className="mt-4 text-sm leading-6 text-muted"><strong className="text-ink">Why:</strong> {q.explanation}</p>{q.sourceReference && <p className="mt-2 text-xs text-muted">Source: {q.sourceReference}</p>}</div></div></article>)}
            </div>
          </section>
        )}
      </main>
      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>RAG Quiz Generator · Built for document-grounded learning</span><span className="flex items-center gap-1.5"><ShieldCheck size={14}/> Answers are evaluated by the backend</span></div></footer>
    </div>
  );
}
