import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./lesson_progress.repository.js";
import type { CreateLessonProgressData, LessonProgressQuery } from "./lesson_progress.schema.js";

export async function getLessonProgress(filters: LessonProgressQuery = {}) {
  return repository.findAll(filters);
}

export async function getLessonProgressById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createLessonProgress(data: CreateLessonProgressData) {
  const normalized = {
    ...data,
    ...normalize(data),

    theory_completed_at: data.theory_completed_at ?? null,
  };

  await validate(normalized);
  return write(() => repository.create(normalized));
}

// export async function updateLessonProgress(id: number, data: UpdateLessonProgressData) {
//   const current = await getLessonProgressById(id);
//   const normalized = normalize(data);
//   await validate({ ...current, ...normalized }, id);
//   const updated = await write(() => repository.update(id, normalized));
//   if (updated === null) throw new ResponseError(404, "Запись не найдена");
//   return updated;
// }

export async function deleteLessonProgress(id: number) {
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
          "Запись с такими значениями id_student и id_lesson уже существует",
        );

      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничение модели");

      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");

        const constraint =
          "constraint" in error && typeof error.constraint === "string" ? error.constraint : "";
        if (constraint.includes("id_student"))
          throw new ResponseError(404, "Указанный студент не найден");
        if (constraint.includes("id_lesson"))
          throw new ResponseError(404, "Указанный урок не найден");
        throw new ResponseError(409, "Операция нарушает связь между записями");
      }
    }
    throw error;
  }
}

function normalize(data: CreateLessonProgressData): CreateLessonProgressData {
  const normalized = { ...data };
  if (data.theory_completed_at != null)
    normalized.theory_completed_at = normalizeDate(data.theory_completed_at, "theory_completed_at");
  return normalized;
}

function normalizeDate(value: string, field: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new ResponseError(400, `Некорректная дата ${field}`);
  return new Date(timestamp).toISOString();
}

async function validate(data: CreateLessonProgressData, id?: number) {
  if (data.id_student != null && !(await repository.idStudentExists(data.id_student)))
    throw new ResponseError(404, "Указанный студент не найден");

  if (data.id_lesson != null && !(await repository.idLessonExists(data.id_lesson)))
    throw new ResponseError(404, "Указанный урок не найден");

  const existing = await repository.findByUnique(data.id_student, data.id_lesson);

  if (existing && existing.id !== id)
    throw new ResponseError(
      409,
      "Запись с такими значениями id_student и id_lesson уже существует",
    );
}
