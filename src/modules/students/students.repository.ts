import { db } from "../../prisma/db.js";
import type {
  CreateStudentData,
  UpdateStudentData,
} from "./students.schema.js";

export async function findAll() {
  return db.orm.public.Students.orderBy((student) => student.created_at.desc())
    .include("Student_sessions")
    .include("Lesson_progress")
    .include("Practice_saves")
    .all();
}

export async function findById(id: string) {
  return db.orm.public.Students.where({ id })
    .include("Student_sessions")
    .include("Lesson_progress")
    .include("Practice_saves")
    .first();
}

export async function findByDisplayCode(value: string) {
  return db.orm.public.Students.first({ display_code: value });
}

export async function findByRecoveryCode(value: string) {
  return db.orm.public.Students.first({ recovery_code: value });
}

export async function create(data: CreateStudentData) {
  return db.orm.public.Students.create(data);
}

export async function update(id: string, data: UpdateStudentData) {
  return db.orm.public.Students.where({ id }).update(data);
}

export async function remove(id: string) {
  return db.orm.public.Students.where({ id }).delete();
}
