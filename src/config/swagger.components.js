/**
 * Componentes OpenAPI 3.0.3 alineados a Response Layer v1
 * (@see src/shared/responses/responseLayer.js — buildSuccess / buildError).
 */

const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "JWT de acceso emitido por POST /auth/login o POST /auth/refresh."
    }
  },
  schemas: {
    ResponseMeta: {
      type: "object",
      description: "Metadatos comunes en meta de buildSuccess (request_id, timestamp ISO).",
      required: ["request_id", "timestamp"],
      properties: {
        request_id: { type: "string" },
        timestamp: { type: "string", format: "date-time" }
      }
    },
    ApiSuccess: {
      type: "object",
      required: ["success", "data", "meta"],
      properties: {
        success: { type: "boolean", example: true },
        data: {
          description: "Carga útil; null permitido según operación.",
          nullable: true
        },
        meta: { $ref: "#/components/schemas/ResponseMeta" }
      }
    },
    ApiError: {
      type: "object",
      required: ["success", "data", "error", "meta"],
      properties: {
        success: { type: "boolean", example: false },
        data: {
          description: "En errores estándar del responseLayer es null.",
          nullable: true
        },
        error: {
          type: "object",
          required: ["code", "message"],
          properties: {
            code: { type: "string" },
            message: { type: "string" },
            details: {
              description: "Presente en validación u otros errores con detalle estructurado.",
              nullable: true
            }
          }
        },
        meta: { $ref: "#/components/schemas/ResponseMeta" }
      }
    },
    ValidationError: {
      description:
        "Error de validación (express-validator / AppError); error.details suele ser array de ítems. Misma forma base que ApiError.",
      allOf: [{ $ref: "#/components/schemas/ApiError" }]
    },
    /**
     * Listados que usan buildSuccess({ items, ...metaPaginación }, { request_id }).
     * Ver p. ej. listProjectsController en backlog.controller.js.
     */
    ApiListData: {
      type: "object",
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: {}
        },
        total: { type: "integer", description: "Total de registros (cuando aplica)." },
        page: { type: "integer" },
        limit: { type: "integer" },
        totalPages: { type: "integer" }
      }
    },
    ApiSuccessList: {
      type: "object",
      required: ["success", "data", "meta"],
      description:
        "Respuesta exitosa cuando data combina items y campos de paginación (p. ej. listProjectsController).",
      properties: {
        success: { type: "boolean", example: true },
        data: { $ref: "#/components/schemas/ApiListData" },
        meta: { $ref: "#/components/schemas/ResponseMeta" }
      }
    },
    LoginRequest: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", format: "password" }
      }
    },
    LoginData: {
      type: "object",
      required: ["access_token", "refresh_token", "user"],
      properties: {
        access_token: { type: "string" },
        refresh_token: { type: "string" },
        user: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string" },
            role: { type: "string", nullable: true }
          }
        }
      }
    },
    RefreshRequest: {
      type: "object",
      required: ["refresh_token"],
      properties: {
        refresh_token: { type: "string" }
      }
    },
    LogoutRequest: {
      type: "object",
      required: ["refresh_token"],
      properties: {
        refresh_token: { type: "string" }
      }
    }
  }
};

module.exports = { components };
