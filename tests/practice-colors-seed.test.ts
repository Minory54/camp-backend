import assert from "node:assert/strict";
import { test } from "node:test";
import { runPracticeCheck, type CheckFile } from "../src/modules/practices/practice-check.runner.js";
import { practices } from "../src/prisma/seeds/practices.js";

const practice = practices.find(({ theoryTitle }) => theoryTitle === "Цвета и прозрачность");
assert.ok(practice);

const solution = `
.color-card { color: #123456; background-color: #eef2ff; }
.color-card__title { color: hsl(220 100% 40%); }
.color-card__label { color: darkred; border: 2px solid currentColor; }
.color-card__overlay { background-color: rgb(37 99 235 / 40%); }
.color-card__muted { background-color: transparent; opacity: 0.5; }
`;

function files(css: string, editHtml = (html: string) => html): CheckFile[] {
  return practice!.files.map((file, index) => ({
    id: index + 1,
    ...file,
    code: file.language === "css" ? css : editHtml(file.code),
  }));
}

test("цвета: правильное решение и равнозначные форматы проходят проверку", async () => {
  for (const css of [
    solution,
    solution
      .replace("#123456", "rgb(18, 52, 86)")
      .replace("#eef2ff", "rgb(238 242 255)")
      .replace("hsl(220 100% 40%)", "#0044cc")
      .replace("rgb(37 99 235 / 40%)", "rgba(37, 99, 235, 0.4)"),
  ]) {
    assert.deepEqual(await runPracticeCheck(files(css), practice!.test_js), { status: "passed" });
  }
});

test("цвета: стартовое задание без оформления не засчитывается", async () => {
  const result = await runPracticeCheck(files(""), practice!.test_js);
  assert.equal(result.status, "failed", JSON.stringify(result));
});

test("цвета: прозрачность фона нельзя заменить прозрачностью текста или всей карточки", async () => {
  const mistakes = [
    solution.replace("rgb(37 99 235 / 40%)", "rgb(37 99 235)"),
    solution + ".color-card__overlay { opacity: 0.4; }",
    solution + ".color-card { opacity: 0.4; }",
    solution + "body { opacity: 0.4; }",
    solution + ".color-card__overlay { color: rgb(18 52 86 / 40%); }",
    solution.replace("opacity: 0.5", "opacity: 1"),
    solution.replace("background-color: transparent", "background-color: white"),
  ];
  for (const css of mistakes) {
    const result = await runPracticeCheck(files(css), practice!.test_js);
    assert.equal(result.status, "failed", JSON.stringify({ css, result }));
  }
});

test("цвета: оформление должно быть в CSS, а структура и подключение файла сохраняются", async () => {
  const changedHtml = [
    (html: string) => html.replace('class="color-card__muted"', 'class="other"'),
    (html: string) => html.replace("Палитра курса", "Другой текст"),
    (html: string) => html.replace("<article ", '<article style="color: #123456" '),
    (html: string) => html.replace('<link rel="stylesheet" href="style.css">', ""),
  ];
  for (const edit of changedHtml) {
    const result = await runPracticeCheck(files(solution, edit), practice!.test_js);
    assert.equal(result.status, "failed", JSON.stringify(result));
  }
});
