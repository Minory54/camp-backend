import { after, test, mock } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { buildApp } from "../src/app.js";
import { db } from "../src/prisma/db.js";
import { hashAccessToken } from "../src/modules/students/students.service.js";

const app = buildApp();
app.log.level = "silent";
const tag = crypto.randomUUID();
const studentIds = new Set<string>();
const practiceIds = new Set<number>();
const lessonIds = new Set<number>();

after(async () => {
  await app.close();
  for (const id of lessonIds) await db.orm.public.Lessons.where({ id }).delete();
  for (const id of studentIds) await db.orm.public.Students.where({ id }).delete();
  for (const id of practiceIds) await db.orm.public.Practices.where({ id }).delete();
  await db.close();
});

const headers = (token: string) => ({ authorization: `Bearer ${token}` });
async function register(name: string) {
  const response = await app.inject({
    method: "POST", url: "/api/students", payload: { display_code: ` ${tag}-${name} ` },
  });
  if (response.statusCode === 201) studentIds.add(response.json().student.id);
  return response;
}
function assertNoCredentials(value: unknown) {
  if (typeof value !== "object" || value === null) return;
  for (const [key, nested] of Object.entries(value)) {
    assert.ok(!["recovery_code", "access_token"].includes(key), `Unexpected credential: ${key}`);
    assertNoCredentials(nested);
  }
}

test("registration, restoration, token revocation, validation and account ownership", async () => {
  const response = await register("first");
  assert.equal(response.statusCode, 201, response.body);
  assert.equal(response.headers["cache-control"], "private, no-store");
  const account = response.json();
  assert.match(account.recovery_code, /^SDC[0-9]{4}$/);
  assert.match(account.access_token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(account.student.display_code, `${tag}-first`);
  assertNoCredentials(account.student);
  const stored = await db.orm.public.Students.first({ id: account.student.id });
  assert.equal(stored?.access_token, hashAccessToken(account.access_token));
  assert.notEqual(stored?.access_token, account.access_token);

  const duplicate = await register("first");
  assert.equal(duplicate.statusCode, 409, duplicate.body);
  for (const payload of [ {}, { display_code: "   " }, { display_code: 12 },
    { display_code: "a".repeat(256) }, { display_code: `${tag}-extra`, access_token: "chosen" },
    { display_code: `${tag}-extra`, recovery_code: "SDC1111" } ]) {
    const invalid = await app.inject({ method: "POST", url: "/api/students", payload });
    if (invalid.statusCode === 201) studentIds.add(invalid.json().student.id);
    assert.equal(invalid.statusCode, 400, invalid.body);
  }
  for (const recovery_code of ["", "restore-alisa-2026", "SDC123", "SDC12345", "sdc1234", " SDC1234 "]) {
    const invalid = await app.inject({ method: "POST", url: "/api/students/recover", payload: { recovery_code } });
    assert.equal(invalid.statusCode, 400, invalid.body);
  }
  const used = new Set((await db.orm.public.Students.select("recovery_code").all()).map((row) => row.recovery_code));
  const unused = Array.from({ length: 10000 }, (_, n) => `SDC${String(n).padStart(4, "0")}`).find((code) => !used.has(code));
  assert.ok(unused);
  const incorrect = await app.inject({ method: "POST", url: "/api/students/recover", payload: { recovery_code: unused } });
  assert.equal(incorrect.statusCode, 401);
  assert.equal((await db.orm.public.Students.first({ id: account.student.id }))?.access_token, stored?.access_token);

  const group = await db.orm.public.Groups.first();
  const language = await db.orm.public.Code_languages.first();
  assert.ok(group && language, "seed.base is required");
  const practice = await db.orm.public.Practices.create({ title: `access-${tag}`, mdx_source: "test", test_js: "test" });
  practiceIds.add(practice.id);
  const lessons = await db.orm.public.Lessons.where({ id_group: group.id }).all();
  const lesson = await db.orm.public.Lessons.create({
    id_group: group.id, position: Math.max(0, ...lessons.map((row) => row.position)) + 1,
    title: `access-${tag}`, id_practice: practice.id,
  });
  lessonIds.add(lesson.id);
  const progress = await db.orm.public.Lesson_progress.create({
    id_student: account.student.id, id_lesson: lesson.id, theory_completed_at: new Date(0).toISOString(),
  });
  const save = await db.orm.public.Practice_saves.create({ id_student: account.student.id, id_practice: practice.id });
  const file = await db.orm.public.Practice_files.create({
    id_practice: practice.id, id_code_language: language.id, filename: "index.html", code: "starter",
  });
  const savedFile = await db.orm.public.Save_files.create({ id_practice_save: save.id, id_practice_file: file.id, code: "my work" });

  const restoredResponse = await app.inject({
    method: "POST", url: "/api/students/recover", payload: { recovery_code: account.recovery_code },
  });
  assert.equal(restoredResponse.statusCode, 200, restoredResponse.body);
  const restored = restoredResponse.json();
  assert.equal(restored.student.id, account.student.id);
  assert.notEqual(restored.access_token, account.access_token);
  assertNoCredentials(restored.student);
  assert.equal(restored.recovery_code, undefined);
  assert.equal((await db.orm.public.Students.first({ id: account.student.id }))?.access_token, hashAccessToken(restored.access_token));
  assert.equal((await db.orm.public.Lesson_progress.first({ id: progress.id }))?.id_student, account.student.id);
  assert.equal((await db.orm.public.Save_files.first({ id: savedFile.id }))?.code, "my work");

  for (const token of [undefined, account.access_token, stored!.access_token, "invalid"]) {
    const invalid = await app.inject({ method: "GET", url: "/api/students/me", headers: token ? headers(token) : {} });
    assert.equal(invalid.statusCode, 401, invalid.body);
  }
  const authorized = headers(restored.access_token);
  const me = await app.inject({ method: "GET", url: "/api/students/me", headers: authorized });
  assert.equal(me.statusCode, 200, me.body);
  assertNoCredentials(me.json());

  const otherResponse = await register("other");
  assert.equal(otherResponse.statusCode, 201, otherResponse.body);
  const other = otherResponse.json();
  const otherHeaders = headers(other.access_token);
  const foreignURLs = [ `/api/students/${account.student.id}`, `/api/lesson-progress/${progress.id}`,
    `/api/practice-saves/${save.id}`, `/api/save-files/${savedFile.id}` ];
  for (const url of foreignURLs) {
    for (const method of ["GET", "DELETE", "PATCH"] as const) {
      const payload = method === "PATCH" ? (url.includes("students") ? { label: "other" }
        : url.includes("lesson-progress") ? { theory_completed_at: null }
        : url.includes("practice-saves") ? { id_student: other.student.id } : { code: "other" }) : undefined;
      const result = await app.inject({ method, url, headers: otherHeaders, payload });
      assert.equal(result.statusCode, 403, result.body);
    }
  }
  for (const url of [ "/api/students", "/api/lesson-progress", "/api/practice-saves", "/api/save-files",
    `/api/courses/${group.id_course}/progress` ]) {
    const anonymous = await app.inject({ method: "GET", url });
    assert.equal(anonymous.statusCode, 401, anonymous.body);
    const own = await app.inject({ method: "GET", url, headers: authorized });
    assert.equal(own.statusCode, 200, own.body);
    assertNoCredentials(own.json());
  }
  for (const url of [ "/api/lesson-progress", "/api/practice-saves" ]) {
    const list = await app.inject({ method: "GET", url, headers: otherHeaders });
    assert.deepEqual(list.json(), [], list.body);
    const foreign = await app.inject({ method: "GET", url: `${url}?studentId=${account.student.id}`, headers: otherHeaders });
    assert.equal(foreign.statusCode, 403);
  }
  assert.deepEqual((await app.inject({ method: "GET", url: "/api/save-files", headers: otherHeaders })).json(), []);
  const foreignCourse = await app.inject({ method: "GET", url: `/api/courses/${group.id_course}/progress?studentId=${account.student.id}`, headers: otherHeaders });
  assert.equal(foreignCourse.statusCode, 403);
  for (const key of ["access_token", "recovery_code"]) {
    const change = await app.inject({ method: "PATCH", url: `/api/students/${account.student.id}`, headers: authorized, payload: { [key]: "chosen" } });
    assert.equal(change.statusCode, 400, change.body);
  }
  const profile = await app.inject({ method: "PATCH", url: `/api/students/${account.student.id}`, headers: authorized, payload: { label: " Student " } });
  assert.equal(profile.statusCode, 200, profile.body);
  assert.equal(profile.json().label, "Student");
  assertNoCredentials(profile.json());

  const submissions = [
    { url: "/api/tests/answer", payload: { id_student: account.student.id, id_question: 1, selected_option_ids: [] } },
    { url: "/api/practices/check", payload: { id_student: account.student.id, id_lesson: lesson.id, files: [{ id_practice_file: file.id, code: "other" }] } },
    { url: "/api/lesson-progress", payload: { id_student: account.student.id, id_lesson: lesson.id } },
    { url: "/api/practice-saves", payload: { id_student: account.student.id, id_practice: practice.id } },
    { url: "/api/save-files", payload: { id_practice_save: save.id, id_practice_file: file.id, code: "other" } },
  ];
  for (const { url, payload } of submissions) {
    assert.equal((await app.inject({ method: "POST", url, payload })).statusCode, 401);
    const foreign = await app.inject({ method: "POST", url, payload, headers: otherHeaders });
    assert.equal(foreign.statusCode, 403, foreign.body);
  }
  for (const url of [ `/api/lessons/${lesson.id}`, `/api/practices/${practice.id}` ]) {
    const material = await app.inject({ method: "GET", url });
    assert.equal(material.statusCode, 200, material.body);
    assert.equal(material.json().Lesson_progress, undefined);
    assert.equal(material.json().Practice_saves, undefined);
  }
});

test("leading zeroes and concurrent recovery code and display code conflicts", async () => {
  const random = mock.method(crypto, "randomInt", () => 0);
  try {
    const leading = await register("zero");
    assert.equal(leading.statusCode, 201, leading.body);
    assert.match(leading.json().recovery_code, /^SDC0[0-9]{3}$/);
    const concurrent = await Promise.all(Array.from({ length: 8 }, (_, index) => register(`parallel-${index}`)));
    for (const result of concurrent) assert.equal(result.statusCode, 201, result.body);
    assert.equal(new Set(concurrent.map((result) => result.json().recovery_code)).size, concurrent.length);
    const sameName = await Promise.all([register("same-name"), register("same-name")]);
    assert.deepEqual(sameName.map((result) => result.statusCode).sort(), [201, 409]);
  } finally {
    random.mock.restore();
  }
});

test("recovery code exhaustion returns a conflict without creating an account", async () => {
  const students = db.orm.public.Students;
  const select = students.select.bind(students);
  const exhausted = mock.method(students, "select", ((...fields: string[]) => {
    if (fields.length === 1 && fields[0] === "recovery_code") {
      return { all: async () => Array.from({ length: 10000 }, (_, number) => ({
        recovery_code: `SDC${String(number).padStart(4, "0")}`,
      })) };
    }
    return Reflect.apply(select, undefined, fields);
  }) as typeof students.select);
  try {
    const result = await register("exhausted");
    assert.equal(result.statusCode, 409, result.body);
    assert.match(result.json().message, /Все recovery_code заняты/);
    assert.equal(await students.first({ display_code: `${tag}-exhausted` }), null);
  } finally {
    exhausted.mock.restore();
  }
});
