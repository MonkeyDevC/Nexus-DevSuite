/**
 * WAVE 4 — Releases: integración dominio, CR obligatorio en start/release,
 * assign/remove story canónico, DELETE shape, RELEASE_FROZEN, RELEASE_EMPTY.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");
const releaseRepository = require("../../../modules/releases/release.repository");
const { parseSemVer } = require("../../../modules/releases/semver.validator");

const TEST_MASTER_EMAIL = "test-master-wave4-releases@nexus.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";

let app;
let masterToken;
let baseMajor;

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  const appModule = require("../../../app");
  app = appModule.app;
}, 15000);

describe("Releases WAVE 4 — integración", () => {
  beforeAll(async () => {
    const { User, Role } = getModels();
    const masterRole = await Role.findOne({ where: { name: "MASTER" } });
    if (!masterRole) throw new Error("Rol MASTER no existe");
    let masterUser = await User.unscoped().findOne({ where: { email: TEST_MASTER_EMAIL } });
    if (!masterUser) {
      masterUser = await User.create({
        email: TEST_MASTER_EMAIL,
        password_hash: bcrypt.hashSync(TEST_MASTER_PASSWORD, 10),
        role_id: masterRole.id,
        is_active: true
      });
    }
    const loginMaster = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_MASTER_EMAIL, password: TEST_MASTER_PASSWORD });
    if (loginMaster.status !== 200 || !loginMaster.body.data?.access_token) {
      throw new Error(`Login falló: ${JSON.stringify(loginMaster.body)}`);
    }
    masterToken = loginMaster.body.data.access_token;
    const latest = await releaseRepository.findLatestReleased();
    const parsed = latest ? parseSemVer(latest.version) : null;
    baseMajor = parsed ? parsed.major + 30 : 120000 + (Date.now() % 40000);
  });

  async function createApprovedCRForRelease(releaseId) {
    const crRes = await request(app)
      .post("/api/v1/change-requests")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "CR W4", entity_type: "RELEASE", entity_id: releaseId })
      .expect(201);
    const crId = crRes.body.data.id;
    await request(app)
      .patch(`/api/v1/change-requests/${crId}/submit`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    await request(app)
      .patch(`/api/v1/change-requests/${crId}/approve`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    return crId;
  }

  async function createStory(featureId) {
    const res = await request(app)
      .post(`/api/v1/features/${featureId}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S " + Date.now(), description: "D" })
      .expect(201);
    return res.body.data.id;
  }

  test("create + list + get detail incluye stories y release_date", async () => {
    const v = `${baseMajor}.w4.${Date.now() % 100000}`;
    const cre = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Wave4 Alpha", version: v, description: "x" })
      .expect(201);
    expect(cre.body.data.name).toBe("Wave4 Alpha");
    expect(cre.body.data.version).toBe(v);

    const list = await request(app).get("/api/v1/releases").set("Authorization", `Bearer ${masterToken}`).expect(200);
    expect(list.body.success).toBe(true);
    expect(Array.isArray(list.body.data.items)).toBe(true);

    const one = await request(app)
      .get(`/api/v1/releases/${cre.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(Array.isArray(one.body.data.stories)).toBe(true);
    expect(one.body.data).toHaveProperty("release_date");
  });

  test("PUT release con change_request_id", async () => {
    const v = `${baseMajor}.w4p.${Date.now() % 100000}`;
    const cre = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Put Me", version: v, description: "a" })
      .expect(201);
    const rid = cre.body.data.id;
    const crId = await createApprovedCRForRelease(rid);
    const put = await request(app)
      .put(`/api/v1/releases/${rid}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId, description: "b" })
      .expect(200);
    expect(put.body.data.description).toBe("b");
  });

  test("POST start y release exigen change_request_id en body", async () => {
    const v = `${baseMajor}.w4cr.${Date.now() % 100000}`;
    const cre = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "CR Body", version: v, description: "d" })
      .expect(201);
    const rid = cre.body.data.id;
    const noCrStart = await request(app)
      .post(`/api/v1/releases/${rid}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({})
      .expect(400);
    expect(noCrStart.body.error.code).toBe("VALIDATION_ERROR");
    const cr1 = await createApprovedCRForRelease(rid);
    await request(app)
      .post(`/api/v1/releases/${rid}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: cr1 })
      .expect(200);
    const noCrRel = await request(app)
      .post(`/api/v1/releases/${rid}/release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({})
      .expect(400);
    expect(noCrRel.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("DELETE solo PLANNED y body exacto success + data.id + meta vacío", async () => {
    const v = `${baseMajor}.w4d.${Date.now() % 100000}`;
    const cre = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Del Me", version: v, description: "d" })
      .expect(201);
    const rid = cre.body.data.id;
    const del = await request(app).delete(`/api/v1/releases/${rid}`).set("Authorization", `Bearer ${masterToken}`).expect(200);
    expect(del.body).toEqual({ success: true, data: { id: rid }, meta: {} });
    const v2 = `${baseMajor}.w4d2.${Date.now() % 100000}`;
    const cre2 = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "No Del", version: v2, description: "d" })
      .expect(201);
    const rid2 = cre2.body.data.id;
    const cr = await createApprovedCRForRelease(rid2);
    await request(app)
      .post(`/api/v1/releases/${rid2}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: cr })
      .expect(200);
    const bad = await request(app).delete(`/api/v1/releases/${rid2}`).set("Authorization", `Bearer ${masterToken}`).expect(409);
    expect(bad.body.error.code).toBe("RELEASE_INVALID_STATE");
  });

  test("assign-release + remove-release + idempotencia + STORY_ALREADY_IN_RELEASE", async () => {
    const proj = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "P W4 " + Date.now(), description: "d" })
      .expect(201);
    const feat = await request(app)
      .post(`/api/v1/projects/${proj.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "d" })
      .expect(201);
    const vA = `${baseMajor}.w4as.${Date.now() % 100000}`;
    const vB = `${baseMajor}.w4as2.${Date.now() % 100000}`;
    const rA = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "RA", version: vA, description: "d" })
      .expect(201);
    const rB = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "RB", version: vB, description: "d" })
      .expect(201);
    const sid = await createStory(feat.body.data.id);
    await request(app)
      .post(`/api/v1/stories/${sid}/assign-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ release_id: rA.body.data.id })
      .expect(200);
    await request(app)
      .post(`/api/v1/stories/${sid}/assign-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ release_id: rA.body.data.id })
      .expect(200);
    const clash = await request(app)
      .post(`/api/v1/stories/${sid}/assign-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ release_id: rB.body.data.id })
      .expect(400);
    expect(clash.body.error.code).toBe("STORY_ALREADY_IN_RELEASE");
    await request(app)
      .post(`/api/v1/stories/${sid}/remove-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({})
      .expect(200);
    await request(app)
      .post(`/api/v1/stories/${sid}/remove-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({})
      .expect(200);
  });

  test("RELEASE_EMPTY al publicar sin stories", async () => {
    const v = `${baseMajor}.w4em.${Date.now() % 100000}`;
    const cre = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Empty", version: v, description: "d" })
      .expect(201);
    const rid = cre.body.data.id;
    let cr = await createApprovedCRForRelease(rid);
    await request(app)
      .post(`/api/v1/releases/${rid}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: cr })
      .expect(200);
    cr = await createApprovedCRForRelease(rid);
    const rel = await request(app)
      .post(`/api/v1/releases/${rid}/release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: cr })
      .expect(400);
    expect(rel.body.error.code).toBe("RELEASE_EMPTY");
  });

  test("RELEASE_FROZEN en edición y assign tras RELEASED", async () => {
    const proj = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "P FZ " + Date.now(), description: "d" })
      .expect(201);
    const feat = await request(app)
      .post(`/api/v1/projects/${proj.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "d" })
      .expect(201);
    const v = `${baseMajor}.w4fz.${Date.now() % 100000}`;
    const cre = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Frozen", version: v, description: "d" })
      .expect(201);
    const rid = cre.body.data.id;
    const sid = await createStory(feat.body.data.id);
    await request(app)
      .post(`/api/v1/stories/${sid}/assign-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ release_id: rid })
      .expect(200);
    let cr = await createApprovedCRForRelease(rid);
    await request(app)
      .post(`/api/v1/releases/${rid}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: cr })
      .expect(200);
    cr = await createApprovedCRForRelease(rid);
    await request(app)
      .post(`/api/v1/releases/${rid}/release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: cr })
      .expect(200);
    cr = await createApprovedCRForRelease(rid);
    const put = await request(app)
      .put(`/api/v1/releases/${rid}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: cr, description: "nope" })
      .expect(400);
    expect(put.body.error.code).toBe("RELEASE_FROZEN");
    const sid2 = await createStory(feat.body.data.id);
    const asg = await request(app)
      .post(`/api/v1/stories/${sid2}/assign-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ release_id: rid })
      .expect(400);
    expect(asg.body.error.code).toBe("RELEASE_FROZEN");
  });

  test("RELEASE_INVALID_TRANSITION desde RELEASED", async () => {
    const proj = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "P TR " + Date.now(), description: "d" })
      .expect(201);
    const feat = await request(app)
      .post(`/api/v1/projects/${proj.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "d" })
      .expect(201);
    const v = `${baseMajor}.w4tr.${Date.now() % 100000}`;
    const cre = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Term", version: v, description: "d" })
      .expect(201);
    const rid = cre.body.data.id;
    const sid = await createStory(feat.body.data.id);
    await request(app)
      .post(`/api/v1/stories/${sid}/assign-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ release_id: rid })
      .expect(200);
    let cr = await createApprovedCRForRelease(rid);
    await request(app)
      .post(`/api/v1/releases/${rid}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: cr })
      .expect(200);
    cr = await createApprovedCRForRelease(rid);
    await request(app)
      .post(`/api/v1/releases/${rid}/release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: cr })
      .expect(200);
    cr = await createApprovedCRForRelease(rid);
    const patch = await request(app)
      .patch(`/api/v1/releases/${rid}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS", change_request_id: cr })
      .expect(400);
    expect(patch.body.error.code).toBe("RELEASE_INVALID_TRANSITION");
  });
});
