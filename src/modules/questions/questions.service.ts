// questions.service.ts

import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./questions.repository.js";
import type { CreateQuestionData, UpdateQuestionData } from "./questions.schema.js";

export async function getQuestions(testId?: number) {
  return repository.findAll(testId);
}

export async function getQuestionById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createQuestion(data: CreateQuestionData) {
  const normalized = {
    ...data,
    ...normalize(data),
    description: data.description ?? null,
    type: data.type ?? "single",
    code_block: data.code_block ?? null,
    id_code_language: data.id_code_language ?? null,
  };
  await validate(normalized);
  return write(() => repository.create(normalized));
}

export async function updateQuestion(id: number, data: UpdateQuestionData) {
  const current = await getQuestionById(id);
  const normalized = normalize(data);
  await validate({ ...current, ...normalized }, id);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deleteQuestion(id: number) {
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
      if (error.sqlState === "23505")
        throw new ResponseError(409, "Позиция уже занята в этом тесте");
      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничение модели");
      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");
        const constraint =
          "constraint" in error && typeof error.constraint === "string" ? error.constraint : "";
        if (constraint.includes("id_code_language"))
          throw new ResponseError(404, "Указанный язык программирования не найден");
        throw new ResponseError(404, "Указанный тест не найден");
      }
    }
    throw error;
  }
}

function normalize(data: UpdateQuestionData): UpdateQuestionData {
  const normalized = { ...data };
  if (data.title !== undefined) {
    if (!data.title.trim()) throw new ResponseError(400, "title не может быть пустым");
    normalized.title = data.title.trim();
  }
  return normalized;
}

async function validate(data: CreateQuestionData, id?: number) {
  if (!Number.isInteger(data.position) || data.position < 1)
    throw new ResponseError(400, "position должно быть целым числом от 1");
  const testExists = await repository.parentExists(data.id_test);
  if (!testExists) throw new ResponseError(404, "Указанный тест не найден");
  if (
    data.id_code_language != null &&
    !(await repository.codeLanguageExists(data.id_code_language))
  )
    throw new ResponseError(404, "Указанный язык программирования не найден");
  const existing = await repository.findByParentAndPosition(data.id_test, data.position);
  if (existing && existing.id !== id)
    throw new ResponseError(409, "Позиция уже занята в этом тесте");
}
