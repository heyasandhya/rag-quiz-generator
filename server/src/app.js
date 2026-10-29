import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import apiRouter from "./routes/api.js";
import { clearExpiredSessions } from "./services/quiz.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false }));
app.use("/api", apiRouter);

app.use((err, _req, res, _next) => {
  console.error("[API ERROR]", err.message);
  const status = err.name === "MulterError" ? 400 : 500;
  res.status(status).json({
    success: false,
    message: status === 400 ? err.message : (err.message || "An unexpected server error occurred.")
  });
});

setInterval(clearExpiredSessions, 15 * 60 * 1000).unref();

app.listen(env.port, () => {
  console.log(`RAG Quiz API running at http://localhost:${env.port}`);
});
