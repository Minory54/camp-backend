import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./lessons.repository.js";
import type { CreateLessonData, UpdateLessonData, LessonsQuery } from "./lessons.schema.js";

export async function getLessons(filters: LessonsQuery = {}) {
  return repository.findAll(filters);
}

export async function getLessonById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createLesson(data: CreateLessonData) {
  const normalized = { ...data, ...normalize(data) };
  normalized.is_hidden = normalized.is_hidden ?? false;
  normalized.id_theory = normalized.id_theory ?? null;
  normalized.id_practice = normalized.id_practice ?? null;
  normalized.id_test = normalized.id_test ?? null;
  await validate(normalized);
  return write(() => repository.create(normalized));
}

export async function updateLesson(id: number, data: UpdateLessonData) {
  const current = await getLessonById(id);
  const normalized = normalize(data);
  await validate({ ...current, ...normalized }, id);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deleteLesson(id: number) {
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
          "Запись с такими значениями уже существует: id_group, position",
        );
      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничения модели");
      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");
        const constraint =
          "constraint" in error && typeof error.constraint === "string" ? error.constraint : "";
        if (constraint.includes("id_group"))
          throw new ResponseError(404, "Группа: связанная запись не найдена");
        if (constraint.includes("id_theory"))
          throw new ResponseError(404, "Теория: связанная запись не найдена");
        if (constraint.includes("id_practice"))
          throw new ResponseError(404, "Практика: связанная запись не найдена");
        if (constraint.includes("id_test"))
          throw new ResponseError(404, "Тест: связанная запись не найдена");
        throw new ResponseError(404, "Связанная запись не найдена");
      }
    }
    throw error;
  }
}

function normalize(data: UpdateLessonData): UpdateLessonData {
  const normalized = { ...data };
  if (data.title !== undefined) {
    if (!data.title.trim()) throw new ResponseError(400, "title не может быть пустым");
    normalized.title = data.title.trim();
  }
  return normalized;
}

async function validate(data: CreateLessonData, id?: number) {
  if (data.id_theory == null && data.id_practice == null && data.id_test == null)
    throw new ResponseError(
      400,
      "Урок должен содержать хотя бы один материал: теорию, практику или тест",
    );
  if (!Number.isInteger(data.position) || data.position < 1)
    throw new ResponseError(400, "Позиция должна быть целым числом от 1");
  if (data.id_group != null && !(await repository.idGroupExists(data.id_group)))
    throw new ResponseError(404, "Группа: связанная запись не найдена");
  if (data.id_theory != null && !(await repository.idTheoryExists(data.id_theory)))
    throw new ResponseError(404, "Теория: связанная запись не найдена");
  if (data.id_practice != null && !(await repository.idPracticeExists(data.id_practice)))
    throw new ResponseError(404, "Практика: связанная запись не найдена");
  if (data.id_test != null && !(await repository.idTestExists(data.id_test)))
    throw new ResponseError(404, "Тест: связанная запись не найдена");

  const existing = await repository.findByUnique(data.id_group, data.position);
  if (existing && existing.id !== id)
    throw new ResponseError(409, "Запись с такими значениями уже существует: id_group, position");
}
