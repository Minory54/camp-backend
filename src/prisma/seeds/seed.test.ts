import { db } from "../db.js";
import { randomBytes, randomInt } from "node:crypto";
import { access, writeFile } from "node:fs/promises";
import { hashAccessToken } from "../../modules/students/students.service.js";

const students = [
  {
    display_code: "demo-alisa",
    label: "Алиса",
  },
  {
    display_code: "demo-boris",
    label: "Борис",
  },
  {
    display_code: "demo-vera",
    label: "Вера",
  },
  {
    display_code: "demo-gleb",
    label: "Глеб",
  },
  {
    display_code: "demo-dasha",
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
    mdx_source: "# Собери страницу\n\nДобавь `<!doctype html>`, `<html>`, `<head>` и `<body>`.\n",
    test_js: `
const html = sourceFiles.find(file => file.filename === 'index.html')?.code ?? '';
const source = html.replace(/<!--[\\s\\S]*?-->/g, '');
const hasDoctype = /^\\s*<!doctype\\s+html\\s*>/i.test(source);
const htmlTag = /<html(?:\\s[^>]*)?>/i.exec(source);
const headTag = /<head(?:\\s[^>]*)?>/i.exec(source);
const bodyTag = /<body(?:\\s[^>]*)?>/i.exec(source);
if (!hasDoctype || !htmlTag || !headTag || !bodyTag ||
    !(htmlTag.index < headTag.index && headTag.index < bodyTag.index)) {
  throw new Error('Добавь <!doctype html>, html, head и body в исходный файл');
}
`,
    filename: "index.html",
    language: "html",
    code: '<!doctype html>\n<html lang="ru">\n  <head><title>Моя страница</title></head>\n  <body></body>\n</html>\n',
    saved_code:
      '<!doctype html>\n<html lang="ru">\n  <head><title>Моя страница</title></head>\n  <body><h1>Привет!</h1></body>\n</html>\n',
  },
  {
    title: "Напиши текст",
    description: "Добавь заголовок и абзац.",
    mdx_source: "# Напиши текст\n\nРазмести на странице один `<h1>` и один `<p>`.\n",
    test_js: `
const hasText = selector => Array.from(document.querySelectorAll(selector))
  .some(element => element.textContent?.trim());
if (!hasText('h1')) throw new Error('Добавь непустой заголовок h1');
if (!hasText('p')) throw new Error('Добавь непустой абзац p');
`,
    filename: "text.html",
    language: "html",
    code: "<main>\n</main>\n",
    saved_code: "<main>\n  <h1>Обо мне</h1>\n  <p>Я учусь создавать сайты.</p>\n</main>\n",
  },
  {
    title: "Добавь ссылку и картинку",
    description: "Сделай ссылку и изображение с описанием.",
    mdx_source: "# Ссылка и картинка\n\nДобавь `<a>` с адресом и `<img>` с текстом `alt`.\n",
    test_js: `
const hasLink = Array.from(document.querySelectorAll('a')).some(link => {
  const href = link.getAttribute('href')?.trim() ?? '';
  return href !== '' && href !== '#' && !/^javascript:/i.test(href);
});
if (!hasLink) throw new Error('Добавь ссылку с адресом href');
const hasImage = Array.from(document.querySelectorAll('img')).some(image =>
  (image.getAttribute('src')?.trim() ?? '') !== '' &&
  (image.getAttribute('alt')?.trim() ?? '') !== ''
);
if (!hasImage) throw new Error('Добавь изображение с адресом src и описанием alt');
`,
    filename: "links.html",
    language: "html",
    code: "<section>\n</section>\n",
    saved_code:
      '<section>\n  <a href="https://example.com">Пример</a>\n  <img src="cat.png" alt="Кот">\n</section>\n',
  },
  {
    title: "Оформи карточку",
    description: "Напиши правило для класса card.",
    mdx_source: "# Оформи карточку\n\nДобавь правило для `.card` и задай внутренние отступы.\n",
    test_js: `
    function allStyleRules() {
  const found = [];
  function visit(rules) {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) found.push(rule);
      if ('cssRules' in rule) {
        try { visit(rule.cssRules); } catch {}
      }
    }
  }
  for (const sheet of Array.from(document.styleSheets)) {
    try { visit(sheet.cssRules); } catch {}
  }
  return found;
}
function hasSelector(rule, selector) {
  return rule.selectorText.split(',').some(part => part.trim() === selector);
}

const cardRules = allStyleRules().filter(rule => hasSelector(rule, '.card'));
if (cardRules.length === 0) throw new Error('Добавь CSS-правило для .card');
const paddingProperties = ['padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left'];
if (!cardRules.some(rule => paddingProperties.some(property => rule.style.getPropertyValue(property).trim()))) {
  throw new Error('Задай внутренние отступы для .card');
}
const probe = document.createElement('div');
probe.className = 'card';
document.body.appendChild(probe);
const style = getComputedStyle(probe);
const paddings = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
probe.remove();
if (!paddings.some(value => Number.parseFloat(value) > 0)) {
  throw new Error('Внутренние отступы .card должны быть больше нуля');
}
`,
    filename: "card.css",
    language: "css",
    code: ".card {\n}\n",
    saved_code: ".card {\n  padding: 16px;\n  border: 1px solid #ddd;\n}\n",
  },
  {
    title: "Выбери цвета",
    description: "Задай цвет текста и фон страницы.",
    mdx_source: "# Выбери цвета\n\nДобавь для `body` свойства `color` и `background-color`.\n",
    test_js: `function allStyleRules() {
  const found = [];
  function visit(rules) {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) found.push(rule);
      if ('cssRules' in rule) {
        try { visit(rule.cssRules); } catch {}
      }
    }
  }
  for (const sheet of Array.from(document.styleSheets)) {
    try { visit(sheet.cssRules); } catch {}
  }
  return found;
}
function hasSelector(rule, selector) {
  return rule.selectorText.split(',').some(part => part.trim() === selector);
}
const bodyRules = allStyleRules().filter(rule => hasSelector(rule, 'body'));
if (!bodyRules.some(rule => rule.style.getPropertyValue('color').trim())) {
  throw new Error('Задай для body цвет текста');
}
if (!bodyRules.some(rule => rule.style.getPropertyValue('background-color').trim())) {
  throw new Error('Задай для body цвет фона');
}
const background = getComputedStyle(document.body).backgroundColor;
if (background === 'transparent' || /^rgba\\([^)]*,\\s*0(?:\\.0+)?\\)$/i.test(background)) {
  throw new Error('Цвет фона body не должен быть прозрачным');
}
`,
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
  try {
    await access(".seed-test-credentials.json");
    throw new Error("Файл .seed-test-credentials.json уже существует; сохраните его перед повторным seed");
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT")) throw error;
  }
  console.log("Создание тестовых данных...");
  const credentials: Array<{
    id_student: string;
    display_code: string;
    recovery_code: string;
    access_token: string;
  }> = [];

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

  const groups = (await db.orm.public.Groups.where({ id_course: course.id }).all())
    .filter((group) => ["group 1", "group 2", "group 3"].includes(group.title))
    .sort((left, right) => left.position - right.position);
  if (groups.length === 0) throw new Error("Не найдены базовые группы курса HTML/CSS");

  await db.transaction(async (tx) => {
    // Ученики
    const createdStudents = [];
    const occupied = new Set(
      (await tx.orm.public.Students.select("recovery_code").all()).map((row) => row.recovery_code),
    );
    const available = Array.from({ length: 10_000 }, (_, number) =>
      `SDC${String(number).padStart(4, "0")}`,
    ).filter((code) => !occupied.has(code));
    if (available.length < students.length) throw new Error("Недостаточно свободных recovery_code");
    for (const student of students) {
      const recovery_code = available.splice(randomInt(available.length), 1)[0]!;
      const access_token = randomBytes(32).toString("base64url");
      const created = await tx.orm.public.Students.create({
        ...student,
        recovery_code,
        access_token: hashAccessToken(access_token),
      });
      createdStudents.push(created);
      credentials.push({ id_student: created.id, display_code: student.display_code, recovery_code, access_token });
    }
    console.log("Ученики созданы");

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
          id_code_language: practice.language === "html" ? htmlLanguage.id : cssLanguage.id,
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
          index === 1 ? "<h1>Привет!</h1>" : index === 3 ? ".card { padding: 16px; }" : null,
        id_code_language: index === 1 ? htmlLanguage.id : index === 3 ? cssLanguage.id : null,
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
      if (index === 0) {
        const questions = await tx.orm.public.Test_questions.where({ id_test: createdTests[index]!.id }).all();
        for (const question of questions) {
          await tx.orm.public.Test_answers.create({ id_student: createdStudents[index]!.id, id_question: question.id, is_correct: true });
        }
      }
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
  await writeFile(".seed-test-credentials.json", JSON.stringify(credentials, null, 2), { mode: 0o600, flag: "wx" });
  console.log("Данные для входа сохранены в .seed-test-credentials.json");
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
