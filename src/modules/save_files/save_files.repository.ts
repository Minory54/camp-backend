import { db } from "../../prisma/db.js";
import type {
  CreateSaveFileData,
  UpdateSaveFileData,
  SaveFilesQuery,
} from "./save_files.schema.js";

export async function findAll(filters: SaveFilesQuery = {}, studentId?: string) {
  let query = db.orm.public.Save_files;
  if (studentId !== undefined)
    query = query.where((file) => file.practice_save.some((save) => save.id_student.eq(studentId)));
  if (filters.practiceSaveId !== undefined)
    query = query.where({ id_practice_save: filters.practiceSaveId });
  if (filters.practiceFileId !== undefined)
    query = query.where({ id_practice_file: filters.practiceFileId });
  return query
    .orderBy((row) => row.id.asc())
    .include("practice_file")
    .include("practice_save")
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Save_files.where({ id })
    .include("practice_file")
    .include("practice_save")
    .first();
}

export async function findByUnique(
  id_practice_save: number,
  id_practice_file: number,
) {
  return db.orm.public.Save_files.first({ id_practice_save, id_practice_file });
}

export async function idPracticeSaveExists(id: number) {
  return (await db.orm.public.Practice_saves.first({ id })) !== null;
}

export async function idPracticeFileExists(id: number) {
  return (await db.orm.public.Practice_files.first({ id })) !== null;
}

export async function create(data: CreateSaveFileData) {
  return db.orm.public.Save_files.create(data);
}

export async function update(id: number, data: UpdateSaveFileData) {
  return db.orm.public.Save_files.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Save_files.where({ id }).delete();
}
