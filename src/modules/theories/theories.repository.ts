import { db } from "../../prisma/db.js";
import type { CreateTheoryData, UpdateTheoryData } from "./theories.schema.js";

export async function findAll(technologyId?: number) {
  if (technologyId !== undefined) {
    return db.orm.public.Theories.where({
      id_technology: technologyId,
    })
      .orderBy((theory) => theory.position.asc())
      .include("technology")
      .all();
  }

  return db.orm.public.Theories.orderBy([
    (theory) => theory.id_technology.asc(),
    (theory) => theory.position.asc(),
  ])
    .include("technology")
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Theories.where({ id })
    .include("technology")
    .include("Lessons")
    .first();
}

export async function findByTechnologyAndPosition(
  technologyId: number,
  position: number,
) {
  return db.orm.public.Theories.first({
    id_technology: technologyId,
    position,
  });
}

export async function findTechnologyById(technologyId: number) {
  const technology = await db.orm.public.Technologies.first({
    id: technologyId,
  });

  return technology !== null;
}

export async function create(data: CreateTheoryData) {
  return db.orm.public.Theories.create(data);
}

export async function update(id: number, data: UpdateTheoryData) {
  return db.orm.public.Theories.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Theories.where({ id }).delete();
}
