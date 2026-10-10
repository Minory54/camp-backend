import { db } from "../../prisma/db.js";
import type { CreateLessonData, UpdateLessonData, LessonsQuery } from "./lessons.schema.js";

export async function findAll(filters: LessonsQuery = {}) {
  let query = db.orm.public.Lessons;
  if (filters.groupId !== undefined) query = query.where({ id_group: filters.groupId });
  return query
    .orderBy([(row) => row.id_group.asc(), (row) => row.position.asc()])
    .include("group")
    .include("theory")
    .include("test")
    .include("practice", (practice) => practice.select("id", "title", "description", "mdx_source"))
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Lessons.where({ id })
    .include("group")
    .include("theory")
    .include("test")
    .include("practice", (practice) => practice.select("id", "title", "description", "mdx_source"))
    .first();
}

export async function findByUnique(id_group: number, position: number) {
  return db.orm.public.Lessons.first({ id_group, position });
}

export async function idGroupExists(id: number) {
  return (await db.orm.public.Groups.first({ id })) !== null;
}

export async function idTheoryExists(id: number) {
  return (await db.orm.public.Theories.first({ id })) !== null;
}

export async function idPracticeExists(id: number) {
  return (await db.orm.public.Practices.first({ id })) !== null;
}

export async function idTestExists(id: number) {
  return (await db.orm.public.Tests.first({ id })) !== null;
}

export async function create(data: CreateLessonData) {
  return db.orm.public.Lessons.create(data);
}

export async function update(id: number, data: UpdateLessonData) {
  return db.orm.public.Lessons.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Lessons.where({ id }).delete();
}
