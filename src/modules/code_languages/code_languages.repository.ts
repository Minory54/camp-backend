import { db } from "../../prisma/db.js";
import type {
  CreateCodeLanguageData,
  UpdateCodeLanguageData,
} from "./code_languages.schema.js";

// НАЙТИ ВСЁ
export async function findAll() {
  let query = db.orm.public.Code_languages;
  return query
    .orderBy((row) => row.id.asc())
    .all();
}

// НАЙТИ ПО ID
export async function findById(id: number) {
  return db.orm.public.Code_languages.where({ id })
    .first();
}

// НАЙТИ ПО УНИКАЛЬНОМУ TITLE
export async function findByUnique(title: string) {
  return db.orm.public.Code_languages.first({ title });
}

// СОЗДАТЬ
export async function create(data: CreateCodeLanguageData) {
  return db.orm.public.Code_languages.create(data);
}

// ОБНОВИТЬ
export async function update(id: number, data: UpdateCodeLanguageData) {
  return db.orm.public.Code_languages.where({ id }).update(data);
}

// УДАЛИТЬ
export async function remove(id: number) {
  return db.orm.public.Code_languages.where({ id }).delete();
}
