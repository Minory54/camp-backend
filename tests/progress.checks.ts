import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !/(?:_test|camp_check)$/.test(new URL(testUrl).pathname.slice(1))) {
  throw new Error("Set TEST_DATABASE_URL to a separate *_test or camp_check database");
}
// Select the test database before loading dotenv, config or the application.
process.env.DATABASE_URL = testUrl;
const { db } = await import("../src/prisma/db.js");
const { buildApp } = await import("../src/app.js");
const { hashAccessToken } = await import("../src/modules/students/students.service.js");

test("Прогресс: ответы, открытие теории и доступность roadmap", async (t) => {
  const app = await buildApp();
  app.log.level = "silent";
  await db.connect();
  const suffix = randomUUID();
  const students: Array<{ id: string; token: string }> = [];
  const groupIds: number[] = [];
  const lessonIds: number[] = [];
  let courseId: number | undefined;
  let technologyId: number | undefined;
  let theoryId: number | undefined;
  let testId: number | undefined;
  let lockedTestId: number | undefined;
  let practiceId: number | undefined;
  try {
    const course = await db.orm.public.Courses.create({ title: `progress-${suffix}` });
    courseId = course.id;
    const technology = await db.orm.public.Technologies.create({ title: suffix });
    technologyId = technology.id;
    const theory = await db.orm.public.Theories.create({
      title: "Теория", id_technology: technology.id, position: 1, mdx_source: "# Теория",
    });
    theoryId = theory.id;
    const exam = await db.orm.public.Tests.create({ title: "Тест" });
    testId = exam.id;
    const lockedExam = await db.orm.public.Tests.create({ title: "Закрытый тест" });
    lockedTestId = lockedExam.id;
    const practice = await db.orm.public.Practices.create({ title: "Практика", mdx_source: "# Практика", test_js: "() => true" });
    practiceId = practice.id;
    const groups = [];
    for (const [index, state] of (["open", "hidden", "locked"] as const).entries()) {
      const group = await db.orm.public.Groups.create({ title: state, id_course: course.id, position: index + 1, state });
      groups.push(group);
      groupIds.push(group.id);
    }
    const first = await db.orm.public.Lessons.create({ title: "Первый", id_group: groups[0]!.id, position: 1, id_theory: theory.id, id_test: exam.id });
    const hidden = await db.orm.public.Lessons.create({ title: "Скрытый", id_group: groups[0]!.id, position: 2, id_theory: theory.id, is_hidden: true });
    const next = await db.orm.public.Lessons.create({ title: "Следующий", id_group: groups[0]!.id, position: 3, id_theory: theory.id });
    const hiddenGroupLesson = await db.orm.public.Lessons.create({ title: "В скрытой группе", id_group: groups[1]!.id, position: 1, id_theory: theory.id });
    const locked = await db.orm.public.Lessons.create({ title: "Закрытый", id_group: groups[2]!.id, position: 1, id_theory: theory.id, id_test: lockedExam.id, id_practice: practice.id });
    lessonIds.push(first.id, hidden.id, next.id, hiddenGroupLesson.id, locked.id);
    const questions: Array<{ id: number; correct: number; correctIds: number[]; wrong: number }> = [];
    for (let index = 0; index < 3; index++) {
      const question = await db.orm.public.Test_questions.create({ title: `Вопрос ${index + 1}`, id_test: exam.id, position: index + 1, type: index === 1 ? "multiple" : "single" });
      const correct = await db.orm.public.Question_options.create({ title: "Верно", id_question: question.id, position: 1, is_correct: true });
      const wrong = await db.orm.public.Question_options.create({ title: "Неверно", id_question: question.id, position: 2, is_correct: false });
      const correctIds = [correct.id];
      if (index === 1) {
        const secondCorrect = await db.orm.public.Question_options.create({ title: "Тоже верно", id_question: question.id, position: 3, is_correct: true });
        correctIds.push(secondCorrect.id);
      }
      questions.push({ ...question, correct: correct.id, correctIds, wrong: wrong.id });
    }
    const lockedQuestion = await db.orm.public.Test_questions.create({ title: "Закрытый вопрос", id_test: lockedExam.id, position: 1 });
    const lockedOption = await db.orm.public.Question_options.create({ title: "Верно", id_question: lockedQuestion.id, position: 1, is_correct: true });
    const occupiedCodes = new Set((await db.orm.public.Students.select("recovery_code").all()).map((row) => row.recovery_code));
    const availableCodes = Array.from({ length: 10_000 }, (_, n) => `SDC${String(n).padStart(4, "0")}`).filter((code) => !occupiedCodes.has(code));
    for (let index = 0; index < 2; index++) {
      const token = randomBytes(32).toString("base64url");
      const student = await db.orm.public.Students.create({ display_code: `${suffix}-${index}`, recovery_code: availableCodes[index]!, access_token: hashAccessToken(token) });
      students.push({ id: student.id, token });
    }
    const main = students[0]!;
    const auth = (student = main) => ({ authorization: `Bearer ${student.token}` });
    const progress = (student = main) => db.orm.public.Lesson_progress.first({ id_student: student.id, id_lesson: first.id });
    const open = (lessonId = first.id, student = main) => app.inject({ method: "POST", url: `/api/lessons/${lessonId}/theory/open`, headers: auth(student), payload: {} });
    const answer = (index: number, correct = true, student = main) => app.inject({ method: "POST", url: "/api/tests/answer", headers: auth(student), payload: { id_student: student.id, id_question: questions[index]!.id, selected_option_ids: correct ? questions[index]!.correctIds : [questions[index]!.wrong] } });

    await t.test("База знаний не отмечает теорию; roadmap ставит серверное время один раз", async () => {
      assert.equal((await app.inject({ url: `/api/theories/${theory.id}` })).statusCode, 200);
      assert.equal(await progress(), null);
      const forged = await app.inject({ method: "POST", url: "/api/lesson-progress", headers: auth(), payload: { id_student: main.id, id_lesson: first.id, theory_completed_at: "2000-01-01T00:00:00Z" } });
      assert.equal(forged.statusCode, 400);
      const opened = await open();
      assert.equal(opened.statusCode, 200, opened.body);
      const timestamp = opened.json().theory_completed_at;
      assert.ok(Math.abs(Date.parse(timestamp) - Date.now()) < 10_000);
      assert.equal((await open()).json().theory_completed_at, timestamp);
      assert.equal((await progress())?.test_completed_at, null);
      assert.equal((await progress())?.practice_completed_at, null);
      assert.equal(await db.orm.public.Lesson_progress.first({ id_student: main.id, id_lesson: next.id }), null);
    });

    await t.test("Последнего ответа недостаточно; ошибки не ограничивают попытки", async () => {
      assert.equal((await answer(2)).json().is_test_completed, false);
      for (let attempt = 0; attempt < 4; attempt++) {
        const response = await answer(0, false);
        assert.equal(response.statusCode, 400);
        assert.equal(response.json().message, "Упс, не верно");
      }
      const rows = await db.orm.public.Test_answers.where({ id_student: main.id, id_question: questions[0]!.id }).all();
      assert.equal(rows.length, 1);
      assert.equal(rows[0]!.is_correct, false);
      assert.equal((await progress())?.test_completed_at, null);
      assert.equal((await answer(0)).json().is_test_completed, false);
      const partial = await app.inject({ method: "POST", url: "/api/tests/answer", headers: auth(), payload: { id_student: main.id, id_question: questions[1]!.id, selected_option_ids: [questions[1]!.correct] } });
      assert.equal(partial.statusCode, 400);
      assert.equal((await progress())?.test_completed_at, null);
      const final = await answer(1);
      assert.equal(final.statusCode, 200, final.body);
      assert.equal(final.json().is_test_completed, true);
      assert.ok((await progress())?.test_completed_at);
    });

    await t.test("Изменение вопроса и неверный повторный ответ не сбрасывают результат", async () => {
      const before = (await progress())!.test_completed_at;
      await db.orm.public.Question_options.where({ id: questions[0]!.correct }).update({ is_correct: false });
      await db.orm.public.Question_options.where({ id: questions[0]!.wrong }).update({ is_correct: true });
      assert.equal((await answer(0)).statusCode, 400);
      assert.equal((await progress())!.test_completed_at, before);
      assert.equal((await db.orm.public.Test_answers.first({ id_student: main.id, id_question: questions[0]!.id }))!.is_correct, true);
      assert.equal((await open()).json().test_completed_at, before);
      const results = await app.inject({ url: `/api/tests/${exam.id}/answers`, headers: auth() });
      assert.equal(results.statusCode, 200);
      assert.ok(results.json().every((row: { is_correct: boolean }) => row.is_correct));
      await db.orm.public.Question_options.where({ id: questions[0]!.correct }).update({ is_correct: true });
      await db.orm.public.Question_options.where({ id: questions[0]!.wrong }).update({ is_correct: false });
    });

    await t.test("Параллельные ответы не теряют завершение теста", async () => {
      const other = students[1]!;
      const responses = await Promise.all([open(first.id, other), answer(0, true, other), answer(1, true, other), answer(2, true, other)]);
      assert.ok(responses.every((response) => response.statusCode === 200), responses.map((r) => r.body).join("\n"));
      assert.ok(responses.some((response) => response.json().is_test_completed));
      assert.ok((await progress(other))?.test_completed_at);
      assert.ok((await progress(other))?.theory_completed_at);
    });

    await t.test("Скрытые уроки не блокируют roadmap; закрытые операции отклоняются", async () => {
      const road = await app.inject({ url: `/api/courses/${course.id}/progress`, headers: auth() });
      assert.equal(road.statusCode, 200, road.body);
      const lessons = road.json().lessons;
      assert.ok(!lessons.some((row: { lessonId: number }) => [hidden.id, hiddenGroupLesson.id].includes(row.lessonId)));
      assert.equal(lessons.find((row: { lessonId: number }) => row.lessonId === next.id).isAvailable, true);
      const courseResponse = await app.inject({ url: `/api/courses/${course.id}` });
      assert.equal(courseResponse.json().Groups.length, 2);
      assert.equal(courseResponse.json().Groups[0].Lessons.length, 2);
      assert.equal((await open(hidden.id)).statusCode, 403);
      assert.equal((await open(locked.id)).statusCode, 403);
      const lockedAnswer = await app.inject({ method: "POST", url: "/api/tests/answer", headers: auth(), payload: { id_student: main.id, id_question: lockedQuestion.id, selected_option_ids: [lockedOption.id] } });
      assert.equal(lockedAnswer.statusCode, 403);
      const lockedPractice = await app.inject({ method: "POST", url: "/api/practices/check", headers: auth(), payload: { id_student: main.id, id_lesson: locked.id, files: [{ id_practice_file: 1, code: "x" }] } });
      assert.equal(lockedPractice.statusCode, 403);
      assert.equal((await open(next.id)).statusCode, 200);
    });

    await t.test("Лишние поля и чужой ученик отклоняются", async () => {
      const payload = { id_student: main.id, id_question: questions[0]!.id, selected_option_ids: [questions[0]!.correct] };
      assert.equal((await app.inject({ method: "POST", url: "/api/tests/answer", headers: auth(), payload: { ...payload, is_correct: true } })).statusCode, 400);
      assert.equal((await app.inject({ method: "POST", url: "/api/tests/answer", headers: auth(), payload: { ...payload, id_student: students[1]!.id } })).statusCode, 403);
      assert.equal((await app.inject({ url: `/api/tests/${exam.id}/answers` })).statusCode, 401);
    });
  } finally {
    for (const student of students) await db.orm.public.Students.where({ id: student.id }).delete();
    for (const id of lessonIds) await db.orm.public.Lessons.where({ id }).delete();
    if (testId) await db.orm.public.Tests.where({ id: testId }).delete();
    if (lockedTestId) await db.orm.public.Tests.where({ id: lockedTestId }).delete();
    if (practiceId) await db.orm.public.Practices.where({ id: practiceId }).delete();
    if (theoryId) await db.orm.public.Theories.where({ id: theoryId }).delete();
    for (const id of groupIds) await db.orm.public.Groups.where({ id }).delete();
    if (courseId) await db.orm.public.Courses.where({ id: courseId }).delete();
    if (technologyId) await db.orm.public.Technologies.where({ id: technologyId }).delete();
    await app.close();
    await db.close();
  }
});
