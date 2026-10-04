import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./groups.repository.js";
import type { CreateGroupData, UpdateGroupData } from "./groups.schema.js";

export async function getGroups(courseId?: number) {
  return repository.findAll(courseId);
}

export async function getGroupById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createGroup(data: CreateGroupData) {
  const normalized = { ...data, ...normalize(data), state: data.state ?? "open" };
  await validate(normalized);
  return write(() => repository.create(normalized));
}

export async function updateGroup(id: number, data: UpdateGroupData) {
  const current = await getGroupById(id);
  const normalized = normalize(data);
  await validate({ ...current, ...normalized }, id);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deleteGroup(id: number) {
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
        throw new ResponseError(409, "Группа с такой позицией уже существует в этом курсе");
      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничение модели");
      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить группу, на которую ссылаются другие данные");
        throw new ResponseError(409, "Указанный курс не существует");
      }
    }
    throw error;
  }
}

function normalize(data: UpdateGroupData): UpdateGroupData {
  const normalized = { ...data };

  if (data.title !== undefined) {
    if (!data.title.trim()) throw new ResponseError(400, "title не может быть пустым");
    normalized.title = data.title.trim();
  }
  return normalized;
}

async function validate(data: CreateGroupData, id?: number) {
  const course = await repository.findCourseById(data.id_course);
  if (course === null) throw new ResponseError(404, "Указанный курс не найден");

  const existing = await repository.findByCourseAndOrder(data.id_course, data.position);
  if (existing && existing.id !== id)
    throw new ResponseError(409, "Группа с такой позицией уже существует в этом курсе");
}
