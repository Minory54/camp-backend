// students.service.ts

import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./students.repository.js";
import type { CreateStudentData, UpdateStudentData } from "./students.schema.js";

export async function getStudents() {
  return repository.findAll();
}

export async function getStudentById(id: string) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createStudent(data: CreateStudentData) {
  const normalized = {
    ...data,
    ...normalize(data),
    label: data.label?.trim() ?? null,
  };
  await validate(normalized);
  return write(() => repository.create(normalized));
}

export async function updateStudent(id: string, data: UpdateStudentData) {
  const current = await getStudentById(id);
  const normalized = normalize(data);
  await validate({ ...current, ...normalized }, id);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deleteStudent(id: string) {
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
        throw new ResponseError(409, "Запись с таким значением уже существует");
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

function normalize(data: UpdateStudentData): UpdateStudentData {
  const normalized = { ...data };
  if (data.display_code !== undefined) {
    if (!data.display_code.trim())
      throw new ResponseError(400, "display_code не может быть пустым");
    normalized.display_code = data.display_code.trim();
  }
  if (data.recovery_code !== undefined) {
    if (!data.recovery_code.trim())
      throw new ResponseError(400, "recovery_code не может быть пустым");
    normalized.recovery_code = data.recovery_code.trim();
  }
  if (data.label !== undefined) normalized.label = data.label?.trim() ?? null;
  return normalized;
}

async function validate(data: CreateStudentData, id?: string) {
  const existingDisplayCode = await repository.findByDisplayCode(data.display_code);
  if (existingDisplayCode && existingDisplayCode.id !== id)
    throw new ResponseError(409, "Запись с таким значением display_code уже существует");
  const existingRecoveryCode = await repository.findByRecoveryCode(data.recovery_code);
  if (existingRecoveryCode && existingRecoveryCode.id !== id)
    throw new ResponseError(409, "Запись с таким значением recovery_code уже существует");
}
