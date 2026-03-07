/**
 * -------------------------------------------------------------
 * Script: QA Día 2 — Validación de envelope y criterios enterprise
 * Ejecutar con: node scripts/qa-dia2.js
 * Requiere servidor levantado (npm run dev).
 * -------------------------------------------------------------
 */

const http = require("http");

const BASE_URL = process.env.QA_BASE_URL || "http://localhost:3000";

function request(method, path, body = null, headers = {}) {
  const url = new URL(path, BASE_URL);
  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname + url.search,
    method,
    headers: { "Content-Type": "application/json", ...headers }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json
          });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body && (method === "POST" || method === "PUT")) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function validTimestamp(ts) {
  if (!ts || typeof ts !== "string") return false;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return false;
  return ts.endsWith("Z");
}

const results = [];

async function runCase(name, fn) {
  try {
    const out = await fn();
    results.push({ name, ...out });
    return out;
  } catch (err) {
    results.push({ name, status: 0, error: err.message, envelopeValid: false, result: "FAIL" });
    return null;
  }
}

async function main() {
  console.log("QA Día 2 — Validación enterprise\nBase URL:", BASE_URL, "\n");

  await runCase("GET /api/v1/health", async () => {
    const r = await request("GET", "/api/v1/health");
    const hasVersionHeader = r.headers["x-response-version"] === "1";
    const envelopeValid = r.status === 200 && hasVersionHeader;
    return {
      statusExpected: 200,
      statusReal: r.status,
      envelopeValid: !!envelopeValid,
      result: envelopeValid ? "PASS" : "FAIL",
      xResponseVersion: r.headers["x-response-version"]
    };
  });

  await runCase("POST /auth/login inválido (401)", async () => {
    const r = await request("POST", "/api/v1/auth/login", { email: "nonexistent@example.com", password: "wrong12" });
    const envelopeValid =
      r.status === 401 &&
      r.body.success === false &&
      r.body.error?.code &&
      r.body.meta?.request_id &&
      validTimestamp(r.body.meta?.timestamp) &&
      r.headers["x-response-version"] === "1";
    const no500 = r.status !== 500;
    return {
      statusExpected: 401,
      statusReal: r.status,
      envelopeValid: !!envelopeValid,
      result: no500 && envelopeValid ? "PASS" : "FAIL",
      no500
    };
  });

  await runCase("GET ruta inexistente (404)", async () => {
    const r = await request("GET", "/api/v1/nonexistent");
    const envelopeValid =
      r.status === 404 &&
      r.body.success === false &&
      r.body.error?.code &&
      r.body.meta?.request_id &&
      r.headers["x-response-version"] === "1";
    return {
      statusExpected: 404,
      statusReal: r.status,
      envelopeValid: !!envelopeValid,
      result: envelopeValid ? "PASS" : "FAIL"
    };
  });

  await runCase("Sin token (401)", async () => {
    const r = await request("GET", "/api/v1/auth/me");
    const envelopeValid =
      r.status === 401 &&
      r.body.success === false &&
      r.body.meta?.request_id &&
      r.headers["x-response-version"] === "1";
    return {
      statusExpected: 401,
      statusReal: r.status,
      envelopeValid: !!envelopeValid,
      result: r.status === 401 ? "PASS" : "FAIL"
    };
  });

  await runCase("Unicidad request_id", async () => {
    const r1 = await request("GET", "/api/v1/health");
    const r2 = await request("GET", "/api/v1/health");
    const id1 = r1.body?.meta?.request_id || r1.body?.request_id || r1.headers["x-request-id"];
    const id2 = r2.body?.meta?.request_id || r2.body?.request_id || r2.headers["x-request-id"];
    const different = id1 && id2 && id1 !== id2;
    return {
      statusExpected: "different_ids",
      statusReal: different ? "ok" : "same_or_missing",
      envelopeValid: different,
      result: different ? "PASS" : "FAIL"
    };
  });

  const passed = results.filter((r) => r.result === "PASS").length;
  const total = results.length;

  console.log("\n--- Resultados ---\n");
  console.log("Caso | Status esperado | Status real | Envelope válido | Resultado");
  console.log("-".repeat(70));
  results.forEach((r) => {
    console.log(
      [r.name, r.statusExpected ?? "-", r.statusReal ?? r.status ?? "-", r.envelopeValid ? "Sí" : "No", r.result ?? "FAIL"].join(" | ")
    );
  });
  console.log("-".repeat(70));
  console.log(`\nCumplimiento: ${passed}/${total} (${total ? Math.round((passed / total) * 100) : 0}%)\n`);

  const fs = require("fs");
  const path = require("path");
  const docPath = path.join(__dirname, "..", "docs", "DIA_2_QA_EVIDENCIA.md");
  const dir = path.dirname(docPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const table = results
    .map(
      (r) =>
        `| ${r.name} | ${r.statusExpected ?? "-"} | ${r.statusReal ?? r.status ?? "-"} | ${r.envelopeValid ? "Sí" : "No"} | ${r.result ?? "FAIL"} |`
    )
    .join("\n");
  const md = `# DIA 2 — Evidencia QA

Generado por \`scripts/qa-dia2.js\`

## Tabla de resultados

| Caso | Status esperado | Status real | Envelope válido | Resultado |
|------|-----------------|------------|-----------------|-----------|
${table}

## Cumplimiento

${passed}/${total} (${total ? Math.round((passed / total) * 100) : 0}%)
`;
  fs.writeFileSync(docPath, md, "utf8");
  console.log("Evidencia escrita en docs/DIA_2_QA_EVIDENCIA.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
