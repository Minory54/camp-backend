import { db } from "../../prisma/db.js";
import type {
  CreatePracticeSaveData,
  UpdatePracticeSaveData,
  PracticeSavesQuery,
} from "./practice_saves.schema.js";

export async function findAll(filters: PracticeSavesQuery = {}) {
  let query = db.orm.public.Practice_saves;
  if (filters.studentId !== undefined)
    query = query.where({ id_student: filters.studentId });
  if (filters.practiceId !== undefined)
    query = query.where({ id_practice: filters.practiceId });
  return query
    .orderBy((row) => row.id.asc())
    .include("student", (student) => student.select("id", "display_code", "label", "created_at", "updated_at"))
    .include("practice", (practice) => practice.select("id", "title", "description", "mdx_source"))
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Practice_saves.where({ id })
    .include("student", (student) => student.select("id", "display_code", "label", "created_at", "updated_at"))
    .include("practice", (practice) => practice.select("id", "title", "description", "mdx_source"))
    .first();
}

export async function findByUnique(id_student: string, id_practice: number) {
  return db.orm.public.Practice_saves.first({ id_student, id_practice });
}

export async function idStudentExists(id: string) {
  return (await db.orm.public.Students.first({ id })) !== null;
}

export async function idPracticeExists(id: number) {
  return (await db.orm.public.Practices.first({ id })) !== null;
}

export async function create(data: CreatePracticeSaveData) {
  return db.orm.public.Practice_saves.create(data);
}

export async function update(id: number, data: UpdatePracticeSaveData) {
  return db.orm.public.Practice_saves.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Practice_saves.where({ id }).delete();
}
