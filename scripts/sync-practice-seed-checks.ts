import { db } from "../src/prisma/db.js";
import {
  CARD_TEST_JS,
  COLORS_TEST_JS,
  LEGACY_CARD_TEST_JS,
  LEGACY_COLORS_TEST_JS,
  LEGACY_LINKS_TEST_JS,
  LEGACY_TEXT_TEST_JS,
  LINKS_TEST_JS,
  TEXT_TEST_JS,
} from "../src/prisma/seeds/practice-test-sources.js";

const replacements = [
  { title: "Напиши текст", old: LEGACY_TEXT_TEST_JS, next: TEXT_TEST_JS },
  { title: "Добавь ссылку и картинку", old: LEGACY_LINKS_TEST_JS, next: LINKS_TEST_JS },
  { title: "Оформи карточку", old: LEGACY_CARD_TEST_JS, next: CARD_TEST_JS },
  { title: "Выбери цвета", old: LEGACY_COLORS_TEST_JS, next: COLORS_TEST_JS },
];

try {
  for (const replacement of replacements) {
    const practices = await db.orm.public.Practices.where({
      title: replacement.title,
      test_js: replacement.old,
    }).all();
    for (const practice of practices) {
      await db.orm.public.Practices.where({ id: practice.id }).update({
        test_js: replacement.next,
      });
    }
    console.log(`${replacement.title}: обновлено ${practices.length}`);
  }
} finally {
  await db.close();
}
