import { db } from "../../prisma/db.js";
import type {
  CreatePracticeFileData,
  UpdatePracticeFileData,
  PracticeFilesQuery,
} from "./practice_files.schema.js";

export async function findAll(filters: PracticeFilesQuery = {}) {
  let query = db.orm.public.Practice_files;
  if (filters.practiceId !== undefined)
    query = query.where({ id_practice: filters.practiceId });
  if (filters.codeLanguageId !== undefined)
    query = query.where({ id_code_language: filters.codeLanguageId });
  return query
    .orderBy((row) => row.id.asc())
    .include("practice")
    .include("code_language")
    .include("Save_files")
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Practice_files.where({ id })
    .include("practice")
    .include("code_language")
    .include("Save_files")
    .first();
}

export async function findByUnique(id_practice: number, filename: string) {
  return db.orm.public.Practice_files.first({ id_practice, filename });
}

export async function idPracticeExists(id: number) {
  return (await db.orm.public.Practices.first({ id })) !== null;
}

export async function idCodeLanguageExists(id: number) {
  return (await db.orm.public.Code_languages.first({ id })) !== null;
}

export async function create(data: CreatePracticeFileData) {
  return db.orm.public.Practice_files.create(data);
}

export async function update(id: number, data: UpdatePracticeFileData) {
  return db.orm.public.Practice_files.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Practice_files.where({ id }).delete();
}
