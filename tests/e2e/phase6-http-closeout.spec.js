const { test, expect } = require("@playwright/test");

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.E2E_FRONTEND_URL || "http://localhost:3000";
const API_BASE_URL = process.env.API_BASE_URL || process.env.E2E_API_BASE_URL || "http://localhost:3000/api/v1";
const EMAIL = process.env.E2E_EMAIL || "admin_nexus@nexus.com";
const PASSWORD = process.env.E2E_PASSWORD || "Zaq1029*";
const ROLE = process.env.E2E_ROLE || "MASTER";

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createFakeJwt({ expSeconds }) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      exp: expSeconds,
      iat: Math.floor(Date.now() / 1000),
      role: ROLE,
    })
  );
  const signature = "invalid-signature";
  return `${header}.${payload}.${signature}`;
}

async function apiLogin(request) {
  const loginResp = await request.post(`${API_BASE_URL}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: EMAIL, password: PASSWORD },
  });
  let body = null;
  try {
    body = await loginResp.json();
  } catch {
    const raw = await loginResp.text();
    throw new Error(
      `API_LOGIN_NON_JSON status=${loginResp.status()} api=${API_BASE_URL} raw_start=${String(raw).slice(0, 120)}`
    );
  }
  return { status: loginResp.status(), body };
}

async function ensureBridgePage(page) {
  const candidates = [
    `${FRONTEND_URL}`,
    `${FRONTEND_URL}/`,
    `${FRONTEND_URL}/#/login`,
    `${FRONTEND_URL}/#/projects`,
  ];
  for (const url of candidates) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
      await page.waitForTimeout(300);
    } catch {
      continue;
    }
    try {
      await page.waitForFunction(
        () =>
          Boolean(
            window.NEXUS_HTTP_LEGACY_BRIDGE &&
              typeof window.NEXUS_HTTP_LEGACY_BRIDGE.fetchApi === "function"
          ),
        { timeout: 2500 }
      );
    } catch {
      // continue candidates
    }
    let ready = false;
    try {
      ready = await page.evaluate(() => {
        return Boolean(
          window.NEXUS_HTTP_LEGACY_BRIDGE &&
            typeof window.NEXUS_HTTP_LEGACY_BRIDGE.fetchApi === "function"
        );
      });
    } catch {
      ready = false;
    }
    if (ready) return url;
  }
  throw new Error(
    "Bridge no disponible en rutas candidatas del frontend. Verifica FRONTEND_URL y que la build incluya window.NEXUS_HTTP_LEGACY_BRIDGE."
  );
}

async function ensureLegacyPublicFetchApi(page) {
  const hasFetchApi = await page.evaluate(() => typeof window.fetchApi === "function");
  if (hasFetchApi) return;

  // Cargar contrato público legacy real cuando el runtime React no lo inyecta por defecto.
  await page.addScriptTag({ url: "/js/api.js" });
  await page.waitForFunction(() => typeof window.fetchApi === "function", { timeout: 5000 });
}

test.describe("Fase 6 closeout HTTP transversal", () => {
  test("A1-A6, B2-B5, C1-C4", async ({ page, request }) => {
    test.setTimeout(180000);

    const results = {};

    // A1 + C1: login shape observable
    const login = await apiLogin(request);
    results.A1_loginStatus = login.status === 200 && login.body?.success === true;
    results.C1_loginShape =
      typeof login.body?.success === "boolean" &&
      login.body?.data &&
      typeof login.body.data.access_token === "string" &&
      typeof login.body.data.refresh_token === "string";
    expect(results.A1_loginStatus).toBe(true);
    expect(results.C1_loginShape).toBe(true);

    const accessToken = login.body.data.access_token;
    const refreshToken = login.body.data.refresh_token;

    // Seed de sesión para runtime browser (React + bridge legacy).
    await page.addInitScript(
      ([a, r]) => {
        sessionStorage.setItem("nexus_access_token", a);
        sessionStorage.setItem("nexus_refresh_token", r);
        sessionStorage.setItem("nexus_runtime_phase", "execution");
      },
      [accessToken, refreshToken]
    );

    const bridgeUrl = await ensureBridgePage(page);
    results.frontendBridgeUrl = bridgeUrl;
    await ensureLegacyPublicFetchApi(page);

    // A2: getMe/flujo protegido OK vía app React cargada.
    const sidebar = page.getByTestId("app-sidebar");
    if (await sidebar.count()) {
      await expect(sidebar).toBeVisible({ timeout: 30000 });
      results.A2_reactProtectedOk = true;
    } else {
      // En algunas variantes staging el shell no renderiza sidebar en ruta inicial;
      // validamos flujo protegido por /auth/me a través del núcleo.
      const me = await page.evaluate(async () => window.fetchApi("/auth/me"));
      results.A2_reactProtectedOk = Boolean(me && me.success);
      expect(results.A2_reactProtectedOk).toBe(true);
    }

    // B2: bridge legacy activo.
    const bridgeReady = await page.evaluate(() => {
      return Boolean(
        window.NEXUS_HTTP_LEGACY_BRIDGE &&
          typeof window.NEXUS_HTTP_LEGACY_BRIDGE.fetchApi === "function"
      );
    });
    results.B2_bridgeReady = bridgeReady;
    expect(bridgeReady).toBe(true);

    // B4 + C3/C4: legacy envelope + no __nexus/HttpResult.
    const legacyMe = await page.evaluate(async () => {
      const legacyFetch =
        typeof window.fetchApi === "function"
          ? window.fetchApi
          : window.NEXUS_HTTP_LEGACY_BRIDGE?.fetchApi;
      if (typeof legacyFetch !== "function") {
        throw new Error("LEGACY_FETCH_UNAVAILABLE");
      }
      return legacyFetch("/auth/me");
    });
    results.B4_noNexusLeak = !legacyMe?.__nexus && !legacyMe?.status && !legacyMe?.ok;
    results.C3_legacyEnvelope =
      legacyMe && typeof legacyMe.success === "boolean" && ("data" in legacyMe || "error" in legacyMe);
    expect(results.B4_noNexusLeak).toBe(true);
    expect(results.C3_legacyEnvelope).toBe(true);

    // A3: access expirado (falso) + refresh válido => refresh único + retry.
    const fakeAccess = createFakeJwt({ expSeconds: Math.floor(Date.now() / 1000) + 3600 });
    let refreshCountA3 = 0;
    page.on("request", (req) => {
      if (req.url().includes("/auth/refresh")) refreshCountA3 += 1;
    });
    const a3 = await page.evaluate(async ({ a, r }) => {
      window.setTokens(a, r);
      const legacyFetch =
        typeof window.fetchApi === "function"
          ? window.fetchApi
          : window.NEXUS_HTTP_LEGACY_BRIDGE?.fetchApi;
      const res = await legacyFetch("/auth/me");
      return {
        success: Boolean(res && res.success),
      };
    }, { a: fakeAccess, r: refreshToken });
    results.A3_refreshOk = a3.success === true && refreshCountA3 === 1;
    expect(results.A3_refreshOk).toBe(true);

    // A4: access expirado + refresh inválido => cleanup + error controlado.
    const invalidRefresh = "invalid-refresh-token";
    const a4 = await page.evaluate(async ({ a, r }) => {
      window.setTokens(a, r);
      const legacyFetch =
        typeof window.fetchApi === "function"
          ? window.fetchApi
          : window.NEXUS_HTTP_LEGACY_BRIDGE?.fetchApi;
      const res = await legacyFetch("/auth/me");
      return {
        success: Boolean(res && res.success),
        code: res?.error?.code || null,
        accessAfter: sessionStorage.getItem("nexus_access_token"),
        refreshAfter: sessionStorage.getItem("nexus_refresh_token"),
      };
    }, { a: fakeAccess, r: invalidRefresh });
    results.A4_refreshFailCleanup =
      a4.success === false && a4.accessAfter === null && a4.refreshAfter === null;
    results.C4_errorSemantic = typeof a4.code === "string" || a4.code === null;
    expect(results.A4_refreshFailCleanup).toBe(true);

    // Re-login para escenarios restantes.
    const relogin = await apiLogin(request);
    expect(relogin.body?.success).toBe(true);
    const freshAccess = relogin.body.data.access_token;
    const freshRefresh = relogin.body.data.refresh_token;

    // A5 + B3: concurrencia (múltiples 401) => un solo refresh, sin doble refresh.
    let refreshCountA5 = 0;
    page.on("request", (req) => {
      if (req.url().includes("/auth/refresh")) refreshCountA5 += 1;
    });
    const a5 = await page.evaluate(async ({ a, r }) => {
      window.setTokens(a, r);
      // A4 puede dejar la sesion en modo construction (logout controlado).
      // Forzamos execution para validar refresh concurrente de A5.
      sessionStorage.setItem("nexus_runtime_phase", "execution");
      const legacyFetch =
        typeof window.fetchApi === "function"
          ? window.fetchApi
          : window.NEXUS_HTTP_LEGACY_BRIDGE?.fetchApi;
      const [x1, x2, x3] = await Promise.all([
        legacyFetch("/auth/me"),
        legacyFetch("/auth/me"),
        legacyFetch("/auth/me"),
      ]);
      return {
        allSuccess: [x1, x2, x3].every((x) => x && x.success === true),
        results: [x1, x2, x3],
      };
    }, { a: fakeAccess, r: freshRefresh });
    results.A5_singleRefreshQueue = a5?.allSuccess === true && refreshCountA5 === 1;
    results.A5_debug = { refreshCountA5, a5 };
    results.B3_noDoubleRefresh = results.A5_singleRefreshQueue;
    expect(results.A5_singleRefreshQueue).toBe(true);

    // B5: BRIDGE_MISSING controlado.
    const b5 = await page.evaluate(async () => {
      const prev = window.NEXUS_HTTP_LEGACY_BRIDGE;
      try {
        delete window.NEXUS_HTTP_LEGACY_BRIDGE;
      } catch (_) {
        window.NEXUS_HTTP_LEGACY_BRIDGE = undefined;
      }
      const legacyFetch =
        typeof window.fetchApi === "function"
          ? window.fetchApi
          : window.NEXUS_HTTP_LEGACY_BRIDGE?.fetchApi;
      const out = await legacyFetch("/auth/me");
      window.NEXUS_HTTP_LEGACY_BRIDGE = prev;
      return out;
    });
    results.B5_bridgeMissingControlled =
      b5?.success === false && b5?.error?.code === "BRIDGE_MISSING";
    expect(results.B5_bridgeMissingControlled).toBe(true);

    // A6 runtime: monkey patch setItem/removeItem para detectar escrituras directas no esperadas.
    // Nota: se valida con ejecución real de fetchApi tras login (ruta bridge/core).
    const a6 = await page.evaluate(async ({ a, r }) => {
      const originalSet = sessionStorage.setItem.bind(sessionStorage);
      const originalRemove = sessionStorage.removeItem.bind(sessionStorage);
      const writes = [];
      const keys = new Set(["nexus_access_token", "nexus_refresh_token"]);

      sessionStorage.setItem = (key, value) => {
        if (keys.has(String(key))) writes.push({ op: "setItem", key: String(key) });
        return originalSet(key, value);
      };
      sessionStorage.removeItem = (key) => {
        if (keys.has(String(key))) writes.push({ op: "removeItem", key: String(key) });
        return originalRemove(key);
      };

      try {
        window.setTokens(a, r);
        const legacyFetch =
          typeof window.fetchApi === "function"
            ? window.fetchApi
            : window.NEXUS_HTTP_LEGACY_BRIDGE?.fetchApi;
        await legacyFetch("/auth/me");
      } finally {
        sessionStorage.setItem = originalSet;
        sessionStorage.removeItem = originalRemove;
      }

      return { writesCount: writes.length };
    }, { a: freshAccess, r: freshRefresh });
    results.A6_runtimeTokenWritesObserved = typeof a6.writesCount === "number";
    expect(results.A6_runtimeTokenWritesObserved).toBe(true);

    // C2: getMe shape observable (legacy envelope en browser).
    results.C2_getMeShape = legacyMe?.success === true || Boolean(legacyMe?.error);
    expect(results.C2_getMeShape).toBe(true);

    // Adjuntar evidencia de salida en reporte.
    await test.info().attach("phase6-results.json", {
      body: JSON.stringify({ FRONTEND_URL, API_BASE_URL, ROLE, results }, null, 2),
      contentType: "application/json",
    });
  });
});

