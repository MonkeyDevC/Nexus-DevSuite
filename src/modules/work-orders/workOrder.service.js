/**
 * Módulo Work Orders - Service
 * Auditoría WORK_ORDER_CREATED y logging.
 */

const workOrderRepository = require("./workOrder.repository");
const projectsRepository = require("../backlog/projects.repository");
const userStoryRepository = require("../backlog/userStory.repository");
const featureService = require("../backlog/feature.service");
const authRepository = require("../auth/auth.repository");
const codeDeliveryRepository = require("../code-deliveries/codeDelivery.repository");
const eventBus = require("../../system/eventBus");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const logger = require("../../config/logger");
const { WORK_ORDER_STATUSES, WORK_ORDER_PRIORITIES, assertValidTransition, LEGACY_STATUS_ALIASES } = require("./workOrder.stateMachine");

function normalizeStatusToMachine(status) {
  if (!status) return status;
  const s = String(status).toUpperCase();
  return LEGACY_STATUS_ALIASES[s] || s;
}

function getWorkOrderSequelize() {
  // Usamos WorkOrder.sequelize como fuente única del motor.
  const { getModels } = require("../../infrastructure/db/loadModels");
  const { WorkOrder } = getModels();
  return WorkOrder.sequelize;
}

function toPlain(wo) {
  if (!wo) return null;
  const o = typeof wo.toJSON === "function" ? wo.toJSON() : wo;
  return {
    id: o.id,
    ot_number: o.ot_number,
    project_id: o.project_id,
    user_story_id: o.user_story_id,
    title: o.title,
    description: o.description,
    status: o.status,
    priority: o.priority,
    assigned_to_user_id: o.assigned_to_user_id,
    delivery_id: o.delivery_id,
    created_by_user_id: o.created_by_user_id,
    created_at: o.created_at,
    updated_at: o.updated_at
  };
}

function ensureAuditContext(context) {
  const { user, requestId, ip, userAgent } = context || {};
  if (!user?.id || !requestId) {
    throw new AppError("Contexto de auditoría incompleto", {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR
    });
  }
  return {
    user_id: user.id,
    request_id: requestId,
    ip_address: ip || null,
    user_agent: userAgent || null
  };
}

function getEventSource(context) {
  return context && context.meta && context.meta.source ? context.meta.source : "core";
}

function emitWorkOrderEvent(eventType, workOrderPlain, context, extraMeta = {}) {
  if (!eventType) return;
  const tenantId = context && context.organizationId ? context.organizationId : null;
  if (!tenantId) return;

  eventBus.emit(
    eventType,
    workOrderPlain,
    {
      tenant_id: tenantId,
      request_id: context && context.requestId ? context.requestId : null,
      source: getEventSource(context),
      ...extraMeta
    }
  );
}

async function createWorkOrder(projectId, userStoryId, payload, context) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, context.organizationId);

  const story = await userStoryRepository.findById(userStoryId);
  if (!story) {
    throw new AppError("User Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const storyPlain = typeof story.toJSON === "function" ? story.toJSON() : story;
  const feature = storyPlain.feature_id
    ? await require("../backlog/feature.repository").findById(storyPlain.feature_id)
    : null;
  if (feature && feature.project_id !== projectId) {
    throw new AppError("La story no pertenece al proyecto", {
      statusCode: 400,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }

  if (payload.assigned_to_user_id) {
    const user = await authRepository.findUserById(payload.assigned_to_user_id);
    if (!user) {
      throw new AppError("Usuario asignado no encontrado", {
        statusCode: 404,
        code: ERROR_CODES.NOT_FOUND
      });
    }
  }

  const sequelize = getWorkOrderSequelize();
  const created = await sequelize.transaction(async (t) => {
    const nextOt = (await workOrderRepository.getMaxOtNumberByProject(projectId, t)) + 1;
    const created = await workOrderRepository.create(
      {
        project_id: projectId,
        user_story_id: userStoryId,
        ot_number: nextOt,
        title: payload.title || "Work Order " + nextOt,
        description: payload.description ?? null,
        status: "PENDING",
        priority: payload.priority || "MEDIUM",
        assigned_to_user_id: payload.assigned_to_user_id ?? null,
        delivery_id: payload.delivery_id ?? null,
        created_by_user_id: context.user?.id
      },
      t
    );

    if (payload.delivery_id) {
      await linkToDelivery(created, payload.delivery_id, context, { transaction: t });
    }

    const auditCtx = ensureAuditContext(context);
    await authRepository.createAuditLog(
      {
        ...auditCtx,
        action: "WORK_ORDER_CREATED",
        entity: "work_order",
        entity_id: created.id,
        metadata: {
          project_id: projectId,
          user_story_id: userStoryId,
          ot_number: nextOt,
          priority: created.priority,
          assigned_to_user_id: created.assigned_to_user_id,
          delivery_id: created.delivery_id
        }
      },
      { transaction: t }
    );

    return created;
  });

  logger.info(
    { event: "WORK_ORDER_CREATED", work_order_id: created.id, project_id: projectId, user_story_id: userStoryId, request_id: context.requestId },
    "Work Order creada"
  );

  const createdPlain = toPlain(created);

  // Eventos para automation engine (fire-and-forget).
  emitWorkOrderEvent("WORK_ORDER_CREATED", createdPlain, context);
  if (createdPlain.delivery_id) {
    eventBus.emit(
      "DELIVERY_LINKED",
      {
        work_order_id: createdPlain.id,
        project_id: createdPlain.project_id,
        delivery_id: createdPlain.delivery_id
      },
      {
        tenant_id: context.organizationId,
        request_id: context.requestId,
        source: getEventSource(context)
      }
    );
  }

  return createdPlain;
}

async function getWorkOrderById(id, projectId, organizationId) {
  const wo = await workOrderRepository.findByIdAndProject(id, projectId);
  if (!wo) {
    throw new AppError("Work Order no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, organizationId);
  return toPlain(wo);
}

async function listWorkOrders(projectId, params, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, organizationId);
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 20));
  const status = params.status ? normalizeStatusToMachine(params.status) : undefined;
  const result = await workOrderRepository.listByProject(projectId, {
    page,
    limit,
    status,
    user_story_id: params.user_story_id
  });
  return {
    data: result.items.map(toPlain),
    meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) }
  };
}

async function updateWorkOrder(id, projectId, payload, context) {
  const wo = await workOrderRepository.findByIdAndProject(id, projectId);
  if (!wo) {
    throw new AppError("Work Order no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);

  const previousStatus = normalizeStatusToMachine(wo.status);
  const previousAssigned = wo.assigned_to_user_id ?? null;
  const previousDeliveryId = wo.delivery_id ?? null;

  const updatePayload = {};
  if (payload.title !== undefined) updatePayload.title = String(payload.title).trim() || wo.title;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.priority !== undefined) {
    updatePayload.priority = payload.priority;
  }

  if (payload.assigned_to_user_id !== undefined) {
    if (payload.assigned_to_user_id === null) {
      updatePayload.assigned_to_user_id = null;
    } else {
      const user = await authRepository.findUserById(payload.assigned_to_user_id);
      if (!user) {
        throw new AppError("Usuario asignado no encontrado", {
          statusCode: 404,
          code: ERROR_CODES.NOT_FOUND
        });
      }
      updatePayload.assigned_to_user_id = payload.assigned_to_user_id;
    }
  }

  if (payload.status !== undefined) {
    const previous = normalizeStatusToMachine(wo.status);
    const next = normalizeStatusToMachine(payload.status);
    if (previous !== next) {
      try {
        assertValidTransition(previous, next);
      } catch (e) {
        throw new AppError(e.message || "Transición de estado inválida para Work Order", {
          statusCode: 400,
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }
    }
    updatePayload.status = next;
  }

  if (payload.delivery_id !== undefined) {
    updatePayload.delivery_id = payload.delivery_id;
  }

  // Optimistic locking: version must match the snapshot we loaded.
  const expectedVersion = wo.version;
  updatePayload.version = (wo.version || 0) + 1;

  const sequelize = getWorkOrderSequelize();
  const updated = await sequelize.transaction(async (t) => {
    const updated = await workOrderRepository.update(id, projectId, updatePayload, { transaction: t, expectedVersion });
    if (!updated) {
      throw new AppError("Work Order fue modificada por otro proceso. Reintenta.", {
        statusCode: 409,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    if (payload.delivery_id !== undefined) {
      await linkToDelivery(updated, payload.delivery_id, context, { transaction: t });
    }
    return updated;
  });

  const updatedPlain = toPlain(updated);

  emitWorkOrderEvent("WORK_ORDER_UPDATED", updatedPlain, context);

  const updatedStatus = normalizeStatusToMachine(updatedPlain.status);
  if (updatedStatus !== previousStatus) {
    eventBus.emit(
      "WORK_ORDER_STATUS_CHANGED",
      {
        work_order_id: updatedPlain.id,
        project_id: updatedPlain.project_id,
        user_story_id: updatedPlain.user_story_id,
        from_status: previousStatus,
        to_status: updatedStatus,
        status: updatedStatus,
        priority: updatedPlain.priority,
        assigned_to_user_id: updatedPlain.assigned_to_user_id,
        delivery_id: updatedPlain.delivery_id
      },
      {
        tenant_id: context.organizationId,
        request_id: context.requestId,
        source: getEventSource(context)
      }
    );
  }

  if ((updatedPlain.assigned_to_user_id ?? null) !== previousAssigned) {
    eventBus.emit(
      "WORK_ORDER_ASSIGNED",
      {
        work_order_id: updatedPlain.id,
        project_id: updatedPlain.project_id,
        user_story_id: updatedPlain.user_story_id,
        assigned_to_user_id: updatedPlain.assigned_to_user_id ?? null,
        from_assigned_to_user_id: previousAssigned,
        priority: updatedPlain.priority,
        status: updatedPlain.status,
        delivery_id: updatedPlain.delivery_id
      },
      {
        tenant_id: context.organizationId,
        request_id: context.requestId,
        source: getEventSource(context)
      }
    );
  }

  const updatedDeliveryId = updatedPlain.delivery_id ?? null;
  if (updatedDeliveryId && updatedDeliveryId !== previousDeliveryId) {
    eventBus.emit(
      "DELIVERY_LINKED",
      {
        work_order_id: updatedPlain.id,
        project_id: updatedPlain.project_id,
        delivery_id: updatedDeliveryId
      },
      {
        tenant_id: context.organizationId,
        request_id: context.requestId,
        source: getEventSource(context)
      }
    );
  }

  return updatedPlain;
}

async function assignWorkOrder(workOrderId, projectId, assignedToUserId, context) {
  const wo = await workOrderRepository.findByIdAndProject(workOrderId, projectId);
  if (!wo) {
    throw new AppError("Work Order no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND
    });
  }

  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);

  if (assignedToUserId !== null && assignedToUserId !== undefined) {
    const user = await authRepository.findUserById(assignedToUserId);
    if (!user) {
      throw new AppError("Usuario asignado no encontrado", { statusCode: 404, code: ERROR_CODES.NOT_FOUND });
    }
  }

  const expectedVersion = wo.version;
  const previousAssigned = wo.assigned_to_user_id ?? null;
  const sequelize = getWorkOrderSequelize();
  const updated = await sequelize.transaction(async (t) => {
    const updated = await workOrderRepository.update(
      workOrderId,
      projectId,
      {
        assigned_to_user_id: assignedToUserId ?? null,
        version: (wo.version || 0) + 1
      },
      { transaction: t, expectedVersion }
    );
    if (!updated) {
      throw new AppError("Work Order fue modificada por otro proceso. Reintenta.", {
        statusCode: 409,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    return updated;
  });

  const updatedPlain = toPlain(updated);
  emitWorkOrderEvent("WORK_ORDER_UPDATED", updatedPlain, context);
  if ((updatedPlain.assigned_to_user_id ?? null) !== previousAssigned) {
    eventBus.emit(
      "WORK_ORDER_ASSIGNED",
      {
        work_order_id: updatedPlain.id,
        project_id: updatedPlain.project_id,
        user_story_id: updatedPlain.user_story_id,
        assigned_to_user_id: updatedPlain.assigned_to_user_id ?? null,
        from_assigned_to_user_id: previousAssigned,
        priority: updatedPlain.priority,
        status: updatedPlain.status,
        delivery_id: updatedPlain.delivery_id
      },
      {
        tenant_id: context.organizationId,
        request_id: context.requestId,
        source: getEventSource(context)
      }
    );
  }

  return updatedPlain;
}

async function changeStatus(workOrderId, projectId, nextStatus, context) {
  const wo = await workOrderRepository.findByIdAndProject(workOrderId, projectId);
  if (!wo) {
    throw new AppError("Work Order no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND
    });
  }
  const previous = normalizeStatusToMachine(wo.status);
  const next = normalizeStatusToMachine(nextStatus);
  const previousStatus = previous;

  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);

  if (previous !== next) {
    try {
      assertValidTransition(previous, next);
    } catch (e) {
      throw new AppError(e.message || "Transición de estado inválida para Work Order", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
  }

  const expectedVersion = wo.version;
  const sequelize = getWorkOrderSequelize();
  const updated = await sequelize.transaction(async (t) => {
    const updated = await workOrderRepository.update(
      workOrderId,
      projectId,
      {
        status: next,
        version: (wo.version || 0) + 1
      },
      { transaction: t, expectedVersion }
    );
    if (!updated) {
      throw new AppError("Work Order fue modificada por otro proceso. Reintenta.", {
        statusCode: 409,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    return updated;
  });

  const updatedPlain = toPlain(updated);
  emitWorkOrderEvent("WORK_ORDER_UPDATED", updatedPlain, context);
  const updatedStatus = normalizeStatusToMachine(updatedPlain.status);
  if (updatedStatus !== previousStatus) {
    eventBus.emit(
      "WORK_ORDER_STATUS_CHANGED",
      {
        work_order_id: updatedPlain.id,
        project_id: updatedPlain.project_id,
        user_story_id: updatedPlain.user_story_id,
        from_status: previousStatus,
        to_status: updatedStatus,
        priority: updatedPlain.priority,
        assigned_to_user_id: updatedPlain.assigned_to_user_id,
        delivery_id: updatedPlain.delivery_id
      },
      {
        tenant_id: context.organizationId,
        request_id: context.requestId,
        source: getEventSource(context)
      }
    );
  }

  return updatedPlain;
}

async function linkToDelivery(workOrder, deliveryId, context, { transaction } = {}) {
  const woPlain = workOrder && workOrder.toJSON ? workOrder.toJSON() : workOrder;
  const woId = woPlain && woPlain.id;
  const woProjectId = woPlain && woPlain.project_id;
  if (!woId || !woProjectId) {
    throw new AppError("Work Order inválida para enlazar delivery", { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR });
  }

  if (deliveryId === null || deliveryId === undefined) {
    const desired = null;
    const current = woPlain.delivery_id ?? null;
    if (current === desired) return true;

    // Desvincular: marcamos delivery_id=null. (La dirección primaria sigue siendo delivery_commits.work_order_id.)
    const expectedVersion = workOrder && workOrder.version !== undefined ? workOrder.version : undefined;
    const run = async (t) => {
      await workOrderRepository.update(
        woId,
        woProjectId,
        { delivery_id: null, version: (expectedVersion || 0) + 1 },
        { transaction: t, expectedVersion }
      );
      return true;
    };

    if (transaction) return run(transaction);
    const sequelize = getWorkOrderSequelize();
    return sequelize.transaction(async (t) => run(t));
  }

  const run = async (t) => {
    const delivery = await codeDeliveryRepository.findByIdAndProject(deliveryId, woProjectId);
    if (!delivery) {
      throw new AppError("Delivery no encontrada", { statusCode: 404, code: ERROR_CODES.NOT_FOUND });
    }
    const dPlain = delivery.toJSON ? delivery.toJSON() : delivery;

    if (dPlain.user_story_id && dPlain.user_story_id !== woPlain.user_story_id) {
      throw new AppError("Delivery no pertenece a la misma User Story", { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR });
    }

    if (dPlain.work_order_id && dPlain.work_order_id !== woId) {
      throw new AppError("Delivery ya está vinculada a otra Work Order", { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR });
    }

    await codeDeliveryRepository.update(
      deliveryId,
      woProjectId,
      { work_order_id: woId },
      { transaction: t }
    );

    const current = woPlain.delivery_id ?? null;
    const desired = deliveryId ?? null;
    if (current === desired) return true;

    const expectedVersion = workOrder && workOrder.version !== undefined ? workOrder.version : undefined;
    await workOrderRepository.update(
      woId,
      woProjectId,
      { delivery_id: desired, version: (expectedVersion || 0) + 1 },
      { transaction: t, expectedVersion }
    );
    return true;
  };

  if (transaction) return run(transaction);
  const sequelize = getWorkOrderSequelize();
  return sequelize.transaction(async (t) => run(t));
}

async function deleteWorkOrder(workOrderId, projectId, context) {
  const wo = await workOrderRepository.findByIdAndProject(workOrderId, projectId);
  if (!wo) {
    throw new AppError("Work Order no encontrada", { statusCode: 404, code: ERROR_CODES.NOT_FOUND });
  }

  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);

  const sequelize = getWorkOrderSequelize();
  const result = await sequelize.transaction(async (t) => {
    const deleted = await workOrderRepository.deleteWorkOrder(workOrderId, projectId, { transaction: t, expectedVersion: wo.version });
    if (!deleted) return { deleted: false };

    const auditCtx = ensureAuditContext(context);
    await authRepository.createAuditLog(
      {
        ...auditCtx,
        action: "WORK_ORDER_DELETED",
        entity: "work_order",
        entity_id: workOrderId,
        metadata: { project_id: projectId }
      },
      { transaction: t }
    );
    return { deleted: true };
  });

  return result;
}

module.exports = {
  createWorkOrder,
  getWorkOrderById,
  listWorkOrders,
  updateWorkOrder,
  assignWorkOrder,
  changeStatus,
  linkToDelivery,
  deleteWorkOrder
};
