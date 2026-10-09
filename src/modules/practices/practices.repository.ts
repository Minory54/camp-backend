import { db } from "../../prisma/db.js";
import type { CreatePracticeData, UpdatePracticeData } from "./practices.schema.js";

export async function findAll() {
  let query = db.orm.public.Practices;
  return query
    .orderBy((row) => row.id.asc())
    .include("Lessons")
    .include("Practice_files")
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Practices.where({ id })
    .include("Practice_files", (Practice_files) => Practice_files.include("code_language"))
    .first();
}

export async function create(data: CreatePracticeData) {
  return db.orm.public.Practices.create(data);
}

export async function update(id: number, data: UpdatePracticeData) {
  return db.orm.public.Practices.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Practices.where({ id }).delete();
}
