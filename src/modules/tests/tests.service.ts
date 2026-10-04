// tests.service.ts

import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./tests.repository.js";
import type { CreateTestData, UpdateTestData } from "./tests.schema.js";

export async function getTests() {
  return repository.findAll();
}

export async function getTestById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createTest(data: CreateTestData) {
  const normalized = {
    ...data,
    ...normalize(data),
    description: data.description ?? null,
  };

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
