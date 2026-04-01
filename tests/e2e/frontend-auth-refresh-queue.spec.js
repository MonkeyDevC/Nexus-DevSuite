const { test, expect } = require("@playwright/test");

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createFakeJwt({ expSeconds }) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({ exp: expSeconds, iat: Math.floor(Date.now() / 1000) }));
  const signature = "invalid-signature";
  return `${header}.${payload}.${signature}`;
}

test.describe("frontend-react Auth: refresh queue + anti-loop", () => {
  test("múltiples 401 simultaneos => 1 refresh y reintentos resueltos", async ({ page }) => {
    test.setTimeout(60000);

    await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });

    const loginResp = await page.request.post("http://localhost:3000/api/v1/auth/login", {
      data: { email: "admin_nexus@nexus.com", password: "Zaq1029*" },
      headers: { "Content-Type": "application/json" }
    });
    const loginBody = await loginResp.json();
    expect(loginBody?.success).toBe(true);
    const refreshToken = loginBody?.data?.refresh_token;
    expect(typeof refreshToken).toBe("string");

    const fakeAccess = createFakeJwt({ expSeconds: Math.floor(Date.now() / 1000) + 3600 });

    let refreshCount = 0;
    page.on("request", (req) => {
      if (req.url().includes("/api/v1/auth/refresh")) refreshCount += 1;
    });

    const results = await page.evaluate(async ({ fakeAccess, refreshToken }) => {
      window.setTokens(fakeAccess, refreshToken);
      sessionStorage.setItem("nexus_runtime_phase", "execution");

      const apiClient = await import("http://localhost:5173/src/services/apiClient.js");

      apiClient.registerAuthCallbacks({
        onUnauthenticated: () => {},
        onTokensUpdated: () => {}
      });

      const [r1, r2, r3] = await Promise.all([apiClient.getMe(), apiClient.getMe(), apiClient.getMe()]);
      return { r1, r2, r3, storageAccess: sessionStorage.getItem("nexus_access_token") };
    }, { fakeAccess, refreshToken });

    expect(results?.r1?.success).toBe(true);
    expect(results?.r2?.success).toBe(true);
    expect(results?.r3?.success).toBe(true);

    // Con cola y lock, para este escenario deberían ocurrir 1 refresh por lote.
    expect(refreshCount).toBe(1);
  });

  test("refresh inválido => onUnauthenticated y tokens limpiados", async ({ page }) => {
    test.setTimeout(60000);

    await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });

    const fakeAccess = createFakeJwt({ expSeconds: Math.floor(Date.now() / 1000) + 3600 });
    const invalidRefresh = "invalid-refresh-token";

    const results = await page.evaluate(async ({ fakeAccess, invalidRefresh }) => {
      window.setTokens(fakeAccess, invalidRefresh);
      sessionStorage.setItem("nexus_runtime_phase", "execution");

      const apiClient = await import("http://localhost:5173/src/services/apiClient.js");
      let unauth = false;

      apiClient.registerAuthCallbacks({
        onUnauthenticated: () => {
          unauth = true;
        },
        onTokensUpdated: () => {}
      });

      const res = await apiClient.getMe();
      return {
        unauth,
        res,
        accessAfter: sessionStorage.getItem("nexus_access_token"),
        refreshAfter: sessionStorage.getItem("nexus_refresh_token")
      };
    }, { fakeAccess, invalidRefresh });

    expect(results.unauth).toBe(true);
    expect(results.accessAfter).toBe(null);
    expect(results.refreshAfter).toBe(null);
    expect(results.res?.success).toBe(false);
  });
});

