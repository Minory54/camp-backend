import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { buildApp } from "../src/app.js";
import { hashAccessToken } from "../src/modules/students/students.service.js";
import { db } from "../src/prisma/db.js";
import { DOCUMENT_STRUCTURE_TEST_JS } from "../src/prisma/seeds/practice-test-sources.js";
import { runPracticeCheck } from "../src/modules/practices/practice-check.runner.js";

const app = buildApp();
const tag = randomUUID();
const studentToken = randomBytes(32).toString("base64url");
const otherStudentToken = randomBytes(32).toString("base64url");
let studentId: string;
let otherStudentId: string;
let practiceId: number;
let cssPracticeId: number;
let lessonId: number;
let cssLessonId: number;
let foreignPracticeId: number;
let foreignFileId: number;
let otherHtmlId: number;
let indexHtmlId: number;
let cssIds: number[] = [];

before(async () => {
  const group = await db.orm.public.Groups.first();
  const html = await db.orm.public.Code_languages.first({ title: "html" });
  const css = await db.orm.public.Code_languages.first({ title: "css" });
  assert.ok(group && html && css, "seed.base is required");
  const existing = await db.orm.public.Lessons.where({ id_group: group.id }).all();
  const position = Math.max(0, ...existing.map((lesson) => lesson.position)) + 1;
  const student = await db.orm.public.Students.create({
    display_code: `check-${tag}`,
    recovery_code: `recover-${tag}`,
    access_token: hashAccessToken(studentToken),
  });
  const otherStudent = await db.orm.public.Students.create({
    display_code: `check-other-${tag}`,
    recovery_code: `recover-other-${tag}`,
    access_token: hashAccessToken(otherStudentToken),
  });
  studentId = student.id;
  otherStudentId = otherStudent.id;
  practiceId = (
    await db.orm.public.Practices.create({
      title: `Check ${tag}`,
      mdx_source: "test",
      test_js: DOCUMENT_STRUCTURE_TEST_JS,
    })
  ).id;
  cssPracticeId = (
    await db.orm.public.Practices.create({
      title: `CSS ${tag}`,
      mdx_source: "test",
      test_js: "if (document.styleSheets.length < 2) throw new Error('missing CSS')",
    })
  ).id;
  foreignPracticeId = (
    await db.orm.public.Practices.create({
      title: `Foreign ${tag}`,
      mdx_source: "test",
      test_js: "",
    })
  ).id;
  otherHtmlId = (
    await db.orm.public.Practice_files.create({
      id_practice: practiceId,
      id_code_language: html.id,
      filename: "other.html",
      code: "<h1>other</h1>",
    })
  ).id;
  indexHtmlId = (
    await db.orm.public.Practice_files.create({
      id_practice: practiceId,
      id_code_language: html.id,
      filename: "index.html",
      code: "<h1>index</h1>",
    })
  ).id;
  for (const name of ["style.css", "header.css", "cards.css"]) {
    cssIds.push(
      (
        await db.orm.public.Practice_files.create({
          id_practice: practiceId,
          id_code_language: css.id,
          filename: name,
          code: `.${name} { color: red; }`,
        })
      ).id,
    );
  }
  for (const name of ["one.css", "two.css"]) {
    await db.orm.public.Practice_files.create({
      id_practice: cssPracticeId,
      id_code_language: css.id,
      filename: name,
      code: `.${name} { display: flex; }`,
    });
  }
  foreignFileId = (
    await db.orm.public.Practice_files.create({
      id_practice: foreignPracticeId,
      id_code_language: css.id,
      filename: "foreign.css",
      code: "a{}",
    })
  ).id;
  lessonId = (
    await db.orm.public.Lessons.create({
      id_group: group.id,
      position,
      title: `Check ${tag}`,
      id_practice: practiceId,
    })
  ).id;
  cssLessonId = (
    await db.orm.public.Lessons.create({
      id_group: group.id,
      position: position + 1,
      title: `CSS ${tag}`,
      id_practice: cssPracticeId,
    })
  ).id;
});

after(async () => {
  await app.close();
  for (const id of [lessonId, cssLessonId])
    if (id) await db.orm.public.Lessons.where({ id }).delete();
  for (const id of [studentId, otherStudentId])
    if (id) await db.orm.public.Students.where({ id }).delete();
  for (const id of [practiceId, cssPracticeId, foreignPracticeId])
    if (id) await db.orm.public.Practices.where({ id }).delete();
  await db.close();
});

function submit(
  id_lesson: number,
  id_student: string,
  files: Array<{ id_practice_file: number; code: string }>,
) {
  return app.inject({
    method: "POST",
    url: "/api/practices/check",
    headers: { authorization: `Bearer ${id_student === studentId ? studentToken : otherStudentToken}` },
    payload: { id_lesson, id_student, files },
  });
}

test("practice submission lifecycle, file validation, CSS-only and concurrency", async () => {
  const first = await submit(lessonId, studentId, [
    { id_practice_file: indexHtmlId, code: "<h2>Привет</h2>" },
  ]);
  assert.equal(first.statusCode, 200, first.body);
  assert.deepEqual(first.json(), {
    passed: false,
    error: "Добавь <!doctype html>, html, head и body в исходный файл",
  });
  const save = await db.orm.public.Practice_saves.first({
    id_student: studentId,
    id_practice: practiceId,
  });
  assert.ok(save);
  assert.equal(
    (
      await db.orm.public.Save_files.first({
        id_practice_save: save.id,
        id_practice_file: indexHtmlId,
      })
    )?.code,
    "<h2>Привет</h2>",
  );
  assert.equal(
    await db.orm.public.Lesson_progress.first({ id_student: studentId, id_lesson: lessonId }),
    null,
  );

  await db.orm.public.Practices.where({ id: practiceId }).update({
    test_js:
      "if (!document.querySelector('h1')?.textContent?.includes('correct') || document.styleSheets.length < 3) throw new Error('wrong')",
  });
  const all = [
    { id_practice_file: indexHtmlId, code: "<h1>correct</h1>" },
    { id_practice_file: otherHtmlId, code: "<h1>other</h1>" },
    ...cssIds.map((id, index) => ({ id_practice_file: id, code: `.rule${index} { color: red; }` })),
  ];
  const passed = await submit(lessonId, studentId, all.reverse());
  assert.equal(passed.statusCode, 200, passed.body);
  assert.deepEqual(passed.json(), { passed: true });
  const completed = await db.orm.public.Lesson_progress.first({
    id_student: studentId,
    id_lesson: lessonId,
  });
  assert.ok(completed?.practice_completed_at);
  const timestamp = completed.practice_completed_at;
  const theoryTimestamp = new Date(0).toISOString();
  await db.orm.public.Lesson_progress.where({ id: completed.id }).update({
    theory_completed_at: theoryTimestamp,
  });

  const again = await submit(lessonId, studentId, [
    { id_practice_file: indexHtmlId, code: "<h1>correct again</h1>" },
  ]);
  assert.deepEqual(again.json(), { passed: true });
  assert.equal(
    (await db.orm.public.Lesson_progress.first({ id_student: studentId, id_lesson: lessonId }))
      ?.practice_completed_at,
    timestamp,
  );
  const theoryAfter = (
    await db.orm.public.Lesson_progress.first({ id_student: studentId, id_lesson: lessonId })
  )?.theory_completed_at;
  assert.equal(new Date(theoryAfter!).toISOString(), theoryTimestamp);
  const failed = await submit(lessonId, studentId, [
    { id_practice_file: indexHtmlId, code: "<h1>broken</h1>" },
  ]);
  assert.deepEqual(failed.json(), { passed: false, error: "wrong" });
  assert.equal(
    (await db.orm.public.Lesson_progress.first({ id_student: studentId, id_lesson: lessonId }))
      ?.practice_completed_at,
    timestamp,
  );
  assert.equal(
    (
      await db.orm.public.Save_files.first({
        id_practice_save: save.id,
        id_practice_file: indexHtmlId,
      })
    )?.code,
    "<h1>broken</h1>",
  );

  const foreign = await submit(lessonId, studentId, [
    { id_practice_file: foreignFileId, code: "x" },
  ]);
  assert.equal(foreign.statusCode, 400);
  assert.equal(
    await db.orm.public.Save_files.first({
      id_practice_save: save.id,
      id_practice_file: foreignFileId,
    }),
    null,
  );
  const duplicate = await submit(lessonId, studentId, [
    { id_practice_file: indexHtmlId, code: "a" },
    { id_practice_file: indexHtmlId, code: "b" },
  ]);
  assert.equal(duplicate.statusCode, 400);

  const cssFiles = await db.orm.public.Practice_files.where({ id_practice: cssPracticeId }).all();
  const cssOnly = await submit(
    cssLessonId,
    studentId,
    cssFiles.map((file) => ({ id_practice_file: file.id, code: file.code })),
  );
  assert.deepEqual(cssOnly.json(), { passed: true });

  await db.orm.public.Practices.where({ id: practiceId }).update({ test_js: "while(true){}" });
  const timeout = await submit(lessonId, studentId, [
    { id_practice_file: indexHtmlId, code: "<h1>timeout</h1>" },
  ]);
  assert.equal(timeout.statusCode, 503);
  assert.equal(
    (
      await db.orm.public.Save_files.first({
        id_practice_save: save.id,
        id_practice_file: indexHtmlId,
      })
    )?.code,
    "<h1>timeout</h1>",
  );

  await db.orm.public.Practices.where({ id: practiceId }).update({ test_js: "if (" });
  const syntax = await submit(lessonId, studentId, [
    { id_practice_file: indexHtmlId, code: "<h1>syntax</h1>" },
  ]);
  assert.equal(syntax.statusCode, 503);
  assert.equal(
    (
      await db.orm.public.Save_files.first({
        id_practice_save: save.id,
        id_practice_file: indexHtmlId,
      })
    )?.code,
    "<h1>syntax</h1>",
  );

  await db.orm.public.Practices.where({ id: practiceId }).update({
    test_js: "if (!document.querySelector('h1')) throw new Error('wrong')",
  });
  const concurrent = await Promise.all([
    submit(lessonId, otherStudentId, [{ id_practice_file: indexHtmlId, code: "<h1>one</h1>" }]),
    submit(lessonId, otherStudentId, [{ id_practice_file: indexHtmlId, code: "<h1>two</h1>" }]),
  ]);
  assert.deepEqual(
    concurrent.map((response) => response.statusCode),
    [200, 200],
    concurrent.map((response) => response.body).join("\n"),
  );
  assert.equal(
    (
      await db.orm.public.Practice_saves.where({
        id_student: otherStudentId,
        id_practice: practiceId,
      }).all()
    ).length,
    1,
  );
  assert.equal(
    (
      await db.orm.public.Lesson_progress.where({
        id_student: otherStudentId,
        id_lesson: lessonId,
      }).all()
    ).length,
    1,
  );
  const otherSave = await db.orm.public.Practice_saves.first({
    id_student: otherStudentId,
    id_practice: practiceId,
  });
  assert.ok(otherSave);
  assert.equal(
    (
      await db.orm.public.Save_files.where({
        id_practice_save: otherSave.id,
        id_practice_file: indexHtmlId,
      }).all()
    ).length,
    1,
  );
  const firstCompletion = (
    await db.orm.public.Lesson_progress.first({ id_student: otherStudentId, id_lesson: lessonId })
  )?.practice_completed_at;
  assert.ok(firstCompletion);
  const final = await submit(lessonId, otherStudentId, [
    { id_practice_file: indexHtmlId, code: "<h1>last</h1>" },
  ]);
  assert.deepEqual(final.json(), { passed: true });
  assert.equal(
    (await db.orm.public.Lesson_progress.first({ id_student: otherStudentId, id_lesson: lessonId }))
      ?.practice_completed_at,
    firstCompletion,
  );
});

test("document structure check reads source rather than browser-generated tags", async () => {
  const file = { id: 1, filename: "index.html", language: "html" as const };
  const fragment = await runPracticeCheck([{ ...file, code: "<h2>Привет</h2>" }], DOCUMENT_STRUCTURE_TEST_JS);
  assert.equal(fragment.status, "failed");
  const comment = await runPracticeCheck([{
    ...file,
    code: "<!doctype html><!-- <html><head></head><body></body> --><h2>Привет</h2>",
  }], DOCUMENT_STRUCTURE_TEST_JS);
  assert.equal(comment.status, "failed");
  const document = await runPracticeCheck([{
    ...file,
    code: "<!doctype html><html><head></head><body><h2>Привет</h2></body></html>",
  }], DOCUMENT_STRUCTURE_TEST_JS);
  assert.deepEqual(document, { status: "passed" });
});
