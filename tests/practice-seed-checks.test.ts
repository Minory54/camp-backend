import { test } from "node:test";
import assert from "node:assert/strict";
import {
  runPracticeCheck,
  type CheckFile,
} from "../src/modules/practices/practice-check.runner.js";
import {
  CARD_TEST_JS,
  COLORS_TEST_JS,
  LINKS_TEST_JS,
  TEXT_TEST_JS,
} from "../src/prisma/seeds/practice-test-sources.js";

const html = (code: string, filename = "index.html"): CheckFile => ({
  id: 1,
  filename,
  language: "html",
  code,
});
const css = (code: string, id = 1, filename = "style.css"): CheckFile => ({
  id,
  filename,
  language: "css",
  code,
});

async function expectStatus(testJs: string, files: CheckFile[], status: "passed" | "failed") {
  const result = await runPracticeCheck(files, testJs);
  assert.equal(result.status, status, JSON.stringify(result));
}

test("Напиши текст: нужны непустые h1 и p", async () => {
  await expectStatus(TEXT_TEST_JS, [html("<h1>Заголовок</h1><p>Абзац</p>", "text.html")], "passed");
  await expectStatus(TEXT_TEST_JS, [html("<h1> </h1><p>Абзац</p>", "text.html")], "failed");
  await expectStatus(TEXT_TEST_JS, [html("<h1>Заголовок</h1><p> </p>", "text.html")], "failed");
});

test("Добавь ссылку и картинку: адреса и описание непустые", async () => {
  await expectStatus(
    LINKS_TEST_JS,
    [html('<a href="/page">Страница</a><img src="cat.png" alt="Кот">', "links.html")],
    "passed",
  );
  await expectStatus(
    LINKS_TEST_JS,
    [html('<a href=" ">Ссылка</a><img src="cat.png" alt="Кот">', "links.html")],
    "failed",
  );
  await expectStatus(
    LINKS_TEST_JS,
    [html('<a href="/page">Ссылка</a><img src="cat.png" alt=" ">', "links.html")],
    "failed",
  );
  await expectStatus(
    LINKS_TEST_JS,
    [html('<a href="/page">Ссылка</a><img alt="Кот">', "links.html")],
    "failed",
  );
});

test("Оформи карточку: правило .card с реальным отступом", async () => {
  await expectStatus(CARD_TEST_JS, [css(".card { padding: 16px; }")], "passed");
  await expectStatus(CARD_TEST_JS, [css(".cardinal { padding: 16px; }")], "failed");
  await expectStatus(CARD_TEST_JS, [css(".card {}")], "failed");
  await expectStatus(CARD_TEST_JS, [css(".card { padding: 0; }")], "failed");
  await expectStatus(
    CARD_TEST_JS,
    [
      css(".other { color: red; }"),
      css("@media screen { .card { padding-left: 1rem; } }", 2, "card.css"),
    ],
    "passed",
  );
});

test("Выбери цвета: свойства заданы для body и фон непрозрачен", async () => {
  await expectStatus(
    COLORS_TEST_JS,
    [css("body { color: #243047; background-color: #f4f7fb; }")],
    "passed",
  );
  await expectStatus(
    COLORS_TEST_JS,
    [css(".other { color: red; background-color: blue; }")],
    "failed",
  );
  await expectStatus(COLORS_TEST_JS, [css("body { color: red; }")], "failed");
  await expectStatus(
    COLORS_TEST_JS,
    [css("body { color: red; background-color: transparent; }")],
    "failed",
  );
  await expectStatus(
    COLORS_TEST_JS,
    [css("body { color: red; }"), css("body { background-color: blue; }", 2, "background.css")],
    "passed",
  );
});
