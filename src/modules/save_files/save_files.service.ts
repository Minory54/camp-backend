// save_files.service.ts

import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./save_files.repository.js";
import type {
  CreateSaveFileData,
  UpdateSaveFileData,
  SaveFilesQuery,
} from "./save_files.schema.js";

export async function getSaveFiles(filters: SaveFilesQuery = {}) {
  return repository.findAll(filters);
}

export async function getSaveFileById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createSaveFile(data: CreateSaveFileData) {
  const normalized = { ...data, ...normalize(data) };
  await validate(normalized);
  return write(() => repository.create(normalized));
}

export async function updateSaveFile(id: number, data: UpdateSaveFileData) {
  const current = await getSaveFileById(id);
  const normalized = normalize(data);
  await validate({ ...current, ...normalized }, id);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deleteSaveFile(id: number) {
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
        throw new ResponseError(
          409,
          "Запись с такими значениями id_practice_save и id_practice_file уже существует",
        );
      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничение модели");
      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");
        const constraint =
          "constraint" in error && typeof error.constraint === "string" ? error.constraint : "";
        if (constraint.includes("id_practice_save"))
          throw new ResponseError(404, "Указанное сохранение практики не найдено");
        if (constraint.includes("id_practice_file"))
          throw new ResponseError(404, "Указанный файл практики не найден");
        throw new ResponseError(409, "Операция нарушает связь между записями");
      }
    }

    throw error;
  }
}

function normalize(data: UpdateSaveFileData): UpdateSaveFileData {
  return { ...data };
}

async function validate(data: CreateSaveFileData, id?: number) {
  const practiceSaveExists = await repository.idPracticeSaveExists(data.id_practice_save);
  if (!practiceSaveExists) throw new ResponseError(404, "Указанное сохранение практики не найдено");
  const practiceFileExists = await repository.idPracticeFileExists(data.id_practice_file);
  if (!practiceFileExists) throw new ResponseError(404, "Указанный файл практики не найден");
  const existing = await repository.findByUnique(data.id_practice_save, data.id_practice_file);
  if (existing && existing.id !== id)
    throw new ResponseError(
      409,
      "Запись с такими значениями id_practice_save и id_practice_file уже существует",
    );
}
