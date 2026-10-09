import Fastify from "fastify";
import groupsRoutes from "./modules/groups/groups.routes.js";
import studentsRoutes from "./modules/students/students.routes.js";
import theoriesRoutes from "./modules/theories/theories.routes.js";
import testsRoutes from "./modules/tests/tests.routes.js";
import questionsRoutes from "./modules/questions/questions.routes.js";
import questionOptionsRoutes from "./modules/question_options/question_options.routes.js";
import codeLanguagesRoutes from "./modules/code_languages/code_languages.routes.js";
import coursesRoutes from "./modules/courses/courses.routes.js";
import technologiesRoutes from "./modules/technologies/technologies.routes.js";
import lessonsRoutes from "./modules/lessons/lessons.routes.js";
import lessonProgressRoutes from "./modules/lesson_progress/lesson_progress.routes.js";
import practicesRoutes from "./modules/practices/practices.routes.js";
import practiceSavesRoutes from "./modules/practice_saves/practice_saves.routes.js";
import practiceFilesRoutes from "./modules/practice_files/practice_files.routes.js";
import saveFilesRoutes from "./modules/save_files/save_files.routes.js";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export async function buildApp() {
  const app = Fastify({
    logger: { redact: ["req.headers.authorization", "req.headers.cookie"] },
    ajv: { customOptions: { removeAdditional: false } },
  });
  app.decorateRequest("studentId", "");

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Camp API",
        version: "1.0.0",
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  app.register(groupsRoutes, { prefix: "/api/groups" });
  app.register(theoriesRoutes, { prefix: "/api/theories" });
  app.register(studentsRoutes, { prefix: "/api/students" });
  app.register(testsRoutes, { prefix: "/api/tests" });
  app.register(questionsRoutes, { prefix: "/api/questions" });
  app.register(questionOptionsRoutes, { prefix: "/api/question-options" });
  app.register(codeLanguagesRoutes, { prefix: "/api/code-languages" });
  app.register(coursesRoutes, { prefix: "/api/courses" });
  app.register(technologiesRoutes, { prefix: "/api/technologies" });
  app.register(lessonsRoutes, { prefix: "/api/lessons" });
  app.register(lessonProgressRoutes, { prefix: "/api/lesson-progress" });
  app.register(practicesRoutes, { prefix: "/api/practices" });
  app.register(practiceSavesRoutes, { prefix: "/api/practice-saves" });
  app.register(practiceFilesRoutes, { prefix: "/api/practice-files" });
  app.register(saveFilesRoutes, { prefix: "/api/save-files" });

  return app;
}
