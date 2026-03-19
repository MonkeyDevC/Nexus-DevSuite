/**
 * AI Service — Llamada a modelo de lenguaje para Nexus DevSuite.
 * Usado por ai-review. Configuración vía OPENAI_API_KEY o AI_API_URL.
 * Nunca envía tokens/passwords/secrets; enmascara contenido sensible.
 */

const logger = require("../../config/logger");

const SENSITIVE_PATTERNS = [
  { pattern: /(?:password|passwd|pwd|secret)\s*[:=]\s*["']?[^"'\s]+/gi, replace: "[REDACTED_PASSWORD]" },
  { pattern: /(?:api[_-]?key|apikey|token)\s*[:=]\s*["']?[^"'\s]+/gi, replace: "[REDACTED_TOKEN]" },
  { pattern: /(?:bearer)\s+[a-zA-Z0-9_.-]+/gi, replace: "[REDACTED_BEARER]" },
  { pattern: /(?:aws_secret|private[_-]?key)\s*[:=]\s*["']?[^"'\s]+/gi, replace: "[REDACTED_SECRET]" }
];

function maskSensitiveContent(text) {
  if (typeof text !== "string") return text;
  let out = text;
  for (const { pattern, replace } of SENSITIVE_PATTERNS) {
    out = out.replace(pattern, replace);
  }
  return out;
}

/**
 * Llama al proveedor de IA (OpenAI-compatible) y devuelve { content, model_used, tokens_used }.
 * Si no hay API key configurada, devuelve un resultado mock para desarrollo.
 */
async function complete(prompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
  const model = options.model || process.env.AI_REVIEW_MODEL || "gpt-4o-mini";

  const maskedPrompt = maskSensitiveContent(prompt);

  if (!apiKey && process.env.NODE_ENV === "production") {
    throw new Error("AI_API_KEY or OPENAI_API_KEY is required for AI Code Review in production.");
  }

  if (!apiKey) {
    // En desarrollo esto puede dispararse frecuentemente; bajar ruido.
    logger.debug({ event: "AI_SERVICE_NO_KEY" }, "No AI API key configured; returning mock code review.");
    return {
      content: JSON.stringify({
        summary: "Mock review: Configure OPENAI_API_KEY or AI_API_KEY to enable real AI code review.",
        issues: [],
        security_warnings: [],
        improvements: ["Enable AI_API_KEY for automated review."],
        risk_level: "low"
      }),
      model_used: "mock",
      tokens_used: 0
    };
  }

  const start = Date.now();
  try {
    const axios = require("axios");
    const res = await axios.post(
      apiUrl,
      {
        model,
        messages: [{ role: "user", content: maskedPrompt }],
        max_tokens: options.max_tokens || 2000,
        temperature: options.temperature ?? 0.2
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey
        },
        timeout: 60000
      }
    );
    const data = res.data;
    const durationMs = Date.now() - start;

    const content = data.choices?.[0]?.message?.content || "";
    const tokensUsed = data.usage?.total_tokens ?? 0;

    return {
      content,
      model_used: data.model || model,
      tokens_used: tokensUsed,
      duration_ms: durationMs
    };
  } catch (err) {
    logger.warn({ event: "AI_SERVICE_ERROR", err: err.message }, "AI request failed");
    throw err;
  }
}

module.exports = {
  complete,
  maskSensitiveContent
};
