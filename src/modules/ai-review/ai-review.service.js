/**
 * AI Code Review — Servicio principal.
 * 1) Obtener diff de la entrega 2) Construir prompt 3) Llamar ai.service 4) Parsear respuesta 5) Guardar resultado.
 * Logging: AI_REVIEW_STARTED, AI_REVIEW_COMPLETED, AI_REVIEW_FAILED (model_used, tokens, duration_ms).
 */

const deliveryDiffService = require("./delivery-diff.service");
const { generateCodeReviewPrompt } = require("./ai-review.prompts");
const aiService = require("./ai.service");
const codeReviewRepository = require("./codeReview.repository");
const codeDeliveryRepository = require("../code-deliveries/codeDelivery.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const logger = require("../../config/logger");

function parseReviewResponse(content) {
  const trimmed = (content || "").trim();
  let parsed;
  try {
    const jsonStr = trimmed.replace(/^```json\s*/i, "").replace(/\s*```\s*$/, "").trim();
    parsed = JSON.parse(jsonStr);
  } catch (_) {
    parsed = {
      summary: trimmed.slice(0, 500) || "Review completed; output could not be parsed as JSON.",
      issues: [],
      security_warnings: [],
      improvements: [],
      risk_level: "medium"
    };
  }
  const riskLevel = parsed.risk_level && ["low", "medium", "high"].includes(String(parsed.risk_level).toLowerCase())
    ? String(parsed.risk_level).toLowerCase()
    : "medium";
  return {
    summary: parsed.summary != null ? String(parsed.summary) : "",
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    security_warnings: Array.isArray(parsed.security_warnings) ? parsed.security_warnings : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    risk_level: riskLevel
  };
}

async function generateReview(deliveryId, projectId, organizationId, context) {
  const delivery = await codeDeliveryRepository.findByIdAndProject(deliveryId, projectId);
  if (!delivery) {
    throw new AppError("Code delivery no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.CODE_DELIVERY_NOT_FOUND
    });
  }

  // Muy ruidoso para consola; se deja en debug.
  logger.debug(
    { event: "AI_REVIEW_STARTED", project_id: projectId, delivery_id: deliveryId },
    "AI Code Review started"
  );

  const startMs = Date.now();

  try {
    const diffResult = await deliveryDiffService.getDeliveryDiff(deliveryId);
    const diffPayload = diffResult && diffResult.data ? diffResult.data : diffResult;
    if (!diffPayload || !diffPayload.diff || diffPayload.diff.length < 10) {
      throw new AppError("No hay suficiente contenido en el workspace para revisar. Añade archivos a la entrega.", {
        statusCode: 400,
        code: "DELIVERY_EMPTY"
      });
    }

    const prompt = generateCodeReviewPrompt(diffPayload);
    const aiResult = await aiService.complete(prompt);
    if (!aiResult || aiResult.available === false) {
      return aiResult;
    }
    const durationMs = Date.now() - startMs;

    const parsed = parseReviewResponse(aiResult.content);

    const review = await codeReviewRepository.create({
      project_id: projectId,
      delivery_id: deliveryId,
      summary: parsed.summary,
      issues: parsed.issues,
      security_warnings: parsed.security_warnings,
      improvements: parsed.improvements,
      risk_level: parsed.risk_level,
      model_used: aiResult.model_used || null,
      tokens_used: aiResult.tokens_used ?? null,
      duration_ms: aiResult.duration_ms ?? durationMs
    });

    // Muy ruidoso para consola; se deja en debug.
    logger.debug(
      {
        event: "AI_REVIEW_COMPLETED",
        project_id: projectId,
        delivery_id: deliveryId,
        review_id: review.id,
        model_used: aiResult.model_used,
        tokens_used: aiResult.tokens_used,
        duration_ms: durationMs,
        risk_level: parsed.risk_level
      },
      "AI Code Review completed"
    );

    const plain = review.toJSON ? review.toJSON() : review;
    return {
      review_id: plain.id,
      summary: plain.summary,
      risk_level: plain.risk_level,
      issues: plain.issues || [],
      security_warnings: plain.security_warnings || [],
      improvements: plain.improvements || []
    };
  } catch (err) {
    const durationMs = Date.now() - startMs;
    logger.warn(
      {
        event: "AI_REVIEW_FAILED",
        project_id: projectId,
        delivery_id: deliveryId,
        err: err.message,
        duration_ms: durationMs
      },
      "AI Code Review failed"
    );
    if (err instanceof AppError) throw err;
    throw new AppError("No se pudo completar la revisión de código: " + (err.message || "Error interno"), {
      statusCode: 502,
      code: "AI_REVIEW_FAILED"
    });
  }
}

async function getLatestReviewForDelivery(deliveryId, projectId, organizationId) {
  const delivery = await codeDeliveryRepository.findByIdAndProject(deliveryId, projectId);
  if (!delivery) {
    throw new AppError("Code delivery no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.CODE_DELIVERY_NOT_FOUND
    });
  }
  const review = await codeReviewRepository.findByDelivery(deliveryId, projectId);
  if (!review) return null;
  const plain = review.toJSON ? review.toJSON() : review;
  return {
    review_id: plain.id,
    summary: plain.summary,
    risk_level: plain.risk_level,
    issues: plain.issues || [],
    security_warnings: plain.security_warnings || [],
    improvements: plain.improvements || [],
    model_used: plain.model_used,
    created_at: plain.created_at
  };
}

module.exports = {
  generateReview,
  getLatestReviewForDelivery
};
