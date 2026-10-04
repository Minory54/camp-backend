import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./practices.repository.js";
import type { CreatePracticeData, UpdatePracticeData } from "./practices.schema.js";

export async function getPractices() {
  return repository.findAll();
}

export async function getPracticeById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createPractice(data: CreatePracticeData) {
  const normalized = {
    ...data,
    ...normalize(data),
    description: data.description ?? null,
  };
  return write(() => repository.create(normalized));
}

export async function updatePractice(id: number, data: UpdatePracticeData) {
  await getPracticeById(id);
  const normalized = normalize(data);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deletePractice(id: number) {
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

function normalize(data: UpdatePracticeData): UpdatePracticeData {
  const normalized = { ...data };
  if (data.title !== undefined) {
    if (!data.title.trim()) throw new ResponseError(400, "title не может быть пустым");
    normalized.title = data.title.trim();
  }
  if (data.mdx_source !== undefined) {
    if (!data.mdx_source.trim()) throw new ResponseError(400, "mdx_source не может быть пустым");
  }
  if (data.test_js !== undefined) {
    if (!data.test_js.trim()) throw new ResponseError(400, "test_js не может быть пустым");
  }
  return normalized;
}
