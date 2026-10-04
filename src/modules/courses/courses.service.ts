import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./courses.repository.js";
import type { CreateCourseData, UpdateCourseData } from "./courses.schema.js";

export async function getCourses() {
  return repository.findAll();
}

export async function getCourseById(id: number) {
  const row = await repository.findById(id);
  if (row === null) throw new ResponseError(404, "Запись не найдена");
  return row;
}

export async function getCourseProgress(courseId: number, studentId: string) {
  const progress = await repository.findProgress(courseId, studentId);
  if (progress === null) throw new ResponseError(404, "Курс не найден");
  return progress;
}

export async function createCourse(data: CreateCourseData) {
  const normalized = { ...data, ...normalize(data) };
  normalized.description = normalized.description ?? null;
  await validate(normalized);
  return write(() => repository.create(normalized));
}

export async function updateCourse(id: number, data: UpdateCourseData) {
  const current = await getCourseById(id);
  const normalized = normalize(data);
  await validate({ ...current, ...normalized }, id);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deleteCourse(id: number) {
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
        throw new ResponseError(409, "Запись с такими значениями уже существует: title");
      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничения модели");
      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");
        throw new ResponseError(409, "Операция нарушает связь между записями");
      }
    }
    throw error;
  }
}

function normalize(data: UpdateCourseData): UpdateCourseData {
  const normalized = { ...data };

  if (data.title !== undefined) {
    if (!data.title.trim()) throw new ResponseError(400, "title не может быть пустым");
    normalized.title = data.title.trim();
  }
  return normalized;
}

async function validate(data: CreateCourseData, id?: number) {
  const existing = await repository.findByUnique(data.title);
  if (existing && existing.id !== id)
    throw new ResponseError(409, "Запись с таким значением title уже существует");
}
