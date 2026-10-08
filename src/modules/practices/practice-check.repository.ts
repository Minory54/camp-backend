import { db } from "../../prisma/db.js";

export async function findLesson(id: number) {
  return db.orm.public.Lessons.first({ id });
}

export async function findPractice(id: number) {
  return db.orm.public.Practices.first({ id });
}

export async function findStudent(id: string) {
  return db.orm.public.Students.first({ id });
}

export async function findPracticeFiles(id_practice: number) {
  return db.orm.public.Practice_files.where({ id_practice })
    .orderBy((row) => row.id.asc())
    .include("code_language")
    .all();
}

export async function findPracticeFile(id: number) {
  return db.orm.public.Practice_files.first({ id });
}

export async function saveSubmission(
  id_student: string,
  id_practice: number,
  files: ReadonlyArray<{ id_practice_file: number; code: string }>,
) {
  return db.transaction(async (tx) => {
    // Explicit conflict targets are required for these composite unique keys.
    const savePlan = db.raw.sql`
      INSERT INTO practice_saves (id_student, id_practice, updated_at)
      VALUES (${id_student}::uuid, ${id_practice}, NOW())
      ON CONFLICT (id_student, id_practice)
      DO UPDATE SET updated_at = NOW()
      RETURNING id
    `
      .returnsRow({ id: "pg/int4@1" })
      .build();
    let saveId: number | undefined;
    for await (const row of tx.query(savePlan)) saveId = row.id;
    if (saveId === undefined) throw new Error("Practice save was not returned");
    for (const file of files) {
      const filePlan = db.raw.sql`
        INSERT INTO save_files (id_practice_save, id_practice_file, code)
        VALUES (${saveId}, ${file.id_practice_file}, ${file.code})
        ON CONFLICT (id_practice_save, id_practice_file)
        DO UPDATE SET code = EXCLUDED.code
      `
        .affectedCount()
        .build();
      await tx.execute(filePlan);
    }
    return saveId;
  });
}

export async function findSavedFiles(id_practice_save: number) {
  return db.orm.public.Save_files.where({ id_practice_save }).all();
}

export async function completePractice(id_student: string, id_lesson: number) {
  // One SQL statement handles both first creation and first completion. A later
  // success cannot overwrite the timestamp or any other completion column.
  const plan = db.raw.sql`
    INSERT INTO lesson_progress (id_student, id_lesson, practice_completed_at)
    VALUES (${id_student}::uuid, ${id_lesson}, NOW())
    ON CONFLICT (id_student, id_lesson)
    DO UPDATE SET practice_completed_at = EXCLUDED.practice_completed_at
    WHERE lesson_progress.practice_completed_at IS NULL
  `
    .affectedCount()
    .build();
  await db.runtime().execute(plan);
}
