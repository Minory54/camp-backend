import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  TestResponseSchema,
  TestIdSchema,
  CreateTestSchema,
  UpdateTestSchema,
  CheckAnswerSchema,
  CheckAnswerResponseSchema,
} from "./tests.schema.js";
import { requireStudent, assertStudentOwner } from "../students/students.service.js";
import * as service from "./tests.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    { schema: { operationId: "getTests", tags: ["Test"], summary: "Получение списка тестов", response: { 200: Type.Array(TestResponseSchema) } } },
    async () => service.getTests(),
  );

  fastify.get(
    "/:id",
    {
      schema: { operationId: "getTestById", tags: ["Test"], summary: "Получение теста по id", params: TestIdSchema, response: { 200: TestResponseSchema } },
    },
    async (request) => service.getTestById(request.params.id),
  );

  fastify.post(
    "/answer",
    {
      onRequest: requireStudent,
      schema: {
        operationId: "checkAnswer",
        tags: ["Test"],
        summary: "Проверка ответа на вопрос теста",
        body: CheckAnswerSchema,
        response: { 200: CheckAnswerResponseSchema },
      },
    },
    async (request) => {
      assertStudentOwner(request, request.body.id_student);
      return service.checkAnswer({ ...request.body, id_student: request.studentId });
    },
  );

  fastify.get(
    "/:id/answers",
    {
      onRequest: requireStudent,
      schema: {
        operationId: "getTestAnswers",
        tags: ["Test"],
        summary: "Получение результатов ответов студента на вопросы теста",
        params: TestIdSchema,
        response: {
          200: Type.Array(
            Type.Object({
              id_question: Type.Integer(),
              is_correct: Type.Boolean(),
            }),
          ),
        },
      },
    },
    async (request) => service.getTestAnswers(request.params.id, request.studentId),
  );

  fastify.post(
    "/",
    {
      schema: {
        operationId: "createTest",
        tags: ["Test"],
        summary: "Добавление теста",
        body: CreateTestSchema,
        response: { 201: TestResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createTest(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        operationId: "updateTest",
        tags: ["Test"],
        summary: "Редактирование теста",
        params: TestIdSchema,
        body: UpdateTestSchema,
        response: { 200: TestResponseSchema },
      },
    },
    async (request) => service.updateTest(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { operationId: "deleteTest", tags: ["Test"], summary: "Удаление теста", params: TestIdSchema } },
    async (request, reply) => {
      await service.deleteTest(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
