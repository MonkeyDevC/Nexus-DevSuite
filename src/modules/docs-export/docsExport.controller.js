const { validationResult } = require("express-validator");
const { AppError } = require("../../shared/errors/AppError");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const docsExportService = require("./docsExport.service");

function assertRequestValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError("Validación fallida", {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details: errors.array()
    });
  }
}

async function exportDocsController(req, res, next) {
  try {
    assertRequestValid(req);
    const user = req.user;
    const organizationId = req.organizationId;

    const { type, projectId } = req.body || {};
    const payload = {
      type,
      projectId: projectId || null,
      // Los contenidos pueden venir desde DB (preferido), o como override desde UI.
      contentHtml: req.body && typeof req.body.contentHtml === "string" ? req.body.contentHtml : null,
      contentHtmlFunctional:
        req.body && typeof req.body.contentHtmlFunctional === "string" ? req.body.contentHtmlFunctional : null,
      contentHtmlTechnical:
        req.body && typeof req.body.contentHtmlTechnical === "string" ? req.body.contentHtmlTechnical : null
    };

    const out = await docsExportService.exportDocsToDocx(payload, {
      user,
      organizationId,
      requestId: req.requestId || "no-request-id"
    });

    // Respuesta binaria (no Response Layer JSON).
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${out.filename}"`);
    res.status(200).send(out.buffer);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  exportDocsController
};

