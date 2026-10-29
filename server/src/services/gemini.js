import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

function getAI() {
  if (!env.geminiApiKey) throw new Error("GEMINI_API_KEY is missing. Add it to server/.env and restart the server.");
  return new GoogleGenAI({ apiKey: env.geminiApiKey });
}

export async function embedTexts(texts) {
  const ai = getAI();
  const vectors = [];
  // Embed in small batches to avoid oversized requests.
  for (let i = 0; i < texts.length; i += 16) {
    const batch = texts.slice(i, i + 16);
    const result = await Promise.all(batch.map(async (text) => {
      const response = await ai.models.embedContent({
        model: env.embeddingModel,
        contents: text
      });
      const values = response.embeddings?.[0]?.values;
      if (!values?.length) throw new Error("Gemini returned an empty embedding.");
      return values;
    }));
    vectors.push(...result);
  }
  return vectors;
}

export async function generateJson(prompt) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.3
    }
  });
  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Gemini returned malformed JSON. Please try generating the quiz again.");
  }
}
