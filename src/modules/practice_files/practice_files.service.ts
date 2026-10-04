import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./practice_files.repository.js";
import type {
  CreatePracticeFileData,
  UpdatePracticeFileData,
  PracticeFilesQuery,
} from "./practice_files.schema.js";

export async function getPracticeFiles(filters: PracticeFilesQuery = {}) {
  return repository.findAll(filters);
}

export async function getPracticeFileById(id: number) {
  const row = await repository.findById(id);
  if (row === null) throw new ResponseError(404, "Запись не найдена");
  return row;
}

function normalize(data: UpdatePracticeFileData): UpdatePracticeFileData {
  const normalized = { ...data };
  if (data.filename !== undefined) {
    if (!data.filename.trim()) throw new ResponseError(400, "filename не может быть пустым");
    normalized.filename = data.filename.trim();
  }
  return normalized;
}

async function validate(data: CreatePracticeFileData, id?: number) {
  if (data.id_practice != null && !(await repository.idPracticeExists(data.id_practice))) {
    throw new ResponseError(404, "Запись не найдена");
  }
  if (
    data.id_code_language != null &&
    !(await repository.idCodeLanguageExists(data.id_code_language))
  ) {
    throw new ResponseError(404, "Запись не найдена");
  }
  const existing = await repository.findByUnique(data.id_practice, data.filename);
  if (existing && existing.id !== id)
    throw new ResponseError(409, 
      "Запись с такими значениями уже существует: id_practice, filename",
    );
}

export async function createPracticeFile(data: CreatePracticeFileData) {
  const normalized = { ...data, ...normalize(data) };
  await validate(normalized);
  return write(() => repository.create(normalized));
}

export async function updatePracticeFile(id: number, data: UpdatePracticeFileData) {
  const current = await getPracticeFileById(id);
  const normalized = normalize(data);
  await validate({ ...current, ...normalized }, id);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deletePracticeFile(id: number) {
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
          "Запись с такими значениями уже существует: id_practice, filename",
        );
      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничения модели");
      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");
        const constraint =
          "constraint" in error && typeof error.constraint === "string" ? error.constraint : "";
        if (constraint.includes("id_practice"))
          throw new ResponseError(404, "Практика: связанная запись не найдена");
        if (constraint.includes("id_code_language"))
          throw new ResponseError(404, "Язык программирования: связанная запись не найдена");
        throw new ResponseError(404, "Связанная запись не найдена");
      }
    }
    throw error;
  }
}
