import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  QuestionResponseSchema,
  QuestionIdSchema,
  CreateQuestionSchema,
  UpdateQuestionSchema,
  QuestionsFilterSchema,
} from "./questions.schema.js";
import * as service from "./questions.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        operationId: "getQuestions",
        tags: ["Question"],
        summary: "Получение списка вопросов",
        querystring: QuestionsFilterSchema,
        response: { 200: Type.Array(QuestionResponseSchema) },
      },
    },
    async (request) => service.getQuestions(request.query.testId),
  );

  fastify.get(
    "/:id",
    {
      schema: {
        operationId: "getQuestionById",
        tags: ["Question"],
        summary: "Получение вопроса по id",
        params: QuestionIdSchema,
        response: { 200: QuestionResponseSchema },
      },
    },
    async (request) => service.getQuestionById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: {
        operationId: "createQuestion",
        tags: ["Question"],
        summary: "Добавление вопроса",
        body: CreateQuestionSchema,
        response: { 201: QuestionResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createQuestion(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        operationId: "updateQuestion",
        tags: ["Question"],
        summary: "Редактирование вопроса",
        params: QuestionIdSchema,
        body: UpdateQuestionSchema,
        response: { 200: QuestionResponseSchema },
      },
    },
    async (request) => service.updateQuestion(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { operationId: "deleteQuestion", tags: ["Question"], summary: "Удаление вопроса", params: QuestionIdSchema } },
    async (request, reply) => {
      await service.deleteQuestion(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
