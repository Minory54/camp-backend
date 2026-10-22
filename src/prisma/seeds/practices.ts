export type PracticeFileSeed = {
  filename: string;
  language: "html" | "css";
  code: string;
};

export type PracticeSeed = {
  title: string;
  theoryTitle: string;
  description: string;
  mdx_source: string;
  test_js: string;
  files: PracticeFileSeed[];
};

const INITIAL_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Практика HTML</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
</body>
</html>
`;

function withFiles(
  practice: Omit<PracticeSeed, "files">,
  htmlCode = INITIAL_HTML,
  cssCode = "",
): PracticeSeed {
  return {
    ...practice,
    files: [
      { filename: "index.html", language: "html", code: htmlCode },
      { filename: "style.css", language: "css", code: cssCode },
    ],
  };
}

function practicePage(body: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Практика CSS</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${body}
</body>
</html>
`;
}

const COMMON_TEST_JS = String.raw`
const ok = (condition, message) => {
  if (!condition) throw new Error(message);
};
const norm = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const htmlFiles = sourceFiles.filter(f => f.filename === 'index.html' && f.language === 'html');
const cssFiles = sourceFiles.filter(f => f.filename === 'style.css' && f.language === 'css');
ok(htmlFiles.length === 1 && cssFiles.length === 1 && sourceFiles.length === 2,
  'У практики должны быть файлы index.html и style.css');
const source = htmlFiles[0].code.replace(/<!--[\s\S]*?-->/g, '');

function checkNesting() {
  const stack = [];
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  const tokens = /<(\/?)([a-z][\w:-]*)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
  for (const match of source.matchAll(tokens)) {
    const tag = match[2].toLowerCase();
    if (match[1]) {
      ok(!voidTags.has(tag) && stack.pop() === tag, 'Нарушен порядок закрытия тега ' + tag);
    } else if (!voidTags.has(tag)) {
      const selfClosing = /\/\s*>$/.test(match[0]);
      ok(!selfClosing || tag === 'svg' || stack.includes('svg'), 'Парный HTML-тег ' + tag + ' нужно закрыть отдельно');
      if (!selfClosing) stack.push(tag);
    }
  }
  ok(stack.length === 0, 'Закройте парные теги: ' + stack.join(', '));
}

// Описание узла: [тег, проверяемые атрибуты, текст или дочерние узлы, общий текст?].
function check(element, spec, path = 'body') {
  const [tag, attrs, content, totalText] = spec;
  ok(element?.localName === tag, path + ': нужен тег <' + tag + '>');
  for (const [name, expected] of Object.entries(attrs)) {
    const actual = element.getAttribute(name);
    const valid = expected === true ? actual !== null
      : expected === false ? actual === null
      : Array.isArray(expected) ? expected.every(token => norm(actual).split(' ').includes(token))
      : actual === expected;
    ok(valid, path + ': проверьте атрибут ' + name);
  }
  if (!['html','head','meta','title','desc','source','track','option'].includes(tag)) {
    const style = getComputedStyle(element);
    ok(style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse' && Number(style.opacity) !== 0,
      path + ': содержимое не должно быть скрыто');
  }
  if (['input','textarea','select','button'].includes(tag)) {
    ok(element.matches(':disabled') === (attrs.disabled === true), path + ': проверьте доступность элемента');
    if ('readOnly' in element) ok(!element.readOnly, path + ': поле должно допускать ввод');
  }
  if (typeof content === 'string') {
    ok(element.children.length === 0 && norm(element.textContent) === norm(content),
      path + ': нужен текст «' + content + '» без вложенных элементов');
    return;
  }
  // Подключение стартового CSS не меняет структуру задания о документе.
  const children = [...element.children].filter(child => !(
    tag === 'head' && child.localName === 'link' && child.relList.contains('stylesheet') &&
    ['style.css','./style.css'].includes(child.getAttribute('href'))
  ));
  ok(children.length === content.length, path + ': неверное количество дочерних элементов');
  content.forEach((child, i) => check(children[i], child, path + ' > ' + child[0] + '[' + (i + 1) + ']'));
  if (totalText !== undefined) {
    ok(norm(element.textContent) === norm(totalText), path + ': проверьте полный текст');
  } else {
    ok(![...element.childNodes].some(n => n.nodeType === Node.TEXT_NODE && norm(n.textContent)),
      path + ': лишний текст между дочерними элементами');
  }
}
`;

type CssPracticeSeed = {
  title: string;
  theoryTitle: string;
  description: string;
  mdx_source: string;
  body: string;
  test: string;
};

function cssPractice(seed: CssPracticeSeed): PracticeSeed {
  return withFiles(
    {
      title: seed.title,
      theoryTitle: seed.theoryTitle,
      description: seed.description,
      mdx_source: seed.mdx_source,
      test_js: COMMON_TEST_JS + "\n" + seed.test,
    },
    practicePage(seed.body),
  );
}

export const practices: PracticeSeed[] = [
  withFiles({
    title: "Карточка курса: теги и атрибуты",
    theoryTitle: "Тег, атрибут и вложенность",
    description: "Соберите карточку курса с вложенными элементами и неактивной кнопкой.",
    mdx_source: `Создайте карточку курса внутри \`body\` готового документа.

Карточка — один \`div\` с \`id="course-card"\` и классом \`card\`.

Непосредственно внутри карточки разместите по порядку:

1. Заголовок \`h2\` с текстом \`Основы HTML\`.
2. Абзац \`p\` с классом \`description\` и полным текстом \`Изучаем HTML.\`. Только слово \`HTML\` оберните в \`strong\`.
3. Ссылку \`a\` с текстом \`Подробнее\`, атрибутом \`href="course.html"\` и подсказкой \`title="Открыть курс"\`.
4. Кнопку \`button\` с текстом \`Скоро\`, типом \`button\` и логическим атрибутом \`disabled\`.

Следите за вложенностью и порядком закрытия тегов. Файл \`course.html\` создавать не нужно: проверяется значение \`href\`.`,
    test_js: COMMON_TEST_JS + String.raw`
checkNesting();

check(document.body, ['body', {}, [
  ['div', {id:'course-card', class:['card']}, [
    ['h2', {}, 'Основы HTML'],
    ['p', {class:['description']}, [['strong', {}, 'HTML']], 'Изучаем HTML.'],
    ['a', {href:'course.html', title:'Открыть курс'}, 'Подробнее'],
    ['button', {type:'button', disabled:true}, 'Скоро']
  ]]
]]);
`,
  }),

  withFiles({
    title: "Страница учебного плана",
    theoryTitle: "Структура HTML-документа",
    description: "Создайте полный HTML-документ с метаданными и содержимым страницы.",
    mdx_source: `В пустом файле \`index.html\` создайте полный HTML-документ.

Начните с объявления \`<!DOCTYPE html>\`. Затем добавьте корневой элемент \`html\` с атрибутом \`lang="ru"\`.

Внутри \`html\` должны находиться сначала \`head\`, затем \`body\`. Запишите эти элементы и их закрывающие теги явно.

Внутри \`head\` разместите по порядку:

1. \`meta\` с атрибутом \`charset="UTF-8"\`.
2. \`meta\` с атрибутами \`name="viewport"\` и \`content="width=device-width, initial-scale=1.0"\`.
3. \`title\` с текстом \`Мой учебный план\`.

Непосредственно внутри \`body\` разместите по порядку:

1. \`h1\` с текстом \`Мой учебный план\`.
2. \`p\` с текстом \`Сначала изучаю HTML.\`.
3. \`p\` с текстом \`Затем перехожу к CSS.\`.

Одного видимого заголовка недостаточно: проверяется также исходный код структуры документа. Файл \`style.css\` в этой практике заполнять не требуется.`,
    test_js: COMMON_TEST_JS + String.raw`
checkNesting();

ok(/^\s*<!doctype\s+html\s*>\s*<html\b[^>]*>\s*<head\b[^>]*>[\s\S]*?<\/head\s*>\s*<body\b[^>]*>[\s\S]*?<\/body\s*>\s*<\/html\s*>\s*$/i.test(source),
  'Явно запишите <!DOCTYPE html>, html, head и body в правильном порядке, включая закрывающие теги');
ok(document.doctype?.name === 'html' && !document.doctype.publicId && !document.doctype.systemId,
  'Нужно объявление <!DOCTYPE html>');
check(document.documentElement, ['html', {lang:'ru'}, [
  ['head', {}, [
    ['meta', {charset:'UTF-8'}, ''],
    ['meta', {name:'viewport', content:'width=device-width, initial-scale=1.0'}, ''],
    ['title', {}, 'Мой учебный план']
  ]],
  ['body', {}, [
    ['h1', {}, 'Мой учебный план'],
    ['p', {}, 'Сначала изучаю HTML.'],
    ['p', {}, 'Затем перехожу к CSS.']
  ]]
]], 'html');
`,
  }, ""),

  withFiles({
    title: "Блоки и фрагменты строки",
    theoryTitle: "Блочные и строчные элементы",
    description: "Разметьте абзацы и выделите фрагменты текста строчными элементами.",
    mdx_source: `Непосредственно внутри \`body\` готового документа разместите по порядку:

1. Заголовок \`h1\` с текстом \`Учимся вместе\`.
2. Абзац \`p\` с \`id="intro"\`.
3. Абзац \`p\` с \`id="result"\`.

Полный текст первого абзаца: \`Изучайте HTML каждый день.\`.

Внутри первого абзаца:
- слово \`HTML\` оберните в \`strong\`;
- слова \`каждый день\` оберните в \`em\`;
- остальной текст оставьте непосредственно внутри \`p\`.

Полный текст второго абзаца: \`Результат: готовая страница.\`.

Внутри второго абзаца слова \`готовая страница\` оберните в \`span\` с классом \`result\`. Остальной текст оставьте непосредственно внутри \`p\`.

Сохраните стандартное поведение элементов: заголовок и абзацы — блочные, \`strong\`, \`em\` и \`span\` — строчные.`,
    test_js: COMMON_TEST_JS + String.raw`
check(document.body, ['body', {}, [
  ['h1', {}, 'Учимся вместе'],
  ['p', {id:'intro'}, [['strong', {}, 'HTML'], ['em', {}, 'каждый день']], 'Изучайте HTML каждый день.'],
  ['p', {id:'result'}, [['span', {class:['result']}, 'готовая страница']], 'Результат: готовая страница.']
]]);
for (const el of document.querySelectorAll('body > h1, body > p')) {
  ok(getComputedStyle(el).display === 'block', 'Заголовок и абзацы должны оставаться блочными');
}
for (const el of document.querySelectorAll('strong,em,span')) {
  ok(getComputedStyle(el).display === 'inline', 'strong, em и span должны оставаться строчными');
}
`,
  }),

  withFiles({
    title: "Памятка начинающего верстальщика",
    theoryTitle: "Текст, списки и цитаты",
    description: "Оформите памятку с заголовками, списками, цитатой и примером кода.",
    mdx_source: `Создайте памятку внутри \`body\` готового документа.

Непосредственно внутри \`body\` разместите элементы в следующем порядке:

1. \`h1\` с текстом \`Памятка верстальщика\`.
2. \`h2\` с текстом \`Что понадобится\`.
3. Маркированный список \`ul\` с тремя пунктами \`li\`: \`Редактор кода\`, \`Браузер\`, \`Методичка\`.
4. \`h2\` с текстом \`Порядок работы\`.
5. Нумерованный список \`ol\` с тремя пунктами \`li\`: \`Создать файл\`, \`Написать разметку\`, \`Открыть страницу\`.
6. Смысловой разделитель \`hr\`.
7. Блок цитаты \`blockquote\`. Внутри него — один \`p\` с текстом \`Хорошая разметка передаёт смысл.\`.
8. Абзац \`p\`. Внутри него — один \`cite\` с текстом \`Учебная памятка\`.
9. Абзац с полным текстом \`Совет: Проверяйте вложенность.\`. Только слова \`Проверяйте вложенность\` оберните в \`q\`. Кавычки вручную не добавляйте.
10. Блок \`pre\`. Внутри него — один \`code\`, показывающий текст \`<p>Привет!</p>\`.

В примере кода теги должны отображаться как текст. Используйте \`&lt;\` и \`&gt;\`, чтобы браузер не создал из них настоящий абзац.`,
    test_js: COMMON_TEST_JS + String.raw`
check(document.body, ['body', {}, [
  ['h1', {}, 'Памятка верстальщика'],
  ['h2', {}, 'Что понадобится'],
  ['ul', {}, [['li', {}, 'Редактор кода'], ['li', {}, 'Браузер'], ['li', {}, 'Методичка']]],
  ['h2', {}, 'Порядок работы'],
  ['ol', {}, [['li', {}, 'Создать файл'], ['li', {}, 'Написать разметку'], ['li', {}, 'Открыть страницу']]],
  ['hr', {}, ''],
  ['blockquote', {}, [['p', {}, 'Хорошая разметка передаёт смысл.']]],
  ['p', {}, [['cite', {}, 'Учебная памятка']]],
  ['p', {}, [['q', {}, 'Проверяйте вложенность']], 'Совет: Проверяйте вложенность.'],
  ['pre', {}, [['code', {}, '<p>Привет!</p>']]]
]]);
`,
  }),

  withFiles({
    title: "Каталог команд",
    theoryTitle: "Универсальные контейнеры",
    description: "Сгруппируйте карточки команд с помощью div и выделите данные через span.",
    mdx_source: `Внутри \`body\` создайте один контейнер \`div\` с \`id="teams"\` и классом \`team-list\`.

Непосредственно внутри него разместите две карточки \`div\` с общим классом \`team-card\`:

| Порядок | id | Название | Проект | Город |
| --- | --- | --- | --- | --- |
| 1 | team-pixel | Пиксель | Сайт лагеря | Новосибирск |
| 2 | team-code | Код | Сайт клуба | Томск |

Каждая карточка содержит по порядку:

1. \`h2\` с названием команды.
2. \`p\` с текстом \`Проект: НАЗВАНИЕ ПРОЕКТА.\`.
3. \`p\` с текстом \`Город: НАЗВАНИЕ ГОРОДА.\`.

В абзаце о проекте оберните только название проекта в \`span\` с классом \`project\`.

В абзаце о городе оберните только название города в \`span\` с классом \`city\`.

Например, полный текст абзаца первой карточки: \`Проект: Сайт лагеря.\`. Двоеточие, пробел и завершающая точка находятся вне \`span\`.`,
    test_js: COMMON_TEST_JS + String.raw`
const card = (id, name, project, city) => ['div', {id, class:['team-card']}, [
  ['h2', {}, name],
  ['p', {}, [['span', {class:['project']}, project]], 'Проект: ' + project + '.'],
  ['p', {}, [['span', {class:['city']}, city]], 'Город: ' + city + '.']
]];
check(document.body, ['body', {}, [
  ['div', {id:'teams', class:['team-list']}, [
    card('team-pixel', 'Пиксель', 'Сайт лагеря', 'Новосибирск'),
    card('team-code', 'Код', 'Сайт клуба', 'Томск')
  ]]
]]);
`,
  }),

  withFiles({
    title: "Новости лагеря",
    theoryTitle: "Семантические теги",
    description: "Постройте страницу новостей с семантическими разделами и навигацией.",
    mdx_source: `Создайте страницу новостей внутри \`body\`.

Непосредственно в \`body\` должны находиться три элемента по порядку: \`header\`, \`main\`, \`footer\`.

Непосредственно внутри \`header\` разместите:

1. \`p\` с текстом \`WebCamp\`.
2. \`nav\` с атрибутом \`aria-label="Главное меню"\`.

Внутри \`nav\` создайте один \`ul\` с двумя \`li\`. Каждый пункт содержит одну ссылку:

| Текст ссылки | href |
| --- | --- |
| Новости | #news |
| Контакты | #contacts |

Непосредственно внутри \`main\` разместите:

1. \`h1\` с текстом \`Новости лагеря\`.
2. \`section\` с \`id="news"\`.
3. \`aside\`.

Внутри \`section\` разместите:

1. \`h2\` с текстом \`Новости\`.
2. Первый \`article\`: \`h3\` с текстом \`Начало курса\`, затем \`p\` с текстом \`Сегодня изучаем HTML.\`.
3. Второй \`article\`: \`h3\` с текстом \`Работа в командах\`, затем \`p\` с текстом \`Завтра создаём проект.\`.

Внутри \`aside\` разместите \`h2\` с текстом \`Подсказка\`, затем \`p\` с текстом \`Сохраняйте работу после каждого шага.\`.

У \`footer\` укажите \`id="contacts"\`. Внутри него разместите один \`p\` с текстом \`mail@example.com\`.`,
    test_js: COMMON_TEST_JS + String.raw`
check(document.body, ['body', {}, [
  ['header', {}, [
    ['p', {}, 'WebCamp'],
    ['nav', {'aria-label':'Главное меню'}, [
      ['ul', {}, [
        ['li', {}, [['a', {href:'#news'}, 'Новости']]],
        ['li', {}, [['a', {href:'#contacts'}, 'Контакты']]]
      ]]
    ]]
  ]],
  ['main', {}, [
    ['h1', {}, 'Новости лагеря'],
    ['section', {id:'news'}, [
      ['h2', {}, 'Новости'],
      ['article', {}, [['h3', {}, 'Начало курса'], ['p', {}, 'Сегодня изучаем HTML.']]],
      ['article', {}, [['h3', {}, 'Работа в командах'], ['p', {}, 'Завтра создаём проект.']]]
    ]],
    ['aside', {}, [['h2', {}, 'Подсказка'], ['p', {}, 'Сохраняйте работу после каждого шага.']]]
  ]],
  ['footer', {id:'contacts'}, [['p', {}, 'mail@example.com']]]
]]);
`,
  }),

  withFiles({
    title: "Переходы и действия",
    theoryTitle: "Ссылки и кнопки",
    description: "Добавьте ссылки разных типов и кнопки с явным типом.",
    mdx_source: `Непосредственно внутри \`body\` разместите по порядку:

1. \`h1\` с текстом \`Связаться с курсом\`.
2. \`nav\` с атрибутом \`aria-label="Полезные ссылки"\`.
3. Кнопку \`button\` с типом \`button\` и текстом \`Показать подсказку\`.
4. Кнопку \`button\` с типом \`button\`, атрибутом \`disabled\` и текстом \`Следующий шаг\`.
5. \`footer\` с \`id="contacts"\`.

Внутри \`nav\` разместите четыре ссылки \`a\` непосредственно, без списка:

| Порядок | Текст | href | Дополнительные атрибуты |
| --- | --- | --- | --- |
| 1 | Программа | course.html | Нет |
| 2 | Справочник MDN | https://developer.mozilla.org/ | target="_blank", rel="noopener noreferrer" |
| 3 | Контакты | #contacts | Нет |
| 4 | Скачать программу | program.pdf | download |

Внутри \`footer\` разместите два абзаца \`p\`. Каждый абзац содержит одну ссылку:

1. \`Написать нам\` с \`href="mailto:mail@example.com"\`.
2. \`Позвонить\` с \`href="tel:+79991234567"\`.

Файлы \`course.html\` и \`program.pdf\` создавать не нужно. Проверяется разметка ссылок. Для обычной кнопки обработчик JavaScript не требуется.`,
    test_js: COMMON_TEST_JS + String.raw`
check(document.body, ['body', {}, [
  ['h1', {}, 'Связаться с курсом'],
  ['nav', {'aria-label':'Полезные ссылки'}, [
    ['a', {href:'course.html'}, 'Программа'],
    ['a', {href:'https://developer.mozilla.org/', target:'_blank', rel:['noopener','noreferrer']}, 'Справочник MDN'],
    ['a', {href:'#contacts'}, 'Контакты'],
    ['a', {href:'program.pdf', download:true}, 'Скачать программу']
  ]],
  ['button', {type:'button'}, 'Показать подсказку'],
  ['button', {type:'button', disabled:true}, 'Следующий шаг'],
  ['footer', {id:'contacts'}, [
    ['p', {}, [['a', {href:'mailto:mail@example.com'}, 'Написать нам']]],
    ['p', {}, [['a', {href:'tel:+79991234567'}, 'Позвонить']]]
  ]]
]]);
`,
  }),

  withFiles({
    title: "Медиатека без изображений",
    theoryTitle: "Изображения, аудио и видео",
    description: "Разметьте аудио и видео с источниками, субтитрами и подписями.",
    mdx_source: `Создайте медиатеку внутри \`body\`. Изображения и заставки видео не используйте. Автоматическое воспроизведение не включайте.

Непосредственно внутри \`body\` разместите по порядку:

1. \`h1\` с текстом \`Медиатека курса\`.
2. Первый \`figure\` — для аудио.
3. Второй \`figure\` — для видео.

Первый \`figure\` содержит \`audio\`, затем \`figcaption\`.

У \`audio\` укажите \`controls\` и \`preload="none"\`. Внутри разместите два \`source\` в следующем порядке:

| src | type |
| --- | --- |
| intro.ogg | audio/ogg |
| intro.mp3 | audio/mpeg |

Также внутри \`audio\` напишите резервный текст: \`Ваш браузер не поддерживает аудио.\`.

Текст первой подписи: \`Знакомство с курсом\`.

Второй \`figure\` содержит \`video\`, затем \`figcaption\`.

У \`video\` укажите \`controls\`, \`preload="none"\`, \`width="640"\` и \`height="360"\`.

Внутри \`video\` разместите по порядку:

1. \`source\` с \`src="lesson.webm"\` и \`type="video/webm"\`.
2. \`source\` с \`src="lesson.mp4"\` и \`type="video/mp4"\`.
3. \`track\` со следующими атрибутами:
   - \`src="lesson-ru.vtt"\`;
   - \`kind="subtitles"\`;
   - \`srclang="ru"\`;
   - \`label="Русский"\`;
   - \`default\`.

Также внутри \`video\` напишите резервный текст: \`Ваш браузер не поддерживает видео.\`.

Текст второй подписи: \`Первый урок с русскими субтитрами\`.

Атрибуты \`src\` у самих \`audio\` и \`video\` не добавляйте: источники задаются через \`source\`.

Медиафайлы создавать или загружать не нужно. В этой практике проверяются структура и атрибуты, воспроизведение не проверяется.`,
    test_js: COMMON_TEST_JS + String.raw`
check(document.body, ['body', {}, [
  ['h1', {}, 'Медиатека курса'],
  ['figure', {}, [
    ['audio', {controls:true, preload:'none', src:false, autoplay:false}, [
      ['source', {src:'intro.ogg', type:'audio/ogg'}, ''],
      ['source', {src:'intro.mp3', type:'audio/mpeg'}, '']
    ], 'Ваш браузер не поддерживает аудио.'],
    ['figcaption', {}, 'Знакомство с курсом']
  ]],
  ['figure', {}, [
    ['video', {controls:true, preload:'none', width:'640', height:'360', src:false, poster:false, autoplay:false}, [
      ['source', {src:'lesson.webm', type:'video/webm'}, ''],
      ['source', {src:'lesson.mp4', type:'video/mp4'}, ''],
      ['track', {src:'lesson-ru.vtt', kind:'subtitles', srclang:'ru', label:'Русский', default:true}, '']
    ], 'Ваш браузер не поддерживает видео.'],
    ['figcaption', {}, 'Первый урок с русскими субтитрами']
  ]]
]]);
`,
  }),

  withFiles({
    title: "Расписание в таблице",
    theoryTitle: "Таблицы",
    description: "Создайте таблицу с заголовками, итогом и объединёнными ячейками.",
    mdx_source: `Внутри \`body\` создайте одну таблицу \`table\`.

Её непосредственные дочерние элементы по порядку: \`caption\`, \`thead\`, \`tbody\`, \`tfoot\`.

Текст \`caption\`: \`Расписание занятий\`.

Внутри \`thead\` создайте одну строку \`tr\` с тремя заголовочными ячейками \`th\`. У каждой укажите \`scope="col"\`.

Тексты ячеек по порядку: \`Тема\`, \`Аудитория\`, \`Часы\`.

Внутри \`tbody\` создайте две строки.

Первая строка содержит:

1. \`th\` с \`scope="row"\` и текстом \`HTML\`.
2. \`td\` с \`rowspan="2"\` и текстом \`Аудитория 1\`.
3. \`td\` с текстом \`2\`.

Вторая строка содержит только две ячейки:

1. \`th\` с \`scope="row"\` и текстом \`CSS\`.
2. \`td\` с текстом \`3\`.

Ячейка аудитории уже занимает обе строки, поэтому во второй строке повторять её не нужно.

Внутри \`tfoot\` создайте одну строку:

1. \`th\` с \`scope="row"\`, \`colspan="2"\` и текстом \`Всего часов\`.
2. \`td\` с текстом \`5\`.`,
    test_js: COMMON_TEST_JS + String.raw`
check(document.body, ['body', {}, [
  ['table', {}, [
    ['caption', {}, 'Расписание занятий'],
    ['thead', {}, [['tr', {}, [
      ['th', {scope:'col'}, 'Тема'], ['th', {scope:'col'}, 'Аудитория'], ['th', {scope:'col'}, 'Часы']
    ]]]],
    ['tbody', {}, [
      ['tr', {}, [['th', {scope:'row'}, 'HTML'], ['td', {rowspan:'2'}, 'Аудитория 1'], ['td', {}, '2']]],
      ['tr', {}, [['th', {scope:'row'}, 'CSS'], ['td', {}, '3']]]
    ]],
    ['tfoot', {}, [['tr', {}, [['th', {scope:'row', colspan:'2'}, 'Всего часов'], ['td', {}, '5']]]]]
  ]]
]]);
`,
  }),

  withFiles({
    title: "Форма регистрации на курс",
    theoryTitle: "Формы и элементы управления",
    description: "Соберите доступную форму с ограничениями, выбором формата и согласием.",
    mdx_source: `Внутри \`body\` создайте одну форму \`form\` с атрибутами:

- \`id="registration"\`;
- \`action="/registration"\`;
- \`method="post"\`.

Первым элементом формы должен быть \`h1\` с текстом \`Регистрация на курс\`.

Затем разместите три пары: отдельный \`label\`, сразу после него соответствующий \`input\`.

| Текст label | for и id поля | name | type | Остальные атрибуты |
| --- | --- | --- | --- | --- |
| Имя | name | name | text | minlength="2", maxlength="30", required |
| Электронная почта | email | email | email | required |
| Возраст | age | age | number | min="14", max="16", step="1", required |

Начальные значения этих полей должны быть пустыми. Атрибут \`value\` им не задавайте.

После поля возраста добавьте:

1. \`label\` с \`for="city"\` и текстом \`Город\`.
2. \`select\` с \`id="city"\`, \`name="city"\` и \`required\`.

Внутри \`select\` разместите три \`option\`:

| Порядок | Текст | value | Дополнительные атрибуты |
| --- | --- | --- | --- |
| 1 | Выберите город | пустая строка | selected, disabled |
| 2 | Новосибирск | novosibirsk | Нет |
| 3 | Томск | tomsk | Нет |

После списка города создайте \`fieldset\`. Его содержимое по порядку:

1. \`legend\` с текстом \`Формат участия\`.
2. \`label\` с \`for="online"\` и текстом \`Онлайн\`.
3. \`input\` с \`id="online"\`, \`type="radio"\`, \`name="format"\`, \`value="online"\`, \`checked\` и \`required\`.
4. \`label\` с \`for="onsite"\` и текстом \`Очно\`.
5. \`input\` с \`id="onsite"\`, \`type="radio"\`, \`name="format"\`, \`value="onsite"\` и \`required\`.

После \`fieldset\` разместите:

1. \`label\` с \`for="comment"\` и текстом \`Комментарий\`.
2. Пустой \`textarea\` с \`id="comment"\`, \`name="comment"\`, \`rows="4"\` и \`maxlength="200"\`.
3. \`label\` с \`for="agreement"\` и текстом \`Я согласен с правилами участия\`.
4. \`input\` с \`id="agreement"\`, \`name="agreement"\`, \`type="checkbox"\`, \`value="yes"\` и \`required\`.
5. \`button\` с \`type="submit"\` и текстом \`Зарегистрироваться\`.
6. \`button\` с \`type="reset"\` и текстом \`Очистить\`.

Согласие первоначально не выбрано. Комментарий необязательный и первоначально пустой: между тегами \`textarea\` не должно быть даже пробелов или переносов.

Все перечисленные элементы, кроме содержимого \`select\` и \`fieldset\`, размещаются непосредственно внутри формы. Поля не вкладываются в \`label\`.

Поля должны быть доступны для ввода. Нельзя отключать встроенную проверку формы через \`novalidate\`. Обработчик отправки писать не нужно: проверка не отправляет данные на сервер.`,
    test_js: COMMON_TEST_JS + String.raw`
check(document.body, ['body', {}, [
  ['form', {id:'registration', action:'/registration', method:'post'}, [
    ['h1', {}, 'Регистрация на курс'],
    ['label', {for:'name'}, 'Имя'],
    ['input', {id:'name', name:'name', type:'text', minlength:'2', maxlength:'30', required:true}, ''],
    ['label', {for:'email'}, 'Электронная почта'],
    ['input', {id:'email', name:'email', type:'email', required:true}, ''],
    ['label', {for:'age'}, 'Возраст'],
    ['input', {id:'age', name:'age', type:'number', min:'14', max:'16', step:'1', required:true}, ''],
    ['label', {for:'city'}, 'Город'],
    ['select', {id:'city', name:'city', required:true}, [
      ['option', {value:'', selected:true, disabled:true}, 'Выберите город'],
      ['option', {value:'novosibirsk'}, 'Новосибирск'],
      ['option', {value:'tomsk'}, 'Томск']
    ]],
    ['fieldset', {}, [
      ['legend', {}, 'Формат участия'],
      ['label', {for:'online'}, 'Онлайн'],
      ['input', {id:'online', type:'radio', name:'format', value:'online', checked:true, required:true}, ''],
      ['label', {for:'onsite'}, 'Очно'],
      ['input', {id:'onsite', type:'radio', name:'format', value:'onsite', required:true}, '']
    ]],
    ['label', {for:'comment'}, 'Комментарий'],
    ['textarea', {id:'comment', name:'comment', rows:'4', maxlength:'200'}, ''],
    ['label', {for:'agreement'}, 'Я согласен с правилами участия'],
    ['input', {id:'agreement', name:'agreement', type:'checkbox', value:'yes', required:true}, ''],
    ['button', {type:'submit'}, 'Зарегистрироваться'],
    ['button', {type:'reset'}, 'Очистить']
  ]]
]]);
const form = document.querySelector('form');
const field = id => document.getElementById(id);
ok(!form.noValidate, 'Не отключайте встроенную проверку формы');
ok(!field('city').multiple, 'Город выбирается одним значением');
for (const id of ['name', 'email', 'age']) {
  ok(!field(id).hasAttribute('value') && field(id).value === '', 'Начальное значение поля ' + id + ' должно быть пустым');
}
try {
  ok(!form.checkValidity(), 'Пустая форма не должна проходить проверку');
  field('name').value = 'Анна';
  field('email').value = 'anna@example.org';
  field('age').value = '15';
  field('city').value = 'novosibirsk';
  field('agreement').checked = true;
  ok(form.checkValidity(), 'Корректно заполненная форма должна быть валидной');
  const expected = {name:'Анна', email:'anna@example.org', age:'15', city:'novosibirsk', format:'online', comment:'', agreement:'yes'};
  const entries = [...new FormData(form).entries()];
  ok(entries.length === 7 && entries.every(([key, value]) => Object.hasOwn(expected, key) && expected[key] === value),
    'Проверьте name, value и доступность полей при отправке');
  for (const [id, badValues, goodValue] of [
    ['name', [''], 'Анна'], ['email', ['', 'не-почта'], 'anna@example.org'],
    ['age', ['', '13', '17', '14.5'], '15'], ['city', [''], 'novosibirsk']
  ]) {
    for (const value of badValues) {
      field(id).value = value;
      ok(!form.checkValidity(), 'Поле ' + id + ' должно отклонять значение «' + value + '»');
    }
    field(id).value = goodValue;
  }
  field('agreement').checked = false;
  ok(!form.checkValidity(), 'Без согласия форма должна быть невалидной');
  field('agreement').checked = true;
  field('online').checked = false;
  field('onsite').checked = false;
  ok(!form.checkValidity(), 'Нужно выбрать формат участия');
  field('onsite').checked = true;
  ok(form.checkValidity() && new FormData(form).get('format') === 'onsite', 'Форматы должны переключаться одной группой');
} finally {
  form.reset();
}
ok(field('online').checked && !field('onsite').checked && !field('agreement').checked && field('city').value === '',
  'Проверьте начальные значения checked и selected');
`,
  }),

  withFiles({
    title: "SVG-диаграмма результатов",
    theoryTitle: "Векторная графика SVG",
    description: "Создайте встроенный SVG по координатам и добавьте доступное описание.",
    mdx_source: `Создайте встроенный SVG по текстовому описанию. Готовые изображения и внешние SVG-файлы не подключайте.

Непосредственно внутри \`body\` разместите:

1. \`h1\` с текстом \`Результаты команды\`.
2. \`figure\`.

Внутри \`figure\` разместите \`svg\`, затем \`figcaption\`.

У \`svg\` укажите:

- \`viewBox="0 0 240 160"\`;
- \`width="240"\`;
- \`height="160"\`;
- \`role="img"\`;
- \`aria-labelledby="chart-title chart-description"\`.

Непосредственно внутри \`svg\` разместите по порядку:

1. \`title\` с \`id="chart-title"\` и текстом \`Результаты команды\`.
2. \`desc\` с \`id="chart-description"\` и текстом \`Три столбца высотой 40, 80 и 120 условных единиц.\`.
3. Группу \`g\` с \`fill="#2563eb"\`.
4. Линию \`line\`.

Внутри \`g\` создайте три прямоугольника \`rect\`:

| Порядок | x | y | width | height |
| --- | --- | --- | --- | --- |
| 1 | 30 | 100 | 40 | 40 |
| 2 | 100 | 60 | 40 | 80 |
| 3 | 170 | 20 | 40 | 120 |

Заливку прямоугольников задайте только группе \`g\`, чтобы фигуры её наследовали.

У \`line\` укажите:

- \`x1="20"\`;
- \`y1="140"\`;
- \`x2="220"\`;
- \`y2="140"\`;
- \`stroke="#111827"\`;
- \`stroke-width="2"\`.

Текст \`figcaption\`: \`Баллы за три этапа\`.

Для встроенного SVG атрибут \`xmlns\` добавлять не нужно.`,
    test_js: COMMON_TEST_JS + String.raw`
check(document.body, ['body', {}, [
  ['h1', {}, 'Результаты команды'],
  ['figure', {}, [
    ['svg', {viewBox:'0 0 240 160', width:'240', height:'160', role:'img', 'aria-labelledby':['chart-title','chart-description']}, [
      ['title', {id:'chart-title'}, 'Результаты команды'],
      ['desc', {id:'chart-description'}, 'Три столбца высотой 40, 80 и 120 условных единиц.'],
      ['g', {fill:'#2563eb'}, [
        ['rect', {x:'30', y:'100', width:'40', height:'40'}, ''],
        ['rect', {x:'100', y:'60', width:'40', height:'80'}, ''],
        ['rect', {x:'170', y:'20', width:'40', height:'120'}, '']
      ]],
      ['line', {x1:'20', y1:'140', x2:'220', y2:'140', stroke:'#111827', 'stroke-width':'2'}, '']
    ]],
    ['figcaption', {}, 'Баллы за три этапа']
  ]]
]]);
for (const el of document.querySelectorAll('svg, svg *')) {
  ok(el.namespaceURI === 'http://www.w3.org/2000/svg', 'Фигуры должны находиться в пространстве имён SVG');
}
for (const el of document.querySelectorAll('svg rect')) {
  ok(getComputedStyle(el).fill === 'rgb(37, 99, 235)', 'Столбцы должны наследовать синюю заливку группы');
}

for (const el of document.querySelectorAll('svg rect')) {
  ok(!el.hasAttribute('fill') && el.style.fill === '', 'Задайте заливку группе g, а не отдельным rect');
}
`,
  }),

  withFiles({
    title: "Первая веб-страница",
    theoryTitle: "Базовая теория WEB",
    description: "Добавьте содержимое в готовый документ и подключите таблицу стилей.",
    mdx_source: `В готовом документе уже подключён файл style.css. Добавьте в body один заголовок первого уровня с текстом Мой первый сайт и один абзац с текстом HTML задаёт структуру страницы, а CSS оформляет её.

Не удаляйте метаданные документа и ссылку на таблицу стилей.`,
    test_js: COMMON_TEST_JS + String.raw`
checkNesting();
ok(document.querySelectorAll('h1').length === 1, 'Добавьте один главный заголовок h1');
ok(norm(document.querySelector('h1')?.textContent) === 'Мой первый сайт', 'Проверьте текст заголовка');
ok(document.querySelectorAll('body > p').length === 1, 'Добавьте один абзац непосредственно в body');
ok(norm(document.querySelector('body > p')?.textContent) === 'HTML задаёт структуру страницы, а CSS оформляет её.', 'Проверьте текст абзаца');
ok(document.querySelector('head link[rel="stylesheet"][href="style.css"]'), 'Подключите style.css в head');
`,
  }),

  cssPractice({
    title: "Подключи первый стиль",
    theoryTitle: "Синтаксис, селектор и подключение к HTML",
    description: "Подключите таблицу стилей и оформите элемент CSS-правилом.",
    mdx_source: `В файле style.css создайте правило для класса .intro: задайте тексту синий цвет #1769aa.

Ссылка на style.css уже находится в head. Не добавляйте встроенные стили в HTML.`,
    body: `<h1 class="intro">Стартуем с CSS</h1>`,
    test: String.raw`
const css = cssFiles[0].code;
ok(/\.intro\s*\{[^}]*color\s*:\s*#1769aa\s*;?[^}]*\}/i.test(css), 'Добавьте правило .intro с цветом #1769aa');
ok(getComputedStyle(document.querySelector('.intro')).color === 'rgb(23, 105, 170)', 'Проверьте подключение style.css и цвет заголовка');
`,
  }),

  cssPractice({
    title: "Разбери каскад",
    theoryTitle: "Каскадность, специфичность и наследование",
    description: "Сравните правила по классу и идентификатору и проверьте итоговый стиль.",
    mdx_source: `В style.css последовательно задайте для .notice синий цвет #1769aa, а для #notice оранжевый цвет #c2410c.

У элемента одновременно есть класс notice и идентификатор notice. Несмотря на порядок правил, более специфичное правило по идентификатору задаёт итоговый цвет.`,
    body: `<p id="notice" class="notice">Важное сообщение</p>`,
    test: String.raw`
const css = cssFiles[0].code;
ok(/\.notice\s*\{[^}]*color\s*:\s*#1769aa\s*;?[^}]*\}/i.test(css), 'Добавьте правило класса .notice');
ok(/#notice\s*\{[^}]*color\s*:\s*#c2410c\s*;?[^}]*\}/i.test(css), 'Добавьте более специфичное правило #notice');
ok(getComputedStyle(document.querySelector('#notice')).color === 'rgb(194, 65, 12)', 'Итоговый цвет должен задаваться правилом #notice');
`,
  }),

  cssPractice({
    title: "Оформи карточку по БЭМ",
    theoryTitle: "Нейминг классов и методология БЭМ",
    description: "Используйте блок, элемент и модификатор в именах классов.",
    mdx_source: `В HTML уже размечена карточка с блоком course-card, элементом course-card__title и модификатором course-card--featured.

В style.css добавьте правила для блока и заголовка. Модификатор выделите рамкой слева: 4px solid #2563eb. Сохраните имена классов в БЭМ-формате.`,
    body: `<article class="course-card course-card--featured"><h2 class="course-card__title">Основы верстки</h2></article>`,
    test: String.raw`
const css = cssFiles[0].code;
ok(/\.course-card\s*\{/.test(css), 'Добавьте правило блока .course-card');
ok(/\.course-card__title\s*\{/.test(css), 'Добавьте правило элемента .course-card__title');
ok(/\.course-card--featured\s*\{/.test(css), 'Добавьте правило модификатора .course-card--featured');
ok(document.querySelector('.course-card.course-card--featured .course-card__title'), 'Сохраните БЭМ-классы в HTML');
ok(getComputedStyle(document.querySelector('.course-card')).borderLeftWidth === '4px', 'Модификатор должен выделять карточку рамкой 4px');
`,
  }),

  cssPractice({
    title: "Нормализуй базовые стили",
    theoryTitle: "Стили браузеров, обнуление стилей и нормализация",
    description: "Сбросьте стандартные отступы и задайте предсказуемую блочную модель.",
    mdx_source: `В style.css задайте для всех элементов box-sizing: border-box, а для body — margin: 0.

Так размеры элементов будут проще рассчитывать, а у страницы не останется стандартного внешнего отступа браузера.`,
    body: `<main class="page"><h1>Нормализованная страница</h1></main>`,
    test: String.raw`
const css = cssFiles[0].code;
ok(/\*\s*\{[^}]*box-sizing\s*:\s*border-box/i.test(css), 'Задайте box-sizing: border-box для всех элементов');
ok(/body\s*\{[^}]*margin\s*:\s*0(?:\s|;|})/i.test(css), 'Обнулите внешний отступ body');
ok(getComputedStyle(document.querySelector('.page')).boxSizing === 'border-box', 'Проверьте применение box-sizing');
ok(getComputedStyle(document.body).margin === '0px', 'Проверьте, что отступ body равен нулю');
`,
  }),

  cssPractice({
    title: "Подбери размеры в разных единицах",
    theoryTitle: "Единицы измерения",
    description: "Сочетайте относительные и абсолютные CSS-единицы.",
    mdx_source: `Для блока .measure задайте ширину 80%, максимальную ширину 600px и внутренний отступ 1rem.

Сохраните все три единицы: процент зависит от контейнера, пиксели задают верхнее ограничение, а rem рассчитывается от размера шрифта корневого элемента.`,
    body: `<main class="measure">Размеры в CSS</main>`,
    test: String.raw`
const css = cssFiles[0].code;
const rule = css.match(/\.measure\s*\{[^}]*\}/i)?.[0] ?? '';
ok(/width\s*:\s*80%\s*;?/i.test(rule), 'Задайте ширину 80%');
ok(/max-width\s*:\s*600px\s*;?/i.test(rule), 'Задайте максимальную ширину 600px');
ok(/padding\s*:\s*1rem\s*;?/i.test(rule), 'Задайте внутренний отступ 1rem');
ok(getComputedStyle(document.querySelector('.measure')).maxWidth === '600px', 'Проверьте применение max-width');
`,
  }),

  cssPractice({
    title: "Собери блочную модель",
    theoryTitle: "Блочная модель и свойство display",
    description: "Настройте отображение, размеры и отступы блока.",
    mdx_source: `Для .box задайте display: inline-block, ширину 240px, внутренний отступ 16px и внешний отступ 8px.

Проверьте, что элемент сохраняет ширину и при этом располагается как строчно-блочный.`,
    body: `<div class="box">Блочная модель</div>`,
    test: String.raw`
const css = cssFiles[0].code;
const style = getComputedStyle(document.querySelector('.box'));
ok(style.display === 'inline-block', 'Задайте display: inline-block');
ok(style.width === '240px', 'Задайте ширину 240px');
ok(style.padding === '16px', 'Задайте внутренний отступ 16px');
ok(style.margin === '8px', 'Задайте внешний отступ 8px');
`,
  }),

  cssPractice({
    title: "Настрой шрифт страницы",
    theoryTitle: "Шрифты и оформление текста",
    description: "Задайте семейство, размер и межстрочный интервал текста.",
    mdx_source: `Для .article-title задайте шрифт Arial, sans-serif, размер 24px, насыщенность 700 и межстрочный интервал 1.5.

Используйте CSS-свойства текста, не меняя содержимое HTML.`,
    body: `<h1 class="article-title">Заголовок статьи</h1>`,
    test: String.raw`
const css = cssFiles[0].code;
const style = getComputedStyle(document.querySelector('.article-title'));
ok(/\.article-title\s*\{[^}]*font-family\s*:\s*Arial\s*,\s*sans-serif/i.test(css), 'Задайте семейство Arial, sans-serif');
ok(style.fontSize === '24px', 'Задайте размер шрифта 24px');
ok(style.fontWeight === '700', 'Задайте насыщенность 700');
ok(style.lineHeight === '36px' || style.lineHeight === '1.5', 'Задайте межстрочный интервал 1.5');
`,
  }),

  cssPractice({
    title: "Добавь фон для приветствия",
    theoryTitle: "Фон",
    description: "Настройте цвет и градиент фона блока.",
    mdx_source: `Для блока .hero задайте цвет фона #0d47a1 и линейный градиент, который начинается с того же цвета.

Добавьте внутренние отступы, чтобы текст не прижимался к краям.`,
    body: `<section class="hero"><h1>Добро пожаловать</h1></section>`,
    test: String.raw`
const css = cssFiles[0].code;
const style = getComputedStyle(document.querySelector('.hero'));
ok(/background-color\s*:\s*#0d47a1/i.test(css), 'Задайте background-color: #0d47a1');
ok(/linear-gradient\s*\(/i.test(css), 'Добавьте линейный градиент');
ok(style.backgroundColor === 'rgb(13, 71, 161)', 'Проверьте цвет фона блока');
ok(style.backgroundImage !== 'none', 'Проверьте применение градиента');
`,
  }),

  cssPractice({
    title: "Оформи рамку карточки",
    theoryTitle: "Рамки",
    description: "Настройте толщину, стиль, цвет рамки и скругление углов.",
    mdx_source: `Для .card-border задайте рамку 2px solid #2563eb и скругление углов 12px.

Проверьте все части рамки отдельно в вычисленных стилях.`,
    body: `<article class="card-border">Карточка с рамкой</article>`,
    test: String.raw`
const style = getComputedStyle(document.querySelector('.card-border'));
ok(style.borderTopWidth === '2px', 'Толщина рамки должна быть 2px');
ok(style.borderTopStyle === 'solid', 'Задайте сплошной стиль рамки');
ok(style.borderTopColor === 'rgb(37, 99, 235)', 'Проверьте цвет рамки #2563eb');
ok(style.borderTopLeftRadius === '12px', 'Скруглите углы на 12px');
`,
  }),

  cssPractice({
    title: "Выровняй панель через Flexbox",
    theoryTitle: "Flexbox",
    description: "Расположите элементы в строку и распределите свободное место.",
    mdx_source: `Для .toolbar включите Flexbox, распределите элементы через justify-content: space-between, выровняйте по центру и задайте промежуток 16px.

Не меняйте порядок элементов в HTML.`,
    body: `<nav class="toolbar"><span>Курсы</span><span>Профиль</span></nav>`,
    test: String.raw`
const style = getComputedStyle(document.querySelector('.toolbar'));
ok(style.display === 'flex', 'Включите display: flex');
ok(style.justifyContent === 'space-between', 'Распределите элементы через space-between');
ok(style.alignItems === 'center', 'Выровняйте элементы по центру');
ok(style.columnGap === '16px' || style.gap === '16px', 'Задайте промежуток 16px');
`,
  }),

  cssPractice({
    title: "Создай сетку карточек",
    theoryTitle: "Grid",
    description: "Разместите карточки в трёхколоночной CSS-сетке.",
    mdx_source: `Для .gallery используйте CSS Grid с тремя равными колонками и промежутком 12px.

В HTML уже находятся три карточки. Настройте сетку только через CSS.`,
    body: `<div class="gallery"><article>HTML</article><article>CSS</article><article>VS Code</article></div>`,
    test: String.raw`
const css = cssFiles[0].code;
const style = getComputedStyle(document.querySelector('.gallery'));
ok(/\.gallery\s*\{[^}]*display\s*:\s*grid/i.test(css), 'Включите CSS Grid');
ok(/grid-template-columns\s*:\s*repeat\(\s*3\s*,\s*1fr\s*\)/i.test(css), 'Задайте три равные колонки');
ok(style.display === 'grid', 'Проверьте применение display: grid');
ok(style.columnGap === '12px' || style.gap === '12px', 'Задайте промежуток 12px');
ok(document.querySelectorAll('.gallery > article').length === 3, 'В сетке должны остаться три карточки');
`,
  }),

  cssPractice({
    title: "Поставь метку в угол карточки",
    theoryTitle: "Позиционирование элементов",
    description: "Создайте систему координат карточки и закрепите метку в углу.",
    mdx_source: `Для .product задайте position: relative. Для метки .badge внутри карточки задайте position: absolute, отступы сверху и справа по 8px.

Метка должна позиционироваться относительно карточки.`,
    body: `<article class="product"><h2>Набор для верстки</h2><span class="badge">Новинка</span></article>`,
    test: String.raw`
const product = getComputedStyle(document.querySelector('.product'));
const badge = getComputedStyle(document.querySelector('.badge'));
ok(product.position === 'relative', 'Родитель карточки должен иметь position: relative');
ok(badge.position === 'absolute', 'Для метки задайте position: absolute');
ok(badge.top === '8px' && badge.right === '8px', 'Расположите метку сверху и справа на 8px');
`,
  }),

  cssPractice({
    title: "Управляй переполнением и видимостью",
    theoryTitle: "Переполнение и видимость",
    description: "Ограничьте прокручиваемую область и скройте вспомогательный элемент.",
    mdx_source: `Для .scroll-area задайте максимальную высоту 72px и включите вертикальную прокрутку через overflow-y: auto.

Элемент .visually-hidden скройте свойством visibility: hidden. Не удаляйте элементы из HTML.`,
    body: `<div class="scroll-area"><p>Первая строка содержимого.</p><p>Вторая строка содержимого.</p><p>Третья строка содержимого.</p></div><span class="visually-hidden">Вспомогательная подпись</span>`,
    test: String.raw`
const area = getComputedStyle(document.querySelector('.scroll-area'));
const hidden = getComputedStyle(document.querySelector('.visually-hidden'));
ok(area.maxHeight === '72px', 'Ограничьте высоту области до 72px');
ok(area.overflowY === 'auto', 'Включите вертикальную прокрутку');
ok(hidden.visibility === 'hidden', 'Скройте подпись через visibility: hidden');
ok(document.querySelector('.visually-hidden'), 'Не удаляйте скрываемый элемент из HTML');
`,
  }),

  withFiles({
    title: "Подготовь редактор к работе",
    theoryTitle: "VS Code",
    description: "Оформите стартовый HTML-файл в редакторе и проверьте структуру проекта.",
    mdx_source: `Откройте index.html в редакторе. Укажите для корневого элемента язык ru, задайте заголовок вкладки Мой проект и добавьте в body заголовок Рабочее место готово и абзац Файлы проекта открыты в VS Code.

Проверьте отступы и подсветку вложенных тегов. Сохраните файл с расширением html.`,
    test_js: COMMON_TEST_JS + String.raw`
checkNesting();
ok(document.documentElement.lang === 'ru', 'Укажите язык страницы ru');
ok(document.title === 'Мой проект', 'Задайте заголовок вкладки Мой проект');
ok(norm(document.querySelector('body > h1')?.textContent) === 'Рабочее место готово', 'Добавьте заголовок страницы');
ok(norm(document.querySelector('body > p')?.textContent) === 'Файлы проекта открыты в VS Code.', 'Добавьте поясняющий абзац');
`,
  }),

  withFiles({
    title: "Создай папку сайта и файлы проекта",
    theoryTitle: "Создание проекта",
    description: "Соберите главную страницу проекта и подключите отдельный CSS-файл.",
    mdx_source: `В index.html создайте главную страницу учебного проекта. В head задайте title Учебный проект и подключите style.css через link.

В body добавьте main с классом project и вложенный заголовок h1 с текстом Первый сайт. Убедитесь, что файлы index.html и style.css находятся на одном уровне проекта.`,
    test_js: COMMON_TEST_JS + String.raw`
checkNesting();
ok(document.title === 'Учебный проект', 'Задайте title Учебный проект');
ok(document.querySelector('head link[rel="stylesheet"][href="style.css"]'), 'Подключите соседний файл style.css');
ok(document.querySelectorAll('body > main.project').length === 1, 'Добавьте main с классом project');
ok(norm(document.querySelector('main.project > h1')?.textContent) === 'Первый сайт', 'Добавьте главный заголовок проекта');
`,
  }),

  withFiles({
    title: "Собери меню с помощью Emmet",
    theoryTitle: "Плагины",
    description: "Используйте расширения и сокращённую запись Emmet для быстрой разметки меню.",
    mdx_source: `Внутри body создайте навигацию nav с классом site-nav. В ней разместите список из трёх ссылок: Курсы ведёт на courses.html, Практика — на practice.html, О проекте — на about.html.

Попробуйте набрать в редакторе сокращение Emmet nav.site-nav>ul>li*3>a и развернуть его, затем заполните тексты и адреса ссылок.`,
    test_js: COMMON_TEST_JS + String.raw`
checkNesting();
const links = [...document.querySelectorAll('nav.site-nav > ul > li > a')];
ok(links.length === 3, 'Создайте три ссылки внутри списка навигации');
ok(links.map(link => norm(link.textContent)).join('|') === 'Курсы|Практика|О проекте', 'Проверьте названия пунктов меню');
ok(links.map(link => link.getAttribute('href')).join('|') === 'courses.html|practice.html|about.html', 'Проверьте адреса ссылок');
`,
  }),

  withFiles(
    {
      title: "Проверь стили через DevTools",
      theoryTitle: "Chrome DevTools",
      description: "Настройте стили карточки и проверьте их в панели Elements браузера.",
      mdx_source: `Для элемента #debug-card в style.css задайте цвет текста #123456, цвет фона #eef2ff и внутренний отступ 16px.

Откройте страницу в браузере, выберите карточку через Inspect и сравните вычисленные значения в панели Styles и Computed.`,
      test_js: COMMON_TEST_JS + String.raw`
const card = getComputedStyle(document.querySelector('#debug-card'));
ok(card.color === 'rgb(18, 52, 86)', 'Проверьте цвет текста #123456');
ok(card.backgroundColor === 'rgb(238, 242, 255)', 'Проверьте цвет фона #eef2ff');
ok(card.padding === '16px', 'Проверьте внутренний отступ 16px');
`,
    },
    `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Проверка страницы</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <article id="debug-card">Проверка в DevTools</article>
</body>
</html>
`,
  ),

  cssPractice({
    title: "Настрой цвета и прозрачность",
    theoryTitle: "Цвета и прозрачность",
    description: "Задайте цвета текста и фона, сравните прозрачность цвета и всего элемента.",
    mdx_source: `В готовом HTML размечена карточка палитры. Добавьте оформление в файл \`style.css\`:

1. Для \`.color-card\` задайте цвет текста \`#123456\` и цвет фона \`#eef2ff\`.
2. Для заголовка \`.color-card__title\` задайте цвет \`hsl(220 100% 40%)\`.
3. Для подписи \`.color-card__label\` задайте цвет текста \`darkred\` и сплошную рамку толщиной \`2px\` того же цвета. Для цвета рамки удобно использовать \`currentColor\`.
4. Для \`.color-card__overlay\` задайте синий фон \`rgb(37 99 235 / 40%)\`. Полупрозрачным должен быть только фон: сохраните цвет текста карточки и не уменьшайте \`opacity\` этого элемента или его родителей.
5. Для \`.color-card__muted\` задайте прозрачный фон \`transparent\` и \`opacity: 0.5\`. Здесь прозрачным станет весь элемент вместе с текстом.

Сохраните структуру, классы и тексты HTML. Не добавляйте встроенные стили или тег \`style\`: используйте подключённый файл \`style.css\`. Равнозначные записи цветов тоже подходят.`,
    body: `<article class="color-card">
  <h1 class="color-card__title">Палитра курса</h1>
  <p class="color-card__label">Цвет рамки совпадает с текстом</p>
  <p class="color-card__overlay">Прозрачный фон, непрозрачный текст</p>
  <p class="color-card__muted">Скоро появится</p>
</article>`,
    test: String.raw`
checkNesting();
check(document.body, ['body', {}, [
  ['article', {class: ['color-card']}, [
    ['h1', {class: ['color-card__title']}, 'Палитра курса'],
    ['p', {class: ['color-card__label']}, 'Цвет рамки совпадает с текстом'],
    ['p', {class: ['color-card__overlay']}, 'Прозрачный фон, непрозрачный текст'],
    ['p', {class: ['color-card__muted']}, 'Скоро появится']
  ]]
]]);
ok(!document.querySelector('style, [style]'), 'Добавьте оформление в style.css, без встроенных стилей');
ok(document.querySelector('head link[rel="stylesheet"][href="style.css"]'), 'Сохраните подключение style.css');
const card = getComputedStyle(document.querySelector('.color-card'));
const title = getComputedStyle(document.querySelector('.color-card__title'));
const label = getComputedStyle(document.querySelector('.color-card__label'));
const overlay = getComputedStyle(document.querySelector('.color-card__overlay'));
const muted = getComputedStyle(document.querySelector('.color-card__muted'));
ok(card.color === 'rgb(18, 52, 86)', 'Задайте карточке цвет текста #123456');
ok(card.backgroundColor === 'rgb(238, 242, 255)', 'Задайте карточке цвет фона #eef2ff');
ok(title.color === 'rgb(0, 68, 204)', 'Задайте заголовку цвет hsl(220 100% 40%)');
ok(label.color === 'rgb(139, 0, 0)', 'Задайте подписи цвет darkred');
for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
  ok(label['border' + side + 'Width'] === '2px' &&
     label['border' + side + 'Style'] === 'solid' &&
     label['border' + side + 'Color'] === label.color,
    'Добавьте подписи сплошную рамку 2px того же цвета, что и текст');
}
ok(overlay.backgroundColor === 'rgba(37, 99, 235, 0.4)', 'Задайте фону rgb(37 99 235 / 40%)');
ok(overlay.color === card.color, 'Сохраните у текста на полупрозрачном фоне цвет карточки');
for (const element of [document.documentElement, document.body,
  document.querySelector('.color-card'), document.querySelector('.color-card__title'),
  document.querySelector('.color-card__label'), document.querySelector('.color-card__overlay')]) {
  ok(getComputedStyle(element).opacity === '1', 'Не уменьшайте opacity карточки и текста на полупрозрачном фоне');
}
ok(muted.backgroundColor === 'rgba(0, 0, 0, 0)', 'Оставьте фон последней подписи прозрачным');
ok(muted.opacity === '0.5', 'Задайте последней подписи opacity: 0.5');
`,
  }),
];
