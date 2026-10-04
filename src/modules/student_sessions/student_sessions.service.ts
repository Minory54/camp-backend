// student_sessions.service.ts

import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./student_sessions.repository.js";
import type {
  CreateStudentSessionData,
  UpdateStudentSessionData,
} from "./student_sessions.schema.js";
import { getStudentById } from "../students/students.service.js";

export async function getStudentSessions(studentId?: string) {
  return repository.findAll(studentId);
}

export async function getStudentSessionById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createStudentSession(data: CreateStudentSessionData) {
  const normalized = {
    ...data,
    ...normalize(data),
  };
  await validate(normalized);
  return write(() => repository.create(normalized));
}

export async function updateStudentSession(id: number, data: UpdateStudentSessionData) {
  const current = await getStudentSessionById(id);
  const normalized = normalize(data);
  await validate({ ...current, ...normalized }, id, current.created_at);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deleteStudentSession(id: number) {
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
        throw new ResponseError(409, "Запись с таким значением token_hash уже существует");
      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничение модели");
      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");
        throw new ResponseError(404, "Указанный студент не найден");
      }
    }
    throw error;
  }
}

function normalize(data: UpdateStudentSessionData): UpdateStudentSessionData {
  const normalized = { ...data };
  if (data.token_hash !== undefined) {
    if (!data.token_hash.trim()) throw new ResponseError(400, "token_hash не может быть пустым");
    normalized.token_hash = data.token_hash.trim();
  }
  if (data.expires_at !== undefined) {
    const timestamp = Date.parse(data.expires_at);
    if (!Number.isFinite(timestamp)) throw new ResponseError(400, "Некорректная дата expires_at");
    normalized.expires_at = new Date(timestamp).toISOString();
  }
  return normalized;
}

async function validate(data: CreateStudentSessionData, id?: number, createdAt?: string) {
  await getStudentById(data.id_student);
  const existing = await repository.findByTokenHash(data.token_hash);
  if (existing && existing.id !== id)
    throw new ResponseError(409, "Запись с таким значением token_hash уже существует");
  const expires = Date.parse(data.expires_at);
  const created = Date.parse(createdAt ?? new Date().toISOString());
  if (!Number.isFinite(expires) || expires <= created)
    throw new ResponseError(400, "Срок окончания сессии должен быть позже даты создания");
}
