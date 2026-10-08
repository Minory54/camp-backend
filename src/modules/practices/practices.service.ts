import { ResponseError } from "../../common/errors/response.error.js";
import * as repository from "./practices.repository.js";
import type {
  CheckPracticeData,
  CreatePracticeData,
  UpdatePracticeData,
} from "./practices.schema.js";
import * as checkRepository from "./practice-check.repository.js";
import { runPracticeCheck, type CheckFile } from "./practice-check.runner.js";

export async function checkPractice(data: CheckPracticeData) {
  const lesson = await checkRepository.findLesson(data.id_lesson);
  if (!lesson) throw new ResponseError(404, "Урок не найден");
  if (lesson.id_practice === null)
    throw new ResponseError(400, "У урока нет практического задания");
  const practice = await checkRepository.findPractice(lesson.id_practice);
  if (!practice) throw new ResponseError(404, "Практика не найдена");
  if (!(await checkRepository.findStudent(data.id_student)))
    throw new ResponseError(404, "Студент не найден");

  const practiceFiles = await checkRepository.findPracticeFiles(practice.id);
  const byId = new Map(practiceFiles.map((file) => [file.id, file]));
  const seen = new Set<number>();
  for (const file of data.files) {
    if (seen.has(file.id_practice_file)) throw new ResponseError(400, "Файл передан несколько раз");
    seen.add(file.id_practice_file);
    const source = byId.get(file.id_practice_file);
    if (!source) {
      if (!(await checkRepository.findPracticeFile(file.id_practice_file)))
        throw new ResponseError(404, "Файл практики не найден");
      throw new ResponseError(400, "Файл не принадлежит практике этого урока");
    }
    if (source.code_language.title !== "html" && source.code_language.title !== "css")
      throw new ResponseError(400, "Для тренажёра разрешены только HTML и CSS файлы");
  }
  const totalBytes = data.files.reduce((size, file) => size + Buffer.byteLength(file.code), 0);
  if (totalBytes > 1_000_000)
    throw new ResponseError(400, "Суммарный размер файлов превышает 1 МБ");

  // Commit the last editor state before running an untrusted browser check.
  const saveId = await checkRepository.saveSubmission(data.id_student, practice.id, data.files);
  const saved = await checkRepository.findSavedFiles(saveId);
  const savedById = new Map(saved.map((file) => [file.id_practice_file, file.code]));
  for (const file of data.files) savedById.set(file.id_practice_file, file.code);
  const files: CheckFile[] = practiceFiles
    .filter((file) => file.code_language.title === "html" || file.code_language.title === "css")
    .map((file) => ({
      id: file.id,
      filename: file.filename,
      language: file.code_language.title as "html" | "css",
      code: savedById.get(file.id) ?? file.code,
    }));
  if (!practice.test_js.trim()) throw new ResponseError(500, "Проверка задания не настроена");
  const result = await runPracticeCheck(files, practice.test_js);
  if (result.status === "system_error") throw new ResponseError(503, result.error);
  if (result.status === "failed") return { passed: false, error: result.error };
  await checkRepository.completePractice(data.id_student, lesson.id);
  return { passed: true };
}

export async function getPractices() {
  return repository.findAll();
}

export async function getPracticeById(id: number) {
  const result = await repository.findById(id);
  if (result === null) throw new ResponseError(404, "Запись не найдена");
  return result;
}

export async function createPractice(data: CreatePracticeData) {
  const normalized = {
    ...data,
    ...normalize(data),
    description: data.description ?? null,
  };
  return write(() => repository.create(normalized));
}

export async function updatePractice(id: number, data: UpdatePracticeData) {
  await getPracticeById(id);
  const normalized = normalize(data);
  const updated = await write(() => repository.update(id, normalized));
  if (updated === null) throw new ResponseError(404, "Запись не найдена");
  return updated;
}

export async function deletePractice(id: number) {
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
      if (error.sqlState === "23514")
        throw new ResponseError(400, "Данные нарушают ограничение модели");
      if (error.sqlState === "23503") {
        if (deleting)
          throw new ResponseError(409, "Нельзя удалить запись, на которую ссылаются другие данные");
        throw new ResponseError(409, "Операция нарушает связь между записями");
      }
    }
    throw error;
  }
}

function normalize(data: UpdatePracticeData): UpdatePracticeData {
  const normalized = { ...data };
  if (data.title !== undefined) {
    if (!data.title.trim()) throw new ResponseError(400, "title не может быть пустым");
    normalized.title = data.title.trim();
  }
  if (data.mdx_source !== undefined) {
    if (!data.mdx_source.trim()) throw new ResponseError(400, "mdx_source не может быть пустым");
  }
  if (data.test_js !== undefined) {
    if (!data.test_js.trim()) throw new ResponseError(400, "test_js не может быть пустым");
  }
  return normalized;
}
