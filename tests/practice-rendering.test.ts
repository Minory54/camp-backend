import { test } from "node:test";
import assert from "node:assert/strict";
import { runPracticeCheck, type CheckFile } from "../src/modules/practices/practice-check.runner.js";

const html = (code: string, filename = "index.html"): CheckFile => ({
  id: 1, filename, language: "html", code,
});
const css = (code: string, filename = "style.css", id = 2): CheckFile => ({
  id, filename, language: "css", code,
});

async function expectPass(files: CheckFile[], testJs: string) {
  assert.deepEqual(await runPracticeCheck(files, testJs), { status: "passed" });
}

test("HTML без CSS проверяется без добавленных стилей", async () => {
  await expectPass([html("<h1>Заголовок</h1>", "lesson.html")], `
    if (document.querySelector('h1')?.textContent !== 'Заголовок') throw new Error('Нет HTML');
    if (document.styleSheets.length !== 0) throw new Error('Лишние стили');
  `);
});

test("CSS подключается через link ровно один раз и готов к проверке", async () => {
  await expectPass([
    html('<link rel="stylesheet" href="./style.css"><h1>Текст</h1>'),
    css("h1 { color: red; }"),
  ], `
    if (document.styleSheets.length !== 1) throw new Error('CSS подключён повторно');
    if (document.styleSheets[0].cssRules.length !== 1) throw new Error('CSS не загружен');
    if (getComputedStyle(document.querySelector('h1')).color !== 'rgb(255, 0, 0)') {
      throw new Error('CSS не применён');
    }
  `);
});

test("Неподключённый CSS не применяется", async () => {
  await expectPass([html("<h1>Текст</h1>"), css("h1 { color: red; }")], `
    if (document.styleSheets.length !== 0) throw new Error('CSS подключён автоматически');
    if (getComputedStyle(document.querySelector('h1')).color !== 'rgb(0, 0, 0)') {
      throw new Error('Неподключённый CSS применён');
    }
  `);
});

test("Каскад учитывает порядок link в HTML, а не порядок файлов", async () => {
  const files = [
    css("h1 { color: red; }", "a.css", 2),
    css("h1 { color: blue; }", "b.css", 3),
  ];
  for (const ordered of [files, [...files].reverse()]) {
    await expectPass([
      ...ordered,
      html('<link rel="stylesheet" href="b.css"><link rel="stylesheet" href="a.css"><h1>Текст</h1>'),
    ], `
      if (document.styleSheets.length !== 2) throw new Error('Лишние стили');
      if (getComputedStyle(document.querySelector('h1')).color !== 'rgb(255, 0, 0)') {
        throw new Error('Нарушен порядок link');
      }
    `);
  }
});

test("Каскад сохраняет порядок style и link", async () => {
  for (const [head, expected] of [
    ['<style>h1 { color: red; }</style><link rel="stylesheet" href="style.css">', 'rgb(0, 0, 255)'],
    ['<link rel="stylesheet" href="style.css"><style>h1 { color: red; }</style>', 'rgb(255, 0, 0)'],
  ]) {
    await expectPass([html(`${head}<h1>Текст</h1>`), css("h1 { color: blue; }")], `
      if (getComputedStyle(document.querySelector('h1')).color !== '${expected}') {
        throw new Error('Нарушен порядок style и link');
      }
    `);
  }
});

test("Специфичность и important применяются браузером", async () => {
  await expectPass([
    html('<style>#title { color: red; }</style><link rel="stylesheet" href="style.css"><h1 id="title">Текст</h1>'),
    css("h1 { color: blue; }"),
  ], `
    if (getComputedStyle(document.querySelector('h1')).color !== 'rgb(255, 0, 0)') {
      throw new Error('Нарушена специфичность');
    }
  `);
  await expectPass([
    html('<link rel="stylesheet" href="style.css"><h1 style="color: red">Текст</h1>'),
    css("h1 { color: blue !important; }"),
  ], `
    if (getComputedStyle(document.querySelector('h1')).color !== 'rgb(0, 0, 255)') {
      throw new Error('Не применён important');
    }
  `);
});

test("Локальный import загружается до проверки", async () => {
  await expectPass([
    html('<link rel="stylesheet" href="style.css"><h1>Текст</h1>'),
    css('@import "theme.css";'),
    css("h1 { color: red; }", "theme.css", 3),
  ], `
    if (document.styleSheets.length !== 1) throw new Error('Import подключён отдельно');
    if (document.styleSheets[0].cssRules[0].styleSheet.cssRules.length !== 1) {
      throw new Error('Import не загружен');
    }
    if (getComputedStyle(document.querySelector('h1')).color !== 'rgb(255, 0, 0)') {
      throw new Error('Import не применён');
    }
  `);
});

test("Плоское имя CSS с пробелом и кириллицей загружается", async () => {
  await expectPass([
    html('<link rel="stylesheet" href="мои стили.css"><h1>Текст</h1>'),
    css("h1 { color: red; }", "мои стили.css"),
  ], `
    if (getComputedStyle(document.querySelector('h1')).color !== 'rgb(255, 0, 0)') {
      throw new Error('Файл не загружен');
    }
  `);
});

test("Практика без HTML отклоняется как ошибка настройки", async () => {
  assert.deepEqual(await runPracticeCheck([css("body { color: red; }")], ""), {
    status: "system_error", error: "У задания нет HTML-файла",
  });
});

test("Старые задания с путями отклоняются как ошибка настройки", async () => {
  for (const filename of ["pages/index.html", "css\\style.css", "../index.html", ".", ".."]) {
    assert.deepEqual(await runPracticeCheck([html("<h1>Текст</h1>", filename)], ""), {
      status: "system_error", error: "Файлы задания должны иметь имена без пути и каталогов",
    });
  }
});
