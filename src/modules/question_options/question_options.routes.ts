import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  QuestionOptionResponseSchema,
  QuestionOptionIdSchema,
  CreateQuestionOptionSchema,
  UpdateQuestionOptionSchema,
  QuestionOptionsFilterSchema,
} from "./question_options.schema.js";
import * as service from "./question_options.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Question option"],
        summary: "Получение списка вариантов ответа",
        querystring: QuestionOptionsFilterSchema,
        response: { 200: Type.Array(QuestionOptionResponseSchema) },
      },
    },
    async (request) => service.getQuestionOptions(request.query.questionId),
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Question option"],
        summary: "Получение варианта ответа по id",
        params: QuestionOptionIdSchema,
        response: { 200: QuestionOptionResponseSchema },
      },
    },
    async (request) => service.getQuestionOptionById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Question option"],
        summary: "Добавление варианта ответа",
        body: CreateQuestionOptionSchema,
        response: { 201: QuestionOptionResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createQuestionOption(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Question option"],
        summary: "Редактирование варианта ответа",
        params: QuestionOptionIdSchema,
        body: UpdateQuestionOptionSchema,
        response: { 200: QuestionOptionResponseSchema },
      },
    },
    async (request) => service.updateQuestionOption(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { tags: ["Question option"], summary: "Удаление варианта ответа", params: QuestionOptionIdSchema } },
    async (request, reply) => {
      await service.deleteQuestionOption(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
