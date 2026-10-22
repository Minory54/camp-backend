import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";
import { theories } from "./theories.js";
import { practices } from "./practices.js";
import { questions, tests } from "./tests.js";

const technologies = [{ title: "HTML" }, { title: "CSS" }, { title: "VS Code" }];

const groups = [
  { position: 1, title: "Основы HTML и CSS" },
  { position: 2, title: "Углубленные темы верстки" },
  { position: 3, title: "Начало работы в VS Code" },
];

const courses = [{ title: "HTML/CSS" }];
const codeLanguages = [{ title: "html" }, { title: "css" }];

type LessonSeed = {
  groupPosition: number;
  position: number;
  theoryTitle: string;
  id_practice: number | null;
  is_hidden?: boolean;
};

// id_practice — реальный ID практики в БД; null — урок без практики.
// При повторном запуске seed значение null также снимает существующую привязку.
const lessonSeeds: LessonSeed[] = [
  // Основы HTML и CSS
  { groupPosition: 1, position: 1, theoryTitle: "Базовая теория WEB", id_practice: null },
  { groupPosition: 1, position: 2, theoryTitle: "Тег, атрибут и вложенность", id_practice: 1 },
  { groupPosition: 1, position: 3, theoryTitle: "Структура HTML-документа", id_practice: 2 },
  { groupPosition: 1, position: 4, theoryTitle: "Блочные и строчные элементы", id_practice: 3 },
  { groupPosition: 1, position: 5, theoryTitle: "Текст, списки и цитаты", id_practice: 4 },
  { groupPosition: 1, position: 6, theoryTitle: "Универсальные контейнеры", id_practice: 5 },
  { groupPosition: 1, position: 7, theoryTitle: "Семантические теги", id_practice: 6 },
  {
    groupPosition: 1,
    position: 8,
    theoryTitle: "Синтаксис, селектор и подключение к HTML",
    id_practice: 13,
  },
  {
    groupPosition: 1,
    position: 9,
    theoryTitle: "Каскадность, специфичность и наследование",
    id_practice: 14,
  },
  {
    groupPosition: 1,
    position: 10,
    theoryTitle: "Нейминг классов и методология БЭМ",
    id_practice: 15,
  },
  {
    groupPosition: 1,
    position: 11,
    theoryTitle: "Стили браузеров, обнуление стилей и нормализация",
    id_practice: 16,
  },
  { groupPosition: 1, position: 12, theoryTitle: "Единицы измерения", id_practice: 17 },
  {
    groupPosition: 1,
    position: 13,
    theoryTitle: "Блочная модель и свойство display",
    id_practice: 18,
  },
  { groupPosition: 1, position: 14, theoryTitle: "Шрифты и оформление текста", id_practice: 19 },

  // Углубленные темы верстки
  { groupPosition: 2, position: 1, theoryTitle: "Ссылки и кнопки", id_practice: 7 },
  { groupPosition: 2, position: 2, theoryTitle: "Изображения, аудио и видео", id_practice: 8 },
  { groupPosition: 2, position: 3, theoryTitle: "Таблицы", id_practice: 9 },
  { groupPosition: 2, position: 4, theoryTitle: "Формы и элементы управления", id_practice: 10 },
  { groupPosition: 2, position: 5, theoryTitle: "Векторная графика SVG", id_practice: 11 },
  { groupPosition: 2, position: 6, theoryTitle: "Цвета и прозрачность", id_practice: 30 },
  { groupPosition: 2, position: 7, theoryTitle: "Фон", id_practice: 20 },
  { groupPosition: 2, position: 8, theoryTitle: "Рамки", id_practice: 21 },
  { groupPosition: 2, position: 9, theoryTitle: "Flexbox", id_practice: 22 },
  { groupPosition: 2, position: 10, theoryTitle: "Grid", id_practice: 23 },
  { groupPosition: 2, position: 11, theoryTitle: "Позиционирование элементов", id_practice: 24 },
  {
    groupPosition: 2,
    position: 12,
    theoryTitle: "Переполнение и видимость",
    id_practice: null,
    is_hidden: true,
  },
  // Начало работы в VS Code
  { groupPosition: 3, position: 1, theoryTitle: "VS Code", id_practice: null },
  { groupPosition: 3, position: 2, theoryTitle: "Создание проекта", id_practice: null },
  { groupPosition: 3, position: 3, theoryTitle: "Плагины", id_practice: null },
  { groupPosition: 3, position: 4, theoryTitle: "Chrome DevTools", id_practice: null },

  // Скрытые уроки
  {
    groupPosition: 2,
    position: 14,
    theoryTitle: "Псевдоэлементы и псевдоклассы",
    id_practice: null,
    is_hidden: true,
  },
];

const testTheoryAliases: Record<string, string> = {
  "Тест: Основы WEB": "Базовая теория WEB",
};

function technologyKey(title: string): string {
  return title.trim().toLocaleUpperCase("ru");
}

function getTheoryTitleForTest(testTitle: string): string {
  return testTheoryAliases[testTitle] ?? testTitle.replace(/^Тест:\s*/i, "");
}

async function persistById<T extends { id: number }>(
  existing: T | null,
  create: () => Promise<T>,
  update: (id: number) => Promise<T | null>,
): Promise<T> {
  if (!existing) return create();
  const updated = await update(existing.id);
  if (!updated) throw new Error(`Запись с id=${existing.id} не найдена при обновлении`);
  return updated;
}

function validateSeedData() {
  const technologyTitles = new Set(technologies.map(({ title }) => technologyKey(title)));
  const theoryTitles = new Set(theories.map(({ title }) => title));
  const groupPositions = new Set<number>();
  const theoryPositions = new Set<string>();

  for (const group of groups) {
    if (!Number.isInteger(group.position) || group.position < 1) {
      throw new Error(`У группы «${group.title}» некорректная позиция ${group.position}`);
    }
    if (groupPositions.has(group.position)) {
      throw new Error(`Для группы повторяется позиция ${group.position}`);
    }
    groupPositions.add(group.position);
  }

  for (const theory of theories) {
    const key = technologyKey(theory.technology);
    if (!technologyTitles.has(key)) {
      throw new Error(
        `Для теории «${theory.title}» не объявлена технология «${theory.technology}»`,
      );
    }
    if (!Number.isInteger(theory.position) || theory.position < 1) {
      throw new Error(`У теории «${theory.title}» некорректная позиция ${theory.position}`);
    }
    const positionKey = `${key}:${theory.position}`;
    if (theoryPositions.has(positionKey)) {
      throw new Error(`У технологии «${theory.technology}» повторяется позиция ${theory.position}`);
    }
    theoryPositions.add(positionKey);
  }

  const practiceTheoryTitles = new Set<string>();
  for (const practice of practices) {
    if (!theoryTitles.has(practice.theoryTitle)) {
      throw new Error(
        `Для практики «${practice.title}» не найдена теория «${practice.theoryTitle}»`,
      );
    }
    if (practiceTheoryTitles.has(practice.theoryTitle)) {
      throw new Error(`К теории «${practice.theoryTitle}» привязано несколько практик`);
    }
    if (!practice.test_js.trim()) {
      throw new Error(`У практики «${practice.title}» не задана проверка`);
    }
    const practiceFileNames = new Set<string>();
    for (const file of practice.files) {
      if (practiceFileNames.has(file.filename)) {
        throw new Error(`В практике «${practice.title}» повторяется файл «${file.filename}»`);
      }
      practiceFileNames.add(file.filename);
      if (!codeLanguages.some(({ title }) => title === file.language)) {
        throw new Error(`Для файла «${file.filename}» не объявлен язык «${file.language}»`);
      }
    }
    if (
      practiceFileNames.size !== 2 ||
      !practiceFileNames.has("index.html") ||
      !practiceFileNames.has("style.css")
    ) {
      throw new Error(`В практике «${practice.title}» должны быть index.html и style.css`);
    }
    practiceTheoryTitles.add(practice.theoryTitle);
  }

  const testTitles = new Set<string>();
  const testTheoryTitles = new Set<string>();
  for (const test of tests) {
    if (testTitles.has(test.title)) {
      throw new Error(`Название теста «${test.title}» повторяется`);
    }
    testTitles.add(test.title);

    const theoryTitle = getTheoryTitleForTest(test.title);
    if (!theoryTitles.has(theoryTitle)) {
      throw new Error(`Для теста «${test.title}» не найдена теория «${theoryTitle}»`);
    }
    if (testTheoryTitles.has(theoryTitle)) {
      throw new Error(`К теории «${theoryTitle}» привязано несколько тестов`);
    }
    testTheoryTitles.add(theoryTitle);
  }

  const lessonPositions = new Set<string>();
  const lessonTheoryTitles = new Set<string>();
  for (const lesson of lessonSeeds) {
    if (!theoryTitles.has(lesson.theoryTitle)) {
      throw new Error(`Для урока не найдена теория «${lesson.theoryTitle}»`);
    }
    if (lessonTheoryTitles.has(lesson.theoryTitle)) {
      throw new Error(`Теория «${lesson.theoryTitle}» назначена нескольким урокам`);
    }
    if (!groupPositions.has(lesson.groupPosition)) {
      throw new Error(
        `Для урока «${lesson.theoryTitle}» не объявлена группа ${lesson.groupPosition}`,
      );
    }
    if (!Number.isInteger(lesson.position) || lesson.position < 1) {
      throw new Error(`У урока «${lesson.theoryTitle}» некорректная позиция ${lesson.position}`);
    }
    if (
      lesson.id_practice !== null &&
      (!Number.isInteger(lesson.id_practice) || lesson.id_practice < 1)
    ) {
      throw new Error(
        `У урока «${lesson.theoryTitle}» id_practice должен быть положительным целым ID или null`,
      );
    }
    lessonTheoryTitles.add(lesson.theoryTitle);

    const positionKey = `${lesson.groupPosition}:${lesson.position}`;
    if (lessonPositions.has(positionKey)) {
      throw new Error(
        `В группе №${lesson.groupPosition} повторяется позиция урока ${lesson.position}`,
      );
    }
    lessonPositions.add(positionKey);

    if (!lesson.is_hidden) {
      if (!testTheoryTitles.has(lesson.theoryTitle)) {
        throw new Error(`Для темы «${lesson.theoryTitle}» не задан тест`);
      }
    }
  }

  if (lessonTheoryTitles.size !== theoryTitles.size) {
    const unassigned = [...theoryTitles].filter((title) => !lessonTheoryTitles.has(title));
    throw new Error(`Не назначены уроки для теорий: ${unassigned.join(", ")}`);
  }

  const questionKeys = new Set<string>();
  const testsWithQuestions = new Set<number>();
  for (const question of questions) {
    if (!Number.isInteger(question.test) || question.test < 1 || question.test > tests.length) {
      throw new Error(`Вопрос «${question.title}» ссылается на неизвестный тест ${question.test}`);
    }
    if (!Number.isInteger(question.position) || question.position < 1) {
      throw new Error(`У вопроса «${question.title}» некорректная позиция ${question.position}`);
    }
    const key = `${question.test}:${question.position}`;
    if (questionKeys.has(key)) {
      throw new Error(`В тесте №${question.test} повторяется позиция вопроса ${question.position}`);
    }
    questionKeys.add(key);
    testsWithQuestions.add(question.test);

    if (
      question.correct.length === 0 ||
      question.correct.some(
        (index) => !Number.isInteger(index) || index < 0 || index >= question.options.length,
      )
    ) {
      throw new Error(`У вопроса «${question.title}» некорректные индексы правильных ответов`);
    }
    if (
      question.id_code_language !== null &&
      (question.id_code_language < 1 || question.id_code_language > codeLanguages.length)
    ) {
      throw new Error(`У вопроса «${question.title}» неизвестный язык кода`);
    }
  }

  for (let testNumber = 1; testNumber <= tests.length; testNumber++) {
    const testQuestions = questions.filter((question) => question.test === testNumber);
    if (!testsWithQuestions.has(testNumber) || testQuestions.length !== 5) {
      throw new Error(`У теста №${testNumber} должно быть ровно 5 вопросов`);
    }
    const positions = testQuestions
      .map(({ position }) => position)
      .sort((left, right) => left - right);
    if (positions.some((position, index) => position !== index + 1)) {
      throw new Error(`В тесте №${testNumber} позиции вопросов должны идти от 1 до 5`);
    }
  }
}

validateSeedData();

export async function seedGeneral() {
  await db.transaction(async (tx) => {
    console.log("Создание базовых данных...");

    const technologyIds = new Map<string, number>();
    for (const technologySeed of technologies) {
      const existing = await tx.orm.public.Technologies.first({ title: technologySeed.title });
      const technology = await persistById(
        existing,
        () => tx.orm.public.Technologies.create(technologySeed),
        (id) => tx.orm.public.Technologies.where({ id }).update(technologySeed),
      );
      technologyIds.set(technologyKey(technologySeed.title), technology.id);
    }

    const courseIds = new Map<string, number>();
    for (const courseSeed of courses) {
      const existing = await tx.orm.public.Courses.first({ title: courseSeed.title });
      const course = await persistById(
        existing,
        () => tx.orm.public.Courses.create(courseSeed),
        (id) => tx.orm.public.Courses.where({ id }).update(courseSeed),
      );
      courseIds.set(courseSeed.title, course.id);
    }

    const groupIdsByPosition = new Map<number, number>();
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
      const group = await persistById(
        existing,
        () => tx.orm.public.Groups.create(groupData),
        (id) => tx.orm.public.Groups.where({ id }).update(groupData),
      );
      groupIdsByPosition.set(groupSeed.position, group.id);
    }

    const codeLanguageIds = new Map<string, number>();
    for (const languageSeed of codeLanguages) {
      const existing = await tx.orm.public.Code_languages.first({ title: languageSeed.title });
      const language = await persistById(
        existing,
        () => tx.orm.public.Code_languages.create(languageSeed),
        (id) => tx.orm.public.Code_languages.where({ id }).update(languageSeed),
      );
      codeLanguageIds.set(languageSeed.title, language.id);
    }
    console.log("Технологии, курс, группы и языки созданы");

    const theoryIdsByTitle = new Map<string, number>();
    for (const theorySeed of theories) {
      const technologyId = technologyIds.get(technologyKey(theorySeed.technology));
      if (technologyId === undefined) {
        throw new Error(`Не найдена технология «${theorySeed.technology}»`);
      }
      const theoryData = {
        title: theorySeed.title,
        description: theorySeed.description,
        id_technology: technologyId,
        position: theorySeed.position,
        mdx_source: theorySeed.mdx_source,
      };
      const existing = await tx.orm.public.Theories.first({
        id_technology: technologyId,
        position: theorySeed.position,
      });
      const theory = await persistById(
        existing,
        () => tx.orm.public.Theories.create(theoryData),
        (id) => tx.orm.public.Theories.where({ id }).update(theoryData),
      );
      theoryIdsByTitle.set(theorySeed.title, theory.id);
    }

    for (const practiceSeed of practices) {
      const practiceData = {
        title: practiceSeed.title,
        description: practiceSeed.description,
        mdx_source: practiceSeed.mdx_source,
        test_js: practiceSeed.test_js,
      };
      const existing = await tx.orm.public.Practices.first({ title: practiceSeed.title });
      const practice = await persistById(
        existing,
        () => tx.orm.public.Practices.create(practiceData),
        (id) => tx.orm.public.Practices.where({ id }).update(practiceData),
      );

      for (const fileSeed of practiceSeed.files) {
        const codeLanguageId = codeLanguageIds.get(fileSeed.language);
        if (codeLanguageId === undefined) {
          throw new Error(`Не найден язык файла практики: ${fileSeed.language}`);
        }
        const fileData = {
          id_practice: practice.id,
          id_code_language: codeLanguageId,
          filename: fileSeed.filename,
          code: fileSeed.code,
        };
        const existingFile = await tx.orm.public.Practice_files.first({
          id_practice: practice.id,
          filename: fileSeed.filename,
        });
        await persistById(
          existingFile,
          () => tx.orm.public.Practice_files.create(fileData),
          (id) => tx.orm.public.Practice_files.where({ id }).update(fileData),
        );
      }
    }
    console.log("Теории, практики и файлы созданы");

    const testIdsByTheoryTitle = new Map<string, number>();
    for (let testIndex = 0; testIndex < tests.length; testIndex++) {
      const testSeed = tests[testIndex]!;
      const existing = await tx.orm.public.Tests.first({ title: testSeed.title });
      const test = await persistById(
        existing,
        () => tx.orm.public.Tests.create(testSeed),
        (id) => tx.orm.public.Tests.where({ id }).update(testSeed),
      );
      const theoryTitle = getTheoryTitleForTest(testSeed.title);
      testIdsByTheoryTitle.set(theoryTitle, test.id);

      for (const questionSeed of questions.filter((question) => question.test === testIndex + 1)) {
        let idCodeLanguage: number | null = null;
        if (questionSeed.id_code_language !== null) {
          const languageSeed = codeLanguages[questionSeed.id_code_language - 1];
          if (!languageSeed) {
            throw new Error(`Не найден язык кода №${questionSeed.id_code_language}`);
          }
          const languageId = codeLanguageIds.get(languageSeed.title);
          if (languageId === undefined) {
            throw new Error(`Не найден язык кода «${languageSeed.title}»`);
          }
          idCodeLanguage = languageId;
        }

        const questionData = {
          id_test: test.id,
          position: questionSeed.position,
          title: questionSeed.title,
          description: questionSeed.description,
          type: questionSeed.type,
          code_block: questionSeed.code_block,
          id_code_language: idCodeLanguage,
        };
        const existingQuestion = await tx.orm.public.Test_questions.first({
          id_test: test.id,
          position: questionSeed.position,
        });
        const question = await persistById(
          existingQuestion,
          () => tx.orm.public.Test_questions.create(questionData),
          (id) => tx.orm.public.Test_questions.where({ id }).update(questionData),
        );

        for (const [optionIndex, title] of questionSeed.options.entries()) {
          const optionData = {
            id_question: question.id,
            position: optionIndex + 1,
            title,
            is_correct: questionSeed.correct.includes(optionIndex),
          };
          const existingOption = await tx.orm.public.Question_options.first({
            id_question: question.id,
            position: optionIndex + 1,
          });
          await persistById(
            existingOption,
            () => tx.orm.public.Question_options.create(optionData),
            (id) => tx.orm.public.Question_options.where({ id }).update(optionData),
          );
        }
      }
    }
    console.log("Тесты, вопросы и варианты ответов созданы");

    const managedTheoryIds = new Set(theoryIdsByTitle.values());
    const existingLessonsByTheoryId = new Map<number, { id: number }>();
    const existingGroupLessons = [];
    for (const groupId of groupIdsByPosition.values()) {
      existingGroupLessons.push(
        ...(await tx.orm.public.Lessons.where({ id_group: groupId }).all()),
      );
    }

    const managedExistingLessons = existingGroupLessons.filter(
      (lesson) => lesson.id_theory !== null && managedTheoryIds.has(lesson.id_theory),
    );
    for (const lesson of managedExistingLessons) {
      const theoryId = lesson.id_theory!;
      if (existingLessonsByTheoryId.has(theoryId)) {
        throw new Error(`Для теории id=${theoryId} найдено несколько уроков`);
      }
      existingLessonsByTheoryId.set(theoryId, lesson);
    }

    // Освобождаем позиции управляемых seed-уроков перед переносом между группами,
    // сохраняя id урока и связанные с ним отметки прогресса.
    const maxLessonPosition = existingGroupLessons.reduce(
      (max, lesson) => Math.max(max, lesson.position),
      0,
    );
    const temporaryPositionStart = maxLessonPosition + 1;
    if (temporaryPositionStart + managedExistingLessons.length > 2_147_483_647) {
      throw new Error("Не удалось подобрать временные позиции для переноса seed-уроков");
    }
    for (const [index, lesson] of managedExistingLessons.entries()) {
      await tx.orm.public.Lessons.where({ id: lesson.id }).update({
        position: temporaryPositionStart + index,
      });
    }

    for (const lessonSeed of lessonSeeds) {
      const groupId = groupIdsByPosition.get(lessonSeed.groupPosition);
      const theoryId = theoryIdsByTitle.get(lessonSeed.theoryTitle);
      if (groupId === undefined || theoryId === undefined) {
        throw new Error(`Не удалось связать урок с теорией «${lessonSeed.theoryTitle}»`);
      }
      if (lessonSeed.id_practice !== null) {
        const practice = await tx.orm.public.Practices.first({ id: lessonSeed.id_practice });
        if (!practice) {
          throw new Error(
            `Для урока «${lessonSeed.theoryTitle}» не найдена практика id=${lessonSeed.id_practice}`,
          );
        }
      }
      const lessonData = {
        id_group: groupId,
        title: lessonSeed.theoryTitle,
        position: lessonSeed.position,
        is_hidden: lessonSeed.is_hidden ?? false,
        id_theory: theoryId,
        id_practice: lessonSeed.id_practice,
        id_test: testIdsByTheoryTitle.get(lessonSeed.theoryTitle) ?? null,
      };

      const existingLesson = existingLessonsByTheoryId.get(theoryId) ?? null;
      if (!existingLesson) {
        const occupiedPosition = await tx.orm.public.Lessons.first({
          id_group: groupId,
          position: lessonSeed.position,
        });
        if (occupiedPosition) {
          throw new Error(
            `Позиция ${lessonSeed.position} группы ${lessonSeed.groupPosition} занята другим уроком`,
          );
        }
      }

      await persistById(
        existingLesson,
        () => tx.orm.public.Lessons.create(lessonData),
        (id) => tx.orm.public.Lessons.where({ id }).update(lessonData),
      );
    }
    console.log("Уроки созданы");
  });

  console.log("Все данные созданы");
}

const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  try {
    await seedGeneral();
  } catch (error) {
    console.error("Ошибка при создании общих данных:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}
