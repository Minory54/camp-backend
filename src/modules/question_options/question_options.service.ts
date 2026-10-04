import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./question_options.repository.js";
import type {
  CreateQuestionOptionData,
  UpdateQuestionOptionData,
} from "./question_options.schema.js";

export async function getQuestionOptions(questionId?: number) {
  return repository.findAll(questionId);
}

export async function getQuestionOptionById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createQuestionOption(data: CreateQuestionOptionData) {
  const normalized = {
    ...data,
    ...normalize(data),
    is_correct: data.is_correct ?? false,
  };
  await validate(normalized);
  return write(() => repository.create(normalized));
}

export async function updateQuestionOption(id: number, data: UpdateQuestionOptionData) {
  const current = await getQuestionOptionById(id);
  const normalized = normalize(data);
  await validate({ ...current, ...normalized }, id);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deleteQuestionOption(id: number) {
  const deleted = await write(() => repository.remove(id), true);
  if (deleted === null) throw new ResponseError(404, "Запись не найдена");
  return deleted;
}

// SQLSTATE позволяет обработать также конфликт параллельных запросов.
async function write<T>(operation: () => Promise<T>, deleting = false): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (typeof error === "object" && error !== null && "sqlState" in error) {
      if (error.sqlState === "23505")
        throw new ResponseError(409, "Позиция уже занята в этом вопросе");
      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничение модели");
      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");
        throw new ResponseError(404, "Указанный вопрос не найден");
      }
    }
    throw error;
  }
}

function normalize(data: UpdateQuestionOptionData): UpdateQuestionOptionData {
  const normalized = { ...data };
  if (data.title !== undefined) {
    if (!data.title.trim()) throw new ResponseError(400, "title не может быть пустым");
    normalized.title = data.title.trim();
  }
  return normalized;
}

async function validate(data: CreateQuestionOptionData, id?: number) {
  if (!Number.isInteger(data.position) || data.position < 1)
    throw new ResponseError(400, "position должно быть целым числом от 1");
  const questionExists = await repository.parentExists(data.id_question);
  if (!questionExists) throw new ResponseError(404, "Указанный вопрос не найден");
  const existing = await repository.findByParentAndPosition(data.id_question, data.position);
  if (existing && existing.id !== id)
    throw new ResponseError(409, "Позиция уже занята в этом вопросе");
}
