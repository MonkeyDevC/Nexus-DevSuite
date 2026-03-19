"use strict";

const AUTOMATION_EVENT_MAP = [
  { event_type: "WORK_ORDER_CREATED", patterns: [/cuando\s+se\s+crea|cuando\s+se\s+cree|cuando\s+se\s+crearon|al\s+crearse/i] },
  { event_type: "WORK_ORDER_UPDATED", patterns: [/cuando\s+se\s+actualiza|cuando\s+se\s+actualice|cuando\s+se\s+actualizan/i] },
  { event_type: "WORK_ORDER_STATUS_CHANGED", patterns: [/cuando\s+((cambie|cambia)|cambie\s+de)\s+estado|cuando\s+((cambie|cambia)|cambie\s+de)\s+la\s+etapa|cambie\s+de\s+estado|cambie\s+a\s+revisio|cambia\s+a\s+revisio|cambie\s+a\s+revision/i] },
  { event_type: "WORK_ORDER_ASSIGNED", patterns: [/cuando\s+se\s+asigna|cuando\s+se\s+asigne|cuando\s+se\s+asign\w+/i] },
  { event_type: "DELIVERY_LINKED", patterns: [/asociar\s+entrega|enlazar\s+entrega|cuando\s+se\s+vincule\s+la\s+entrega|cuando\s+se\s+linkee\s+entrega/i] },
  { event_type: "DELIVERY_DELETED", patterns: [/se\s+elimina\s+una\s+entrega|cuando\s+se\s+elimina\s+una\s+entrega|se\s+borra\s+una\s+entrega/i] }
];

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findEventType(text) {
  const eventsFound = [];
  for (const mapping of AUTOMATION_EVENT_MAP) {
    if (mapping.patterns.some((r) => r.test(text))) eventsFound.push(mapping.event_type);
  }
  return eventsFound;
}

function parsePriority(text) {
  if (!text) return null;
  if (/prioridad\s+(alta|critica|cr[it\i]tica)|alta\s+prioridad|critica|critico|critical/i.test(text)) return "HIGH";
  if (/prioridad\s+(baja)|baja\s+prioridad|no\s+critica|no\s+critica/i.test(text)) return "LOW";
  if (/prioridad\s+(media)|media\s+prioridad/i.test(text)) return "MEDIUM";
  return null;
}

function parseStatus(text) {
  if (!text) return null;
  if (/in\s*review|en\s+revisión|en\s+revision|revision|revison|revisar/i.test(text)) return "IN_REVIEW";
  if (/in\s*progress|en\s+progreso|progreso/i.test(text)) return "IN_PROGRESS";
  if (/hecho|done|finalizada|terminada|completada/i.test(text)) return "DONE";
  if (/pendiente|por\s+hacer|por\s+hacer|todo/i.test(text)) return "PENDING";
  return null;
}

function parseConditionList(text) {
  const conditions = [];
  const pr = parsePriority(text);
  if (pr) conditions.push({ field: "priority", operator: "equals", value: pr });

  // Estado como condición (por ejemplo: "cuando este en revision")
  const st = parseStatus(text);
  if (st) conditions.push({ field: "status", operator: "equals", value: st });

  return conditions;
}

function resolveRoleTargetToUserId({ availableUsers, roleKeyword }) {
  if (!Array.isArray(availableUsers) || !roleKeyword) return null;
  const kw = String(roleKeyword).toLowerCase();
  // Heurística: buscamos en role/name/description para "senior".
  const match = availableUsers.find((u) => {
    const candidates = [u.id, u.user_id, u.userId, u.name, u.role, u.role_name, u.description]
      .filter(Boolean)
      .map(String)
      .join(" ")
      .toLowerCase();
    return candidates.includes(kw) && (u.id || u.user_id || u.userId);
  });
  if (!match) return null;
  return match.id || match.user_id || match.userId;
}

function extractAction({ text, availableUsers, warnings }) {
  // Cambia estado...
  const statusTarget = parseStatus(text);
  const hasChangeStatus = /cambia(r|se)?\s+estado|cambia(r|se)?\s+el\s+estado|marca\s+(la\s+)?orden\s+como|cambia\s+la\s+orden\s+a/.test(text);

  if (hasChangeStatus && statusTarget) {
    return {
      actions: [{ type: "change_status", payload: { status: statusTarget } }],
      actionTargetsResolved: true
    };
  }

  // Asignar a...
  const wantsAssign = /asigna(r|la|rla|rlo|rlo|rles)?\s+a|asi(n|m)ala\s+a/.test(text) || /asignala\s+a/.test(text);
  if (wantsAssign) {
    // "senior" => resolver user_id si hay contexto
    if (/senior/.test(text) || /seniores/.test(text)) {
      const userId = resolveRoleTargetToUserId({ availableUsers, roleKeyword: "senior" });
      if (!userId) warnings.push("missing action target");
      return {
        actions: [{ type: "assign_user", payload: { user_id: userId } }],
        actionTargetsResolved: Boolean(userId)
      };
    }

    // "creador" => token resoluble por el engine
    if (/creador|que\s+la\s+creo|que\s+lo\s+creo|la\s+creo|lo\s+creo/.test(text)) {
      return {
        actions: [{ type: "assign_user", payload: { user_id: "CREATOR" } }],
        actionTargetsResolved: true
      };
    }

    warnings.push("missing action target");
    return {
      actions: [{ type: "assign_user", payload: { user_id: null } }],
      actionTargetsResolved: false
    };
  }

  // Notificar...
  const wantsNotify = /notifica|avisa(r|rla)?\b|envia(r|rla)?\b\s+un\s+mensaje/.test(text);
  if (wantsNotify) {
    if (/creador/.test(text)) {
      return {
        actions: [{ type: "send_notification", payload: { user_id: "CREATOR" } }],
        actionTargetsResolved: true
      };
    }
    if (/asignad|asignado|asignada|responsable|assignee|owner/.test(text)) {
      return {
        actions: [{ type: "send_notification", payload: { user_id: "ASSIGNED_TO" } }],
        actionTargetsResolved: true
      };
    }
    warnings.push("missing action target");
    return {
      actions: [{ type: "send_notification", payload: { user_id: null } }],
      actionTargetsResolved: false
    };
  }

  // Link delivery...
  const wantsLink = /asociar\s+entrega|asociar\s+la\s+entrega|enlazar\s+entrega|vincular\s+entrega/.test(text);
  if (wantsLink) {
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
    const matchUuid = text.match(uuidRegex);
    if (matchUuid && matchUuid[0]) {
      return {
        actions: [{ type: "link_delivery", payload: { delivery_id: matchUuid[0] } }],
        actionTargetsResolved: true
      };
    }
    warnings.push("missing action target");
    return {
      actions: [{ type: "link_delivery", payload: { delivery_id: null } }],
      actionTargetsResolved: false
    };
  }

  return { actions: [], actionTargetsResolved: false };
}

function computeConfidence({ eventFound, conditions, actions, warnings }) {
  let score = 0.05;
  if (eventFound) score += 0.4;
  if (conditions.length) score += 0.25;
  if (actions.length) score += 0.3;

  const missingTarget = warnings.some((w) => String(w).toLowerCase().includes("missing action target"));
  if (missingTarget) score -= 0.35;

  const ambiguousEvent = warnings.some((w) => String(w).toLowerCase().includes("event ambiguous"));
  if (ambiguousEvent) score -= 0.25;

  score = Math.max(0, Math.min(1, score));
  return score;
}

async function parseWithOpenAIHook() {
  // Hook preparado: no se usa por ahora.
  return null;
}

async function parseTextToRule({ text, context }) {
  const warnings = [];
  const availableUsers = (context && context.available_users) || [];

  const normalized = normalizeText(text);
  const eventsFound = findEventType(normalized);

  let event_type = null;
  if (eventsFound.length === 1) event_type = eventsFound[0];
  if (!event_type) warnings.push("event ambiguous");
  if (eventsFound.length > 1) warnings.push("event ambiguous");

  const conditions = parseConditionList(normalized);

  const { actions } = extractAction({ text: normalized, availableUsers, warnings });

  const confidence_score = computeConfidence({
    eventFound: Boolean(event_type),
    conditions,
    actions,
    warnings
  });

  // Si no tenemos event_type claro, seguimos devolviendo estructura pero baja confidence.
  return {
    event_type,
    conditions,
    actions,
    confidence_score,
    warnings
  };
}

module.exports = {
  parseTextToRule,
  parsePriority,
  parseStatus
};

