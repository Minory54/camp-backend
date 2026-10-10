/*
 * Пример тела Practices.test_js для задания:
 * «В index.html создай .card с заголовком h2 и задай .card display: flex».
 *
 * Перед использованием замените требования и сообщения ниже на свои.
 * Для CSS-only практики удалите блоки проверки HTML и DOM.
 * Здесь доступны document и sourceFiles: { filename, language, code }[].
 * Никаких import/export и async: runner выполняет это тело синхронно.
 */

function fail(message) {
  throw new Error(message);
}

function findFile(filename, language) {
  return sourceFiles.find((file) => file.filename === filename && file.language === language);
}

function allStyleRules() {
  const found = [];

  function collect(rules) {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) found.push(rule);
      if ("cssRules" in rule) {
        try {
          collect(rule.cssRules); // например, правила внутри @media
        } catch {
          // Недоступный stylesheet не должен прерывать проверку остальных.
        }
      }
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      collect(sheet.cssRules);
    } catch {
      // Продолжаем проверять остальные файлы.
    }
  }
  return found;
}

// 1. Проверка наличия файла и того, что написано именно в исходном коде.
const htmlFile = findFile("index.html", "html");
if (!htmlFile) fail("Добавь файл index.html");

// 2. Проверка построенной страницы. Сначала проверяем наличие элемента.
const card = document.querySelector(".card");
if (!card) fail("Добавь элемент с классом card");
if (!card.querySelector("h2")) fail("Добавь заголовок h2 внутри карточки");

// 3. Проверка CSS. Просматриваем все CSS-файлы, включая правила внутри @media.
const cardRule = allStyleRules().find((rule) =>
  rule.selectorText.split(",").some((selector) => selector.trim() === ".card") &&
  rule.style.getPropertyValue("display").trim() === "flex"
);
if (!cardRule) fail("Задай для .card свойство display: flex");
if (getComputedStyle(card).display !== "flex") {
  fail("Проверь, что правило включает display: flex у .card");
}

// Если код дошёл сюда без исключения, runner вернёт passed: true.
