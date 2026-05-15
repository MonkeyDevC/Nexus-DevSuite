import { get, post, put, del } from "../../shared/http/index.js";
import { unwrapSuccessData, toDomainError } from "../../shared/api/apiEnvelope.js";
import { mapIncidentDeleteResult, mapIncidentDto, mapIncidentListEnvelope } from "./incidentDto.js";

function qs(params) {
  const sp = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function listIncidentsByProject(projectId, { page = 1, limit = 50, status } = {}) {
  try {
    const res = await get(
      `/projects/${encodeURIComponent(projectId)}/incidents${qs({ page, limit, status })}`
    );
    const data = unwrapSuccessData(res);
    return mapIncidentListEnvelope(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function listIncidentsRoot(projectId, { page = 1, limit = 50, status } = {}) {
  try {
    const res = await get(`/incidents${qs({ project_id: projectId, page, limit, status })}`);
    const data = unwrapSuccessData(res);
    return mapIncidentListEnvelope(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function getIncident(incidentId) {
  try {
    const res = await get(`/incidents/${encodeURIComponent(incidentId)}`);
    const data = unwrapSuccessData(res);
    const mapped = mapIncidentDto(data);
    if (!mapped) {
      const err = new Error("Incidente inválido");
      err.code = "INCIDENT_NOT_FOUND";
      err.isDomainError = true;
      throw err;
    }
    return mapped;
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function createIncident({ projectId, title, description, severity, priority, story_id }) {
  try {
    const res = await post(`/projects/${encodeURIComponent(projectId)}/incidents`, {
      title,
      description: description || null,
      severity,
      priority,
      story_id: story_id || null,
    });
    const data = unwrapSuccessData(res);
    return mapIncidentDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function createIncidentRoot({ project_id, title, description, severity, priority, story_id }) {
  try {
    const res = await post(`/incidents`, {
      project_id,
      title,
      description: description || null,
      severity,
      priority,
      story_id: story_id || null,
    });
    const data = unwrapSuccessData(res);
    return mapIncidentDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

/** Contrato canónico WAVE 3 */
export async function updateIncident(incidentId, payload) {
  try {
    const res = await put(`/incidents/${encodeURIComponent(incidentId)}`, payload);
    const data = unwrapSuccessData(res);
    return mapIncidentDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function deleteIncident(incidentId) {
  try {
    const res = await del(`/incidents/${encodeURIComponent(incidentId)}`);
    const data = unwrapSuccessData(res);
    return mapIncidentDeleteResult(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function startIncident(incidentId) {
  try {
    const res = await post(`/incidents/${encodeURIComponent(incidentId)}/start`, {});
    const data = unwrapSuccessData(res);
    return mapIncidentDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function resolveIncident(incidentId) {
  try {
    const res = await post(`/incidents/${encodeURIComponent(incidentId)}/resolve`, {});
    const data = unwrapSuccessData(res);
    return mapIncidentDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function closeIncident(incidentId, { root_cause_analysis } = {}) {
  try {
    const res = await post(`/incidents/${encodeURIComponent(incidentId)}/close`, {
      root_cause_analysis: root_cause_analysis != null ? String(root_cause_analysis).trim() : undefined,
    });
    const data = unwrapSuccessData(res);
    return mapIncidentDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

/** Stories del proyecto para selector opcional */
export async function listProjectStoriesBrief(projectId, { page = 1, limit = 100 } = {}) {
  try {
    const res = await get(
      `/projects/${encodeURIComponent(projectId)}/stories${qs({ page, limit })}`
    );
    const data = unwrapSuccessData(res);
    const items = Array.isArray(data.items) ? data.items : [];
    return items
      .map((s) =>
        s && s.id
          ? { id: String(s.id).trim(), title: s.title != null ? String(s.title) : "" }
          : null
      )
      .filter(Boolean);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function getProject(projectId) {
  try {
    const res = await get(`/projects/${encodeURIComponent(projectId)}`);
    return unwrapSuccessData(res);
  } catch (e) {
    throw toDomainError(e);
  }
}
