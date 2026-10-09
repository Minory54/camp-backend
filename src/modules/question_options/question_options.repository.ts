import { db } from "../../prisma/db.js";
import type {
  CreateQuestionOptionData,
  UpdateQuestionOptionData,
} from "./question_options.schema.js";

export async function findAll(parentId?: number) {
  const collection = db.orm.public.Question_options.select(
    "id",
    "id_question",
    "position",
    "title",
  );
  if (parentId !== undefined) {
    return collection
      .where({ id_question: parentId })
      .orderBy((row) => row.position.asc())
      .include("question")
      .all();
  }
  return collection
    .orderBy([(row) => row.id_question.asc(), (row) => row.position.asc()])
    .include("question")
    .all();
}

export async function findById(id: number) {
  return db.orm.public.Question_options.where({ id })
    .select("id", "id_question", "position", "title")
    .include("question")
    .first();
}

export async function findByParentAndPosition(parentId: number, position: number) {
  return db.orm.public.Question_options.first({
    id_question: parentId,
    position,
  });
}

export async function parentExists(id: number) {
  return (await db.orm.public.Test_questions.first({ id })) !== null;
}

export async function create(data: CreateQuestionOptionData) {
  return db.orm.public.Question_options.create(data);
}

export async function update(id: number, data: UpdateQuestionOptionData) {
  return db.orm.public.Question_options.where({ id }).update(data);
}

export async function remove(id: number) {
  return db.orm.public.Question_options.where({ id }).delete();
}
