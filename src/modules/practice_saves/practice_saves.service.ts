import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./practice_saves.repository.js";
import type {
  CreatePracticeSaveData,
  UpdatePracticeSaveData,
  PracticeSavesQuery,
} from "./practice_saves.schema.js";

export async function getPracticeSaves(filters: PracticeSavesQuery = {}) {
  return repository.findAll(filters);
}

export async function getPracticeSaveById(id: number) {
  const row = await repository.findById(id);
  if (row === null) throw new ResponseError(404, "Запись не найдена");
  return row;
}

export async function createPracticeSave(data: CreatePracticeSaveData) {
  const normalized = { ...data, ...normalize(data) };
  await validate(normalized);
  return write(() => repository.create(normalized));
}

export async function updatePracticeSave(id: number, data: UpdatePracticeSaveData) {
  const current = await getPracticeSaveById(id);
  const normalized = normalize(data);
  await validate({ ...current, ...normalized }, id);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deletePracticeSave(id: number) {
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
          "Запись с такими значениями уже существует: id_student, id_practice",
        );
      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничения модели");
      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");
        const constraint =
          "constraint" in error && typeof error.constraint === "string" ? error.constraint : "";
        if (constraint.includes("id_student"))
          throw new ResponseError(404, "Студент: связанная запись не найдена");
        if (constraint.includes("id_practice"))
          throw new ResponseError(404, "Практика: связанная запись не найдена");
        throw new ResponseError(404, "Связанная запись не найдена");
      }
    }
    throw error;
  }
}

function normalize(data: UpdatePracticeSaveData): UpdatePracticeSaveData {
  const normalized = { ...data };
  return normalized;
}

async function validate(data: CreatePracticeSaveData, id?: number) {
  if (data.id_student != null && !(await repository.idStudentExists(data.id_student))) {
    throw new ResponseError(404, "Студент: связанная запись не найдена");
  }
  if (data.id_practice != null && !(await repository.idPracticeExists(data.id_practice))) {
    throw new ResponseError(404, "Практика: связанная запись не найдена");
  }
  const existing = await repository.findByUnique(data.id_student, data.id_practice);
  if (existing && existing.id !== id)
    throw new ResponseError(
      409,
      "Запись с такими значениями уже существует: id_student, id_practice",
    );
}
