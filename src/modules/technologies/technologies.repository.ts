import { db } from "../../prisma/db.js";
import type {
  CreateTechnologyData,
  UpdateTechnologyData,
} from "./technologies.schema.js";

export async function findAll() {
  let query = db.orm.public.Technologies;
  return query
    .orderBy((row) => row.id.asc())
    .include("Theories", (theories) => theories.select("id", "title", "position"))
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Technologies.where({ id }).include("Theories").first();
}

export async function findByUnique(title: string) {
  return db.orm.public.Technologies.first({ title });
}

export async function create(data: CreateTechnologyData) {
  return db.orm.public.Technologies.create(data);
}

export async function update(id: number, data: UpdateTechnologyData) {
  return db.orm.public.Technologies.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Technologies.where({ id }).delete();
}
