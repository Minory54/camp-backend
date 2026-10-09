import crypto from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./students.repository.js";
import type { CreateStudentData, UpdateStudentData } from "./students.schema.js";

declare module "fastify" {
  interface FastifyRequest {
    studentId: string;
  }
}

export function hashAccessToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requireStudent(request: FastifyRequest, reply: FastifyReply) {
  reply.header("Cache-Control", "private, no-store");
  const authorization = request.headers.authorization;
  const token = authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/i)?.[1];
  if (!token) throw new ResponseError(401, "Требуется действующий access_token");
  const student = await repository.findByAccessTokenHash(hashAccessToken(token));
  if (!student) throw new ResponseError(401, "Доступ недействителен. Восстановите доступ");
  request.studentId = student.id;
}

export function assertStudentOwner(request: FastifyRequest, studentId: string) {
  if (studentId.toLowerCase() !== request.studentId)
    throw new ResponseError(403, "Нет доступа к аккаунту другого студента");
}

export async function getStudentById(id: string) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createStudent(data: CreateStudentData) {
  const display_code = data.display_code.trim();
  if (!display_code || display_code.length > 255)
    throw new ResponseError(400, "display_code должен содержать от 1 до 255 символов");
  if (await repository.findByDisplayCode(display_code))
    throw new ResponseError(409, "display_code уже занят. Восстановите доступ");

  const occupied = new Set((await repository.findRecoveryCodes()).map((row) => row.recovery_code));
  const available = Array.from(
    { length: 10_000 },
    (_, number) => `SDC${String(number).padStart(4, "0")}`,
  ).filter((code) => !occupied.has(code));
  if (!available.length) throw new ResponseError(409, "Все recovery_code заняты");

  // UNIQUE защищает от одновременной регистрации с одинаковым кодом.
  for (let attempt = 0; attempt < 32 && available.length; attempt++) {
    const index = crypto.randomInt(available.length);
    const recovery_code = available.splice(index, 1)[0]!;
    const access_token = crypto.randomBytes(32).toString("base64url");
    try {
      const created = await repository.create({
        display_code,
        recovery_code,
        access_token: hashAccessToken(access_token),
      });
      return {
        student: await getStudentById(created.id),
        recovery_code,
        access_token,
      };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      if (await repository.findByDisplayCode(display_code))
        throw new ResponseError(409, "display_code уже занят. Восстановите доступ");
      if (await repository.findByRecoveryCode(recovery_code)) continue;
      if (await repository.findByAccessTokenHash(hashAccessToken(access_token))) {
        available.push(recovery_code);
        continue;
      }
      throw error;
    }
  }
  if (!available.length) throw new ResponseError(409, "Все recovery_code заняты");
  throw new ResponseError(503, "Не удалось выдать код. Попробуйте ещё раз");
}

export async function recoverStudent(recovery_code: string) {
  if (!/^SDC[0-9]{4}$/.test(recovery_code))
    throw new ResponseError(400, "Введите recovery_code в формате SDC1234");
  const current = await repository.findByRecoveryCode(recovery_code);
  if (!current) throw new ResponseError(401, "Неверный recovery_code");
  for (let attempt = 0; attempt < 3; attempt++) {
    const access_token = crypto.randomBytes(32).toString("base64url");
    try {
      const updated = await repository.update(current.id, {
        access_token: hashAccessToken(access_token),
      });
      if (updated === null) throw new ResponseError(401, "Неверный recovery_code");
      return { student: await getStudentById(current.id), access_token };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new ResponseError(503, "Не удалось выдать токен. Попробуйте ещё раз");
}

export async function updateStudent(id: string, data: UpdateStudentData) {
  await getStudentById(id);
  const normalized: UpdateStudentData = {};
  if (data.display_code !== undefined) {
    const display_code = data.display_code.trim();
    if (!display_code) throw new ResponseError(400, "display_code не может быть пустым");
    const existing = await repository.findByDisplayCode(display_code);
    if (existing && existing.id !== id) throw new ResponseError(409, "display_code уже занят");
    normalized.display_code = display_code;
  }
  if (data.label !== undefined) normalized.label = data.label?.trim() ?? null;
  try {
    const updated = await repository.update(id, normalized);
    if (updated === null) throw new ResponseError(404, "Запись не найдена");
  } catch (error) {
    if (isUniqueViolation(error)) throw new ResponseError(409, "display_code уже занят");
    throw error;
  }
  return getStudentById(id);
}

export async function deleteStudent(id: string) {
  const deleted = await repository.remove(id);
  if (deleted === null) throw new ResponseError(404, "Запись не найдена");
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" && error !== null && "sqlState" in error && error.sqlState === "23505"
  );
}

export function findAll():
  | void
  | {
      Lesson_progress?: any[] | undefined;
      Practice_saves?: any[] | undefined;
      display_code: string;
      label: string | null;
      id: string;
      created_at: string;
      updated_at: string;
    }[]
  | PromiseLike<
      | void
      | {
          Lesson_progress?: any[] | undefined;
          Practice_saves?: any[] | undefined;
          display_code: string;
          label: string | null;
          id: string;
          created_at: string;
          updated_at: string;
        }[]
    > {
  throw new Error("Function not implemented.");
}
export function getAll():
  | void
  | {
      Lesson_progress?: any[] | undefined;
      Practice_saves?: any[] | undefined;
      display_code: string;
      label: string | null;
      id: string;
      created_at: string;
      updated_at: string;
    }[]
  | PromiseLike<
      | void
      | {
          Lesson_progress?: any[] | undefined;
          Practice_saves?: any[] | undefined;
          display_code: string;
          label: string | null;
          id: string;
          created_at: string;
          updated_at: string;
        }[]
    > {
  throw new Error("Function not implemented.");
}
