// The browser creates html/head/body for HTML fragments. This check must inspect
// the student's source, not only the DOM produced by Chromium.
export const LEGACY_DOCUMENT_STRUCTURE_TEST_JS =
  "if (!document.querySelector('html head') || !document.querySelector('html body')) throw new Error('Добавь head и body');";

export const DOCUMENT_STRUCTURE_TEST_JS = `
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
`;

export const LEGACY_TEXT_TEST_JS =
  "if (!document.querySelector('h1') || !document.querySelector('p')) throw new Error('Нужны h1 и p');";

export const TEXT_TEST_JS = `
const hasText = selector => Array.from(document.querySelectorAll(selector))
  .some(element => element.textContent?.trim());
if (!hasText('h1')) throw new Error('Добавь непустой заголовок h1');
if (!hasText('p')) throw new Error('Добавь непустой абзац p');
`;

export const LEGACY_LINKS_TEST_JS =
  "if (!document.querySelector('a[href]') || !document.querySelector('img[alt]')) throw new Error('Нужны ссылка и изображение');";

export const LINKS_TEST_JS = `
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
`;

const CSS_STYLE_RULES_HELPER_JS = `
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
`;

export const LEGACY_CARD_TEST_JS =
  "if (!Array.from(document.styleSheets).some(sheet => { try { return Array.from(sheet.cssRules).some(rule => rule.cssText.includes('.card')); } catch { return false; } })) throw new Error('Добавь правило .card');";

export const CARD_TEST_JS = `${CSS_STYLE_RULES_HELPER_JS}
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
`;

export const LEGACY_COLORS_TEST_JS =
  "if (!Array.from(document.styleSheets).some(sheet => { try { return Array.from(sheet.cssRules).some(rule => rule.cssText.includes('color:') && rule.cssText.includes('background-color:')); } catch { return false; } })) throw new Error('Задай цвет текста и фон');";

export const COLORS_TEST_JS = `${CSS_STYLE_RULES_HELPER_JS}
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
`;
