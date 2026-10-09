import { db } from "../../prisma/db.js";
import type { UpdateStudentData } from "./students.schema.js";

export async function findAll() {
  return db.orm.public.Students.orderBy((student) => student.created_at.desc())
    .include("Lesson_progress")
    .include("Practice_saves")
    .all();
}

export async function findById(id: string) {
  return db.orm.public.Students.where({ id })
    .select("id", "display_code", "label", "created_at", "updated_at")
    .include("Lesson_progress")
    .include("Practice_saves")
    .first();
}

export async function findByDisplayCode(value: string) {
  return db.orm.public.Students.where({ display_code: value }).select("id").first();
}

export async function findByRecoveryCode(value: string) {
  return db.orm.public.Students.where({ recovery_code: value }).select("id").first();
}

export async function findByAccessTokenHash(value: string) {
  return db.orm.public.Students.where({ access_token: value }).select("id").first();
}

export async function findRecoveryCodes() {
  return db.orm.public.Students.select("recovery_code").all();
}

export async function create(data: {
  display_code: string;
  recovery_code: string;
  access_token: string;
}) {
  return db.orm.public.Students.create(data);
}

export async function update(id: string, data: UpdateStudentData | { access_token: string }) {
  return db.orm.public.Students.where({ id }).update(data);
}

export async function remove(id: string) {
  return db.orm.public.Students.where({ id }).delete();
}
