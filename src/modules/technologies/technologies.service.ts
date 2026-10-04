// technologies.service.ts

import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./technologies.repository.js";
import type { CreateTechnologyData, UpdateTechnologyData } from "./technologies.schema.js";

export async function getTechnologies() {
  return repository.findAll();
}

export async function getTechnologyById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createTechnology(data: CreateTechnologyData) {
  const normalized = { ...data, ...normalize(data) };
  await validate(normalized);
  return write(() => repository.create(normalized));
}

export async function updateTechnology(id: number, data: UpdateTechnologyData) {
  const current = await getTechnologyById(id);
  const normalized = normalize(data);
  await validate({ ...current, ...normalized }, id);

  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");

  return updated;
}

export async function deleteTechnology(id: number) {
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
        throw new ResponseError(409, "Запись с таким значением title уже существует");

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

function normalize(data: UpdateTechnologyData): UpdateTechnologyData {
  const normalized = { ...data };

  if (data.title !== undefined) {
    if (!data.title.trim()) throw new ResponseError(400, "title не может быть пустым");

    normalized.title = data.title.trim();
  }

  return normalized;
}

async function validate(data: CreateTechnologyData, id?: number) {
  const existing = await repository.findByUnique(data.title);

  if (existing && existing.id !== id)
    throw new ResponseError(409, "Запись с таким значением title уже существует");
}
