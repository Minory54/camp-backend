import { createHash } from "node:crypto";
import { db } from "../db.js";

const students = [
  {
    display_code: "demo-alisa",
    recovery_code: "restore-alisa-2026",
    label: "Алиса",
  },
  {
    display_code: "demo-boris",
    recovery_code: "restore-boris-2026",
    label: "Борис",
  },
  {
    display_code: "demo-vera",
    recovery_code: "restore-vera-2026",
    label: "Вера",
  },
  {
    display_code: "demo-gleb",
    recovery_code: "restore-gleb-2026",
    label: "Глеб",
  },
  {
    display_code: "demo-dasha",
    recovery_code: "restore-dasha-2026",
    label: "Даша",
  },
];

const theories = [
  {
    title: "Структура HTML-документа",
    description: "Теги html, head и body.",
    technology: "HTML",
    position: 1,
    mdx_source:
      "# Структура HTML-документа\n\nСтраница начинается с `<!doctype html>`. Внутри `<html>` находятся `<head>` и `<body>`.\n",
  },
  {
    title: "Заголовки и абзацы",
    description: "Как оформить текст на странице.",
    technology: "HTML",
    position: 2,
    mdx_source:
      "# Заголовки и абзацы\n\nИспользуй `<h1>` для главного заголовка, а `<p>` для абзаца.\n",
  },
  {
    title: "Ссылки и изображения",
    description: "Атрибуты href, src и alt.",
    technology: "HTML",
    position: 3,
    mdx_source:
      '# Ссылки и изображения\n\nСсылка задаётся тегом `<a href="...">`, изображение — тегом `<img src="..." alt="...">`.\n',
  },
  {
    title: "CSS-селекторы",
    description: "Выбор элементов по тегу и классу.",
    technology: "CSS",
    position: 1,
    mdx_source:
      "# CSS-селекторы\n\nСелектор `p` выбирает абзацы, а `.card` — элементы с классом `card`.\n",
  },
  {
    title: "Цвет и фон",
    description: "Свойства color и background-color.",
    technology: "CSS",
    position: 2,
    mdx_source:
      "# Цвет и фон\n\nСвойство `color` меняет цвет текста, а `background-color` — цвет фона.\n",
  },
];

const practices = [
  {
    title: "Собери страницу",
    description: "Создай каркас HTML-документа.",
    mdx_source:
      "# Собери страницу\n\nДобавь `<!doctype html>`, `<html>`, `<head>` и `<body>`.\n",
    test_js:
      "if (!document.querySelector('html head') || !document.querySelector('html body')) throw new Error('Добавь head и body');",
    filename: "index.html",
    language: "html",
    code: '<!doctype html>\n<html lang="ru">\n  <head><title>Моя страница</title></head>\n  <body></body>\n</html>\n',
    saved_code:
      '<!doctype html>\n<html lang="ru">\n  <head><title>Моя страница</title></head>\n  <body><h1>Привет!</h1></body>\n</html>\n',
  },
  {
    title: "Напиши текст",
    description: "Добавь заголовок и абзац.",
    mdx_source:
      "# Напиши текст\n\nРазмести на странице один `<h1>` и один `<p>`.\n",
    test_js:
      "if (!document.querySelector('h1') || !document.querySelector('p')) throw new Error('Нужны h1 и p');",
    filename: "text.html",
    language: "html",
    code: "<main>\n</main>\n",
    saved_code:
      "<main>\n  <h1>Обо мне</h1>\n  <p>Я учусь создавать сайты.</p>\n</main>\n",
  },
  {
    title: "Добавь ссылку и картинку",
    description: "Сделай ссылку и изображение с описанием.",
    mdx_source:
      "# Ссылка и картинка\n\nДобавь `<a>` с адресом и `<img>` с текстом `alt`.\n",
    test_js:
      "if (!document.querySelector('a[href]') || !document.querySelector('img[alt]')) throw new Error('Нужны ссылка и изображение');",
    filename: "links.html",
    language: "html",
    code: "<section>\n</section>\n",
    saved_code:
      '<section>\n  <a href="https://example.com">Пример</a>\n  <img src="cat.png" alt="Кот">\n</section>\n',
  },
  {
    title: "Оформи карточку",
    description: "Напиши правило для класса card.",
    mdx_source:
      "# Оформи карточку\n\nДобавь правило для `.card` и задай внутренние отступы.\n",
    test_js:
      "if (!Array.from(document.styleSheets).some(sheet => { try { return Array.from(sheet.cssRules).some(rule => rule.cssText.includes('.card')); } catch { return false; } })) throw new Error('Добавь правило .card');",
    filename: "card.css",
    language: "css",
    code: ".card {\n}\n",
    saved_code: ".card {\n  padding: 16px;\n  border: 1px solid #ddd;\n}\n",
  },
  {
    title: "Выбери цвета",
    description: "Задай цвет текста и фон страницы.",
    mdx_source:
      "# Выбери цвета\n\nДобавь для `body` свойства `color` и `background-color`.\n",
    test_js:
      "if (!Array.from(document.styleSheets).some(sheet => { try { return Array.from(sheet.cssRules).some(rule => rule.cssText.includes('color:') && rule.cssText.includes('background-color:')); } catch { return false; } })) throw new Error('Задай цвет текста и фон');",
    filename: "colors.css",
    language: "css",
    code: "body {\n}\n",
    saved_code: "body {\n  color: #243047;\n  background-color: #f4f7fb;\n}\n",
  },
];

const tests = [
  {
    title: "Проверка: структура HTML",
    description: "Основные части документа.",
  },
  { title: "Проверка: текст", description: "Заголовки и абзацы." },
  { title: "Проверка: ссылки", description: "Атрибуты HTML-элементов." },
  { title: "Проверка: селекторы", description: "Классы в CSS." },
  { title: "Проверка: цвета", description: "Оформление текста и фона." },
];

const questions = [
  {
    title: "Где находится видимое содержимое страницы?",
    options: ["В body", "В head"],
    correct: 0,
  },
  {
    title: "Какой тег обозначает главный заголовок?",
    options: ["<h1>", "<p>"],
    correct: 0,
  },
  {
    title: "Какой атрибут задаёт адрес ссылки?",
    options: ["href", "alt"],
    correct: 0,
  },
  {
    title: "Как выбрать элементы класса card?",
    options: [".card", "#card"],
    correct: 0,
  },
  {
    title: "Какое свойство меняет цвет текста?",
    options: ["color", "background-color"],
    correct: 0,
  },
];

export async function seedTest() {
  console.log("Создание тестовых данных...");

  // Базовые записи создаются через seed.base.ts.
  const course = await db.orm.public.Courses.first({ title: "HTML/CSS" });
  const html = await db.orm.public.Technologies.first({ title: "HTML" });
  const css = await db.orm.public.Technologies.first({ title: "CSS" });
  const htmlLanguage = await db.orm.public.Code_languages.first({
    title: "html",
  });
  const cssLanguage = await db.orm.public.Code_languages.first({
    title: "css",
  });

  if (!course || !html || !css || !htmlLanguage || !cssLanguage) {
    throw new Error(
      "Сначала запустите seed.base.ts: не найдены базовые курс, технологии или языки",
    );
  }

  const groups = (
    await db.orm.public.Groups.where({ id_course: course.id }).all()
  )
    .filter((group) => ["group 1", "group 2", "group 3"].includes(group.title))
    .sort((left, right) => left.position - right.position);
  if (groups.length === 0)
    throw new Error("Не найдены базовые группы курса HTML/CSS");

  await db.transaction(async (tx) => {
    // Ученики и их сессии
    const createdStudents = [];
    for (const student of students) {
      createdStudents.push(await tx.orm.public.Students.create(student));
    }
    console.log("Ученики созданы");

    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    for (const student of createdStudents) {
      await tx.orm.public.Student_sessions.create({
        id_student: student.id,
        token_hash: createHash("sha256")
          .update(`test-session-${student.display_code}`)
          .digest("hex"),
        expires_at: expiresAt,
      });
    }
    console.log("Сессии созданы");

    // Теория
    const createdTheories = [];
    for (const theory of theories) {
      createdTheories.push(
        await tx.orm.public.Theories.create({
          title: theory.title,
          description: theory.description,
          id_technology: theory.technology === "HTML" ? html.id : css.id,
          position: theory.position,
          mdx_source: theory.mdx_source,
        }),
      );
    }
    console.log("Теория создана");

    // Практика и исходные файлы
    const createdPractices = [];
    const createdPracticeFiles = [];
    for (const practice of practices) {
      const createdPractice = await tx.orm.public.Practices.create({
        title: practice.title,
        description: practice.description,
        mdx_source: practice.mdx_source,
        test_js: practice.test_js,
      });
      createdPractices.push(createdPractice);
      createdPracticeFiles.push(
        await tx.orm.public.Practice_files.create({
          id_practice: createdPractice.id,
          id_code_language:
            practice.language === "html" ? htmlLanguage.id : cssLanguage.id,
          filename: practice.filename,
          code: practice.code,
        }),
      );
    }
    console.log("Практика и файлы созданы");

    // Тесты, вопросы и варианты ответов
    const createdTests = [];
    for (let index = 0; index < tests.length; index++) {
      const test = await tx.orm.public.Tests.create(tests[index]!);
      createdTests.push(test);

      const question = questions[index]!;
      const createdQuestion = await tx.orm.public.Test_questions.create({
        id_test: test.id,
        position: 1,
        title: question.title,
        code_block:
          index === 1
            ? "<h1>Привет!</h1>"
            : index === 3
              ? ".card { padding: 16px; }"
              : null,
        id_code_language:
          index === 1 ? htmlLanguage.id : index === 3 ? cssLanguage.id : null,
      });

      for (const [optionIndex, title] of question.options.entries()) {
        await tx.orm.public.Question_options.create({
          id_question: createdQuestion.id,
          position: optionIndex + 1,
          title,
          is_correct: optionIndex === question.correct,
        });
      }
    }
    console.log("Тесты, вопросы и ответы созданы");

    // Уроки в группах базового курса
    const createdLessons = [];
    for (let index = 0; index < theories.length; index++) {
      const group = groups[index % groups.length]!;
      createdLessons.push(
        await tx.orm.public.Lessons.create({
          id_group: group.id,
          title: theories[index]!.title,
          position: Math.floor(index / groups.length) + 1,
          id_theory: createdTheories[index]!.id,
          id_practice: createdPractices[index]!.id,
          id_test: createdTests[index]!.id,
        }),
      );
    }
    console.log("Уроки созданы");

    // Прогресс учеников
    const completedAt = new Date().toISOString();
    for (let index = 0; index < createdStudents.length; index++) {
      await tx.orm.public.Lesson_progress.create({
        id_student: createdStudents[index]!.id,
        id_lesson: createdLessons[index]!.id,
        theory_completed_at: completedAt,
        practice_completed_at: index < 3 ? completedAt : null,
        test_completed_at: index === 0 ? completedAt : null,
      });
    }
    console.log("Прогресс создан");

    // Сохранения практики и содержимое файлов
    for (let index = 0; index < createdStudents.length; index++) {
      const save = await tx.orm.public.Practice_saves.create({
        id_student: createdStudents[index]!.id,
        id_practice: createdPractices[index]!.id,
      });
      await tx.orm.public.Save_files.create({
        id_practice_save: save.id,
        id_practice_file: createdPracticeFiles[index]!.id,
        code: practices[index]!.saved_code,
      });
    }
    console.log("Сохранения практики созданы");
  });
}

try {
  await seedTest();
} catch (error) {
  console.error("Ошибка при создании тестовых данных:");
  console.error(error);

  process.exitCode = 1;
} finally {
  await db.close();
}
