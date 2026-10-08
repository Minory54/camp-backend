import { db } from "../src/prisma/db.js";
import {
  DOCUMENT_STRUCTURE_TEST_JS,
  LEGACY_DOCUMENT_STRUCTURE_TEST_JS,
} from "../src/prisma/seeds/practice-test-sources.js";

try {
  const practices = await db.orm.public.Practices.where({
    title: "Собери страницу",
    test_js: LEGACY_DOCUMENT_STRUCTURE_TEST_JS,
  }).all();
  for (const practice of practices) {
    await db.orm.public.Practices.where({ id: practice.id }).update({
      test_js: DOCUMENT_STRUCTURE_TEST_JS,
    });
  }
  console.log(`Обновлено проверок структуры HTML: ${practices.length}`);
} finally {
  await db.close();
}
