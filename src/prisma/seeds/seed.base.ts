import { db } from "../db.js";

const technologies = [
  { title: "HTML" },
  { title: "CSS" },
  { title: "VS Code" },
];

const groups = [
  { position: 1, title: "group 1", id_course: 1 },
  { position: 2, title: "group 2", id_course: 1 },
  { position: 3, title: "group 3", id_course: 1 },
];

const courses = [{ title: "HTML/CSS" }];

const code_languages = [{ title: "html" }, { title: "css" }];

export async function seedBase() {
  console.log("Создание базовых данных...");

  // Технологии
  for (const technology of technologies) {
    await db.orm.public.Technologies.create({
      title: technology.title,
    });
  }
  console.log("Технологии созданы");

  // Курсы
  for (const course of courses) {
    await db.orm.public.Courses.create({
      title: course.title,
    });
  }

  console.log("Курсы созданы");

  // Группировки
  for (const group of groups) {
    await db.orm.public.Groups.create({
      position: group.position,
      title: group.title,
      id_course: group.id_course,
    });
  }

  console.log("Группы созданы");

  // Языки
  for (const code_language of code_languages) {
    await db.orm.public.Code_languages.create({
      title: code_language.title,
    });
  }

  console.log("Языки созданы");
}

try {
  await seedBase();
} catch (error) {
  console.error("Ошибка при создании базовых данных:");
  console.error(error);

  process.exitCode = 1;
} finally {
  await db.runtime().close();
}
