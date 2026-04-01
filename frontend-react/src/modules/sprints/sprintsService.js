import { get, post, put, del } from "../../shared/http/index.js";
import { unwrapSuccessData, toDomainError } from "../domain/apiEnvelope.js";
import { mapSprintDeleteResult, mapSprintDto, mapSprintListEnvelope } from "./sprintDto.js";

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

export async function listSprints(projectId, { page = 1, limit = 50, status } = {}) {
  try {
    const res = await get(
      `/projects/${encodeURIComponent(projectId)}/sprints${qs({ page, limit, status })}`
    );
    const data = unwrapSuccessData(res);
    return mapSprintListEnvelope(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function getSprint(sprintId) {
  try {
    const res = await get(`/sprints/${encodeURIComponent(sprintId)}`);
    const data = unwrapSuccessData(res);
    const mapped = mapSprintDto(data);
    if (!mapped) {
      const err = new Error("Sprint inválida");
      err.code = "SPRINT_NOT_FOUND";
      err.isDomainError = true;
      throw err;
    }
    return mapped;
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function getSprintSummary(sprintId) {
  try {
    const res = await get(`/sprints/${encodeURIComponent(sprintId)}/summary`);
    return unwrapSuccessData(res);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function createSprint({ projectId, name, goal, start_date, end_date }) {
  try {
    const res = await post(`/projects/${encodeURIComponent(projectId)}/sprints`, {
      name,
      goal: goal || null,
      start_date,
      end_date,
    });
    const data = unwrapSuccessData(res);
    return mapSprintDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function updateSprint(sprintId, payload) {
  try {
    const res = await put(`/sprints/${encodeURIComponent(sprintId)}`, payload);
    const data = unwrapSuccessData(res);
    return mapSprintDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function deleteSprint(sprintId) {
  try {
    const res = await del(`/sprints/${encodeURIComponent(sprintId)}`);
    const data = unwrapSuccessData(res);
    return mapSprintDeleteResult(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function startSprint(sprintId) {
  try {
    const res = await post(`/sprints/${encodeURIComponent(sprintId)}/start`, {});
    const data = unwrapSuccessData(res);
    return mapSprintDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function closeSprint(sprintId) {
  try {
    const res = await post(`/sprints/${encodeURIComponent(sprintId)}/close`, {});
    const data = unwrapSuccessData(res);
    return mapSprintDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

/** Una página de historias del sprint; data shape { data, meta } dentro de success.data */
export async function listSprintStoriesPage(sprintId, { page = 1, limit = 50 } = {}) {
  try {
    const res = await get(
      `/sprints/${encodeURIComponent(sprintId)}/stories${qs({ page, limit })}`
    );
    const data = unwrapSuccessData(res);
    const rows = Array.isArray(data.data) ? data.data : [];
    const meta = data.meta && typeof data.meta === "object" ? data.meta : {};
    return { rows, meta };
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function fetchAllSprintStories(sprintId, { limit = 50 } = {}) {
  const merged = [];
  let page = 1;
  let incomplete = false;
  const totalPagesGuess = 99;
  while (page <= totalPagesGuess) {
    const { rows, meta } = await listSprintStoriesPage(sprintId, { page, limit });
    merged.push(...rows);
    const totalPages = Math.max(1, Number(meta.totalPages) || 1);
    if (page >= totalPages || rows.length === 0) break;
    page += 1;
    if (page > 80) {
      incomplete = true;
      break;
    }
  }
  return { rows: merged, incomplete };
}

/** Historias READY sin sprint en el proyecto (sprint_id=unassigned). */
export async function listReadyStoriesWithoutSprint(projectId, { page = 1, limit = 100 } = {}) {
  try {
    const res = await get(
      `/projects/${encodeURIComponent(projectId)}/stories${qs({
        sprint_id: "unassigned",
        status: "READY",
        page,
        limit,
      })}`
    );
    const data = unwrapSuccessData(res);
    const items = Array.isArray(data.items) ? data.items : [];
    return items
      .map((s) =>
        s && s.id
          ? {
              id: String(s.id).trim(),
              title: s.title != null ? String(s.title) : "",
              status: s.status != null ? String(s.status) : "",
            }
          : null
      )
      .filter(Boolean);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function assignSprintToStory(storyId, sprintId) {
  try {
    const res = await post(`/stories/${encodeURIComponent(storyId)}/assign-sprint`, {
      sprint_id: sprintId,
    });
    return unwrapSuccessData(res);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function removeSprintFromStory(storyId) {
  try {
    const res = await post(`/stories/${encodeURIComponent(storyId)}/remove-sprint`, {});
    return unwrapSuccessData(res);
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
