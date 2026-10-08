import { chromium, type Browser } from "playwright";

export type PracticeCheckResult =
  | { status: "passed" }
  | { status: "failed"; error: string }
  | { status: "system_error"; error: string };

export type CheckFile = { id: number; filename: string; language: "html" | "css"; code: string };

const ORIGIN = "http://practice.invalid";
const TIMEOUT_MS = 5_000;
const MAX_RUNNING = 2;
let running = 0;

export function selectMainHtml(files: readonly CheckFile[]): CheckFile | undefined {
  // Practice_files.id is stable; request order never decides the entry page.
  const html = files
    .filter((file) => file.language === "html")
    .sort((left, right) => left.id - right.id);
  return html.find((file) => file.filename === "index.html") ?? html[0];
}

export async function runPracticeCheck(
  files: readonly CheckFile[],
  testJs: string,
): Promise<PracticeCheckResult> {
  if (running >= MAX_RUNNING)
    return { status: "system_error", error: "Проверка временно перегружена" };
  running++;
  let browser: Browser | undefined;
  let timeout: NodeJS.Timeout | undefined;
  try {
    const check = async (): Promise<PracticeCheckResult> => {
      browser = await chromium.launch({
        timeout: TIMEOUT_MS,
        args: ["--renderer-process-limit=1", "--disable-dev-shm-usage"],
        env: {
          PATH: process.env.PATH ?? "",
          HOME: process.env.HOME ?? "",
          TMPDIR: process.env.TMPDIR ?? "/tmp",
        },
      });
      const context = await browser.newContext({
        serviceWorkers: "block",
        acceptDownloads: false,
      });
      const page = await context.newPage();
      const main = selectMainHtml(files);
      const html = main?.code ?? "<!doctype html><html><head></head><body></body></html>";
      const localFiles = new Map(
        files.map((file) => [
          new URL(`/${encodeURIComponent(file.filename)}`, ORIGIN).pathname,
          file,
        ]),
      );
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin !== ORIGIN) return route.abort();
        const file = localFiles.get(url.pathname);
        if (file && file.language === "css") {
          return route.fulfill({ status: 200, contentType: "text/css", body: file.code });
        }
        if ((file && file.language === "html") || (!main && url.pathname === "/__empty__.html")) {
          return route.fulfill({
            status: 200,
            contentType: "text/html",
            body: file?.code ?? html,
            headers: {
              "content-security-policy":
                "default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'unsafe-eval'; connect-src 'self'; img-src 'none'; form-action 'none'; base-uri 'none'; frame-src 'none'",
            },
          });
        }
        return route.abort();
      });
      const mainPath = main ? `/${encodeURIComponent(main.filename)}` : "/__empty__.html";
      await page.goto(`${ORIGIN}${mainPath}`, {
        waitUntil: "domcontentloaded",
        timeout: TIMEOUT_MS,
      });
      // Each CSS file is a separate stylesheet in CSSOM, including CSS-only practices.
      await page.evaluate(
        (styles) => {
          for (const style of styles) {
            const element = document.createElement("style");
            element.dataset.filename = style.filename;
            element.textContent = style.code;
            document.head.appendChild(element);
          }
        },
        files
          .filter((file) => file.language === "css")
          .map(({ filename, code }) => ({ filename, code })),
      );

      return page.evaluate(({ source, sourceFiles }): PracticeCheckResult => {
        let test: (sourceFiles: Array<{ filename: string; language: "html" | "css"; code: string }>) => void;
        try {
          test = new Function("sourceFiles", source) as typeof test;
        } catch {
          return { status: "system_error", error: "Ошибка в настройке проверки" };
        }
        try {
          test(sourceFiles);
          return { status: "passed" };
        } catch (error) {
          if (error instanceof Error)
            return {
              status: "failed",
              error: error.message.slice(0, 500) || "Условия задания не выполнены",
            };
          return { status: "failed", error: "Условия задания не выполнены" };
        }
      }, {
        source: testJs,
        sourceFiles: files.map(({ filename, language, code }) => ({ filename, language, code })),
      });
    };
    return await Promise.race([
      check(),
      new Promise<PracticeCheckResult>((resolve) => {
        timeout = setTimeout(
          () => resolve({ status: "system_error", error: "Время проверки истекло" }),
          TIMEOUT_MS,
        );
      }),
    ]);
  } catch {
    return { status: "system_error", error: "Не удалось выполнить проверку" };
  } finally {
    if (timeout) clearTimeout(timeout);
    await browser?.close().catch(() => undefined);
    running--;
  }
}
