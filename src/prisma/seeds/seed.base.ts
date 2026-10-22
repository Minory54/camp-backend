import { db } from "../db.js";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const technologies = [
  { title: "HTML" },
  { title: "CSS" },
  { title: "VS Code" },
];

const groups = [
  { position: 1, title: "Основы HTML и CSS" },
  { position: 2, title: "Углубленные темы верстки" },
  { position: 3, title: "Начало работы в VS Code" },
];

const courses = [{ title: "HTML/CSS" }];

const code_languages = [{ title: "html" }, { title: "css" }];

export async function seedBase() {
  await db.transaction(async (tx) => {
    console.log("Создание базовых данных...");

    for (const technologySeed of technologies) {
      const existing = await tx.orm.public.Technologies.first({ title: technologySeed.title });
      if (!existing) await tx.orm.public.Technologies.create(technologySeed);
    }
    console.log("Технологии созданы");

    const courseIds = new Map<string, number>();
    for (const courseSeed of courses) {
      const existing = await tx.orm.public.Courses.first({ title: courseSeed.title });
      const course = existing ?? await tx.orm.public.Courses.create(courseSeed);
      courseIds.set(courseSeed.title, course.id);
    }
    console.log("Курсы созданы");

    for (const groupSeed of groups) {
      const courseId = courseIds.get(courses[0]!.title);
      if (courseId === undefined) throw new Error("Не найден курс для групп seed");
      const groupData = {
        position: groupSeed.position,
        title: groupSeed.title,
        id_course: courseId,
      };
      const existing = await tx.orm.public.Groups.first({
        id_course: courseId,
        position: groupSeed.position,
      });
      if (existing) {
        await tx.orm.public.Groups.where({ id: existing.id }).update(groupData);
      } else {
        await tx.orm.public.Groups.create(groupData);
      }
    }
    console.log("Группы созданы");

    for (const languageSeed of code_languages) {
      const existing = await tx.orm.public.Code_languages.first({ title: languageSeed.title });
      if (!existing) await tx.orm.public.Code_languages.create(languageSeed);
    }
    console.log("Языки созданы");
  });
}

const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  try {
    await seedBase();
  } catch (error) {
    console.error("Ошибка при создании базовых данных:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}
