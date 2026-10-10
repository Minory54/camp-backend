// tests.service.ts

import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./tests.repository.js";
import type { CheckAnswerData, CreateTestData, UpdateTestData } from "./tests.schema.js";

export async function getTests() {
  return repository.findAll();
}

export async function getTestById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function checkAnswer(data: CheckAnswerData) {
  if (!(await repository.studentExists(data.id_student)))
    throw new ResponseError(404, "Указанный студент не найден");

  const question = await repository.findQuestionForAnswer(data.id_question);
  if (question === null) throw new ResponseError(404, "Вопрос не найден");
  if (question.test === null) throw new ResponseError(404, "Тест для вопроса не найден");

  const optionIds = new Set(question.Question_options.map((option) => option.id));
  const selectedIds = new Set(data.selected_option_ids);
  if ([...selectedIds].some((id) => !optionIds.has(id)))
    throw new ResponseError(400, "Выбранный вариант не принадлежит вопросу или не существует");

  const correctIds = new Set(
    question.Question_options.filter((option) => option.is_correct).map((option) => option.id),
  );
  if (correctIds.size === 0)
    throw new ResponseError(409, "У вопроса нет правильных вариантов ответа");

  const isCorrect =
    selectedIds.size === correctIds.size && [...selectedIds].every((id) => correctIds.has(id));
  const lessons = await repository.findLessonsByTest(question.id_test);
  if (lessons.length === 0) throw new ResponseError(404, "Урок для теста не найден");
  if (lessons.length > 1) throw new ResponseError(409, "Тест привязан к нескольким урокам");

  const lesson = lessons[0]!;
  const completed = await repository.recordAnswer(
    data.id_student,
    question.id,
    question.id_test,
    lesson.id,
    isCorrect,
  );
  if (!isCorrect) throw new ResponseError(400, "Упс, не верно");
  return { is_correct: true, is_test_completed: completed };
}

export async function getTestAnswers(testId: number, studentId: string) {
  await getTestById(testId);
  return repository.findAnswers(testId, studentId);
}

export async function createTest(data: CreateTestData) {
  const normalized = { ...data, ...normalize(data), description: data.description ?? null };
  return write(() => repository.create(normalized));
}

export async function updateTest(id: number, data: UpdateTestData) {
  await getTestById(id);
  const normalized = normalize(data);

  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");

  return updated;
}

export async function deleteTest(id: number) {
  const deleted = await write(() => repository.remove(id), true);
  if (deleted === null) throw new ResponseError(404, "Запись не найдена");
  return deleted;
}

// SQLSTATE позволяет обработать также конфликт параллельных запросов.
async function write<T>(operation: () => Promise<T>, deleting = false): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (typeof error === "object" && error !== null && "sqlState" in error) {
      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничение модели");

      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");

        throw new ResponseError(409, "Операция нарушает связь между записями");
      }
    }

    throw error;
  }
}

function normalize(data: UpdateTestData): UpdateTestData {
  const normalized = { ...data };

  if (data.title !== undefined) {
    if (!data.title.trim()) throw new ResponseError(400, "title не может быть пустым");

    normalized.title = data.title.trim();
  }

  return normalized;
}
