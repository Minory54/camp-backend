// theories.service.ts

import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./theories.repository.js";
import type { CreateTheoryData, UpdateTheoryData } from "./theories.schema.js";

export async function getTheories(technologyId?: number) {
  return repository.findAll(technologyId);
}

export async function getTheoryById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createTheory(data: CreateTheoryData) {
  const normalized = {
    ...data,
    ...normalize(data),
    description: data.description ?? null,
  };

  await validate(normalized);

  return write(() => repository.create(normalized));
}

export async function updateTheory(id: number, data: UpdateTheoryData) {
  const current = await getTheoryById(id);
  const normalized = normalize(data);

  await validate({ ...current, ...normalized }, id);

  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");

  return updated;
}

export async function deleteTheory(id: number) {
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
        throw new ResponseError(409, "Позиция уже занята в данной технологии");

      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничение модели");

      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");

        throw new ResponseError(404, "Указанная технология не найдена");
      }
    }

    throw error;
  }
}

function normalize(data: UpdateTheoryData): UpdateTheoryData {
  const normalized = { ...data };

  if (data.title !== undefined) {
    if (!data.title.trim()) throw new ResponseError(400, "title не может быть пустым");

    normalized.title = data.title.trim();
  }

  if (data.mdx_source !== undefined) {
    if (!data.mdx_source.trim()) throw new ResponseError(400, "mdx_source не может быть пустым");
  }

  return normalized;
}

async function validate(data: CreateTheoryData, id?: number) {
  const technologyExists = await repository.findTechnologyById(data.id_technology);

  if (!technologyExists) throw new ResponseError(404, "Указанная технология не найдена");

  const existing = await repository.findByTechnologyAndPosition(data.id_technology, data.position);

  if (existing && existing.id !== id)
    throw new ResponseError(409, "Позиция уже занята в данной технологии");
}
