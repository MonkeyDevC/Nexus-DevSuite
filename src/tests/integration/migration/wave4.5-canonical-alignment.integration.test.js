/**
 * WAVE 4.5 — Alineación canónica: dependencias de proyecto, alcance CR, conteos export ejecutivo.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");
const releaseRepository = require("../../../modules/releases/release.repository");
const { parseSemVer } = require("../../../modules/releases/semver.validator");
const { computeReleaseCounts } = require("../../../modules/docs-export/providers/executiveData.provider");

const TEST_MASTER_EMAIL = "test-master-wave45-align@nexus.local";
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

describe("WAVE 4.5 — canonical alignment", () => {
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
    baseMajor = parsed ? parsed.major + 40 : 130000 + (Date.now() % 40000);
  });

  async function createApprovedCRForRelease(releaseId) {
    const crRes = await request(app)
      .post("/api/v1/change-requests")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "CR W45", entity_type: "RELEASE", entity_id: releaseId })
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

  test("DELETE proyecto elimina en cascada (release vía user_stories.release_id; feature ARCHIVED, story DONE)", async () => {
    const ts = Date.now();
    const pr = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: `P W45 ${ts}`, description: "d" })
      .expect(201);
    const projectId = pr.body.data.id;

    const feat = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: `F ${ts}`, description: "d" })
      .expect(201);
    const featureId = feat.body.data.id;

    const st = await request(app)
      .post(`/api/v1/features/${featureId}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: `S ${ts}`, description: "d" })
      .expect(201);
    const storyId = st.body.data.id;

    const v = `${baseMajor}.w45.${ts % 100000}`;
    const rel = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: `R ${ts}`, version: v, description: "d" })
      .expect(201);
    const releaseId = rel.body.data.id;

    await request(app)
      .post(`/api/v1/stories/${storyId}/assign-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ release_id: releaseId })
      .expect(200);

    const { Feature, UserStory } = getModels();
    await Feature.update({ status: "ARCHIVED" }, { where: { id: featureId } });
    await UserStory.update({ status: "DONE" }, { where: { id: storyId } });

    const cur = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    const expectedVersion = cur.body.data.version;

    const del = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ expected_version: expectedVersion });
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
    expect(del.body.data.deleted).toBe(true);
    const gone = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", `Bearer ${masterToken}`);
    expect(gone.status).toBe(404);
  });

  test("GET change-requests por proyecto incluye release alcanzada solo por historias (canónico)", async () => {
    const ts = Date.now() + 1;
    const pr = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: `P CR W45 ${ts}`, description: "d" })
      .expect(201);
    const projectId = pr.body.data.id;

    const feat = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: `F2 ${ts}`, description: "d" })
      .expect(201);
    const featureId = feat.body.data.id;

    const st = await request(app)
      .post(`/api/v1/features/${featureId}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: `S2 ${ts}`, description: "d" })
      .expect(201);
    const storyId = st.body.data.id;

    const v = `${baseMajor}.w45cr.${ts % 100000}`;
    const rel = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: `R2 ${ts}`, version: v, description: "d" })
      .expect(201);
    const releaseId = rel.body.data.id;

    await request(app)
      .post(`/api/v1/stories/${storyId}/assign-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ release_id: releaseId })
      .expect(200);

    const crRes = await request(app)
      .post("/api/v1/change-requests")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        title: "CR scope",
        entity_type: "RELEASE",
        entity_id: releaseId
      })
      .expect(201);
    const crId = crRes.body.data.id;

    const list = await request(app)
      .get("/api/v1/change-requests")
      .set("Authorization", `Bearer ${masterToken}`)
      .query({ project_id: projectId })
      .expect(200);

    const ids = (list.body.data.items || []).map((x) => x.id);
    expect(ids).toContain(crId);
  });

  test("computeReleaseCounts: stories y features solo por user_stories.release_id", async () => {
    const ts = Date.now() + 2;
    const { Release } = getModels();
    const pr = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: `P CNT ${ts}`, description: "d" })
      .expect(201);
    const projectId = pr.body.data.id;

    const feat = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: `FC ${ts}`, description: "d" })
      .expect(201);
    const featureId = feat.body.data.id;

    const s1 = await request(app)
      .post(`/api/v1/features/${featureId}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: `A ${ts}`, description: "d" })
      .expect(201);
    const s2 = await request(app)
      .post(`/api/v1/features/${featureId}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: `B ${ts}`, description: "d" })
      .expect(201);

    const v = `${baseMajor}.w45cnt.${ts % 100000}`;
    const rel = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: `RC ${ts}`, version: v, description: "d" })
      .expect(201);
    const releaseId = rel.body.data.id;

    await request(app)
      .post(`/api/v1/stories/${s1.body.data.id}/assign-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ release_id: releaseId })
      .expect(200);
    await request(app)
      .post(`/api/v1/stories/${s2.body.data.id}/assign-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ release_id: releaseId })
      .expect(200);

    const { Project } = getModels();
    const projectRow = await Project.findByPk(projectId);
    const orgId = projectRow ? projectRow.organization_id : null;
    const releaseRow = await Release.findByPk(releaseId);
    expect(releaseRow).toBeTruthy();

    const counts = await computeReleaseCounts(releaseRow, orgId);
    expect(counts.storiesCount).toBe(2);
    expect(counts.featuresCount).toBe(1);
    expect(counts.featureIds.length).toBe(1);
  });
});
