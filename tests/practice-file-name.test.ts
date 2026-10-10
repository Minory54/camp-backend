import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { isFlatPracticeFilename } from "../src/modules/practice_files/practice-file-name.js";
import { CreatePracticeFileSchema, UpdatePracticeFileSchema } from "../src/modules/practice_files/practice_files.schema.js";
import { createPracticeFile } from "../src/modules/practice_files/practice_files.service.js";
import { ResponseError } from "../src/common/errors/response.error.js";

const invalidNames = [
  "css/style.css", "css\\style.css", "../index.html", "/index.html", "C:\\style.css",
  ".", "..", " .. ", "", "   ", "index.html\n", "style\u0000.css",
];

test("Плоские имена допускают обычные имена, пробелы и кириллицу", () => {
  for (const filename of ["index.html", "text.html", "style.css", "мои стили.css", "style.min.css"]) {
    assert.equal(isFlatPracticeFilename(filename), true, filename);
  }
  for (const filename of invalidNames) {
    assert.equal(isFlatPracticeFilename(filename), false, JSON.stringify(filename));
  }
});

test("API отклоняет пути при создании и переименовании до вызова обработчика", async () => {
  const app = Fastify();
  let calls = 0;
  app.post("/files", { schema: { body: CreatePracticeFileSchema } }, async () => { calls++; return {}; });
  app.patch("/files/:id", { schema: { body: UpdatePracticeFileSchema } }, async () => { calls++; return {}; });
  try {
    for (const filename of invalidNames) {
      const create = await app.inject({ method: "POST", url: "/files", payload: {
        id_practice: 1, id_code_language: 1, code: "", filename,
      } });
      assert.equal(create.statusCode, 400, JSON.stringify(filename));
      const update = await app.inject({ method: "PATCH", url: "/files/1", payload: { filename } });
      assert.equal(update.statusCode, 400, JSON.stringify(filename));
    }
    assert.equal(calls, 0);
    assert.equal((await app.inject({ method: "POST", url: "/files", payload: {
      id_practice: 1, id_code_language: 1, code: "", filename: "мои стили.css",
    } })).statusCode, 200);
    assert.equal((await app.inject({ method: "PATCH", url: "/files/1", payload: { code: "body {}" } })).statusCode, 200);
  } finally {
    await app.close();
  }
});

test("Сервис отклоняет пути и при вызове без HTTP-валидации", async () => {
  for (const filename of invalidNames) {
    await assert.rejects(createPracticeFile({
      id_practice: 1, id_code_language: 1, code: "", filename,
    }), (error: unknown) => error instanceof ResponseError && error.statusCode === 400);
  }
});
