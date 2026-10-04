import { db } from "../../prisma/db.js";
import type {
  CreateStudentSessionData,
  UpdateStudentSessionData,
} from "./student_sessions.schema.js";

export async function findAll(studentId?: string) {
  const sessions = db.orm.public.Student_sessions;
  const query =
    studentId === undefined
      ? sessions
      : sessions.where({ id_student: studentId });
  return query
    .orderBy((session) => session.created_at.desc())
    .include("student")
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Student_sessions.where({ id })
    .include("student")
    .first();
}

export async function findByTokenHash(value: string) {
  return db.orm.public.Student_sessions.first({ token_hash: value });
}

export async function create(data: CreateStudentSessionData) {
  return db.orm.public.Student_sessions.create(data);
}

export async function update(id: number, data: UpdateStudentSessionData) {
  return db.orm.public.Student_sessions.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Student_sessions.where({ id }).delete();
}
