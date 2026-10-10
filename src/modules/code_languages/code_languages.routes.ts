import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  CodeLanguageResponseSchema,
  CodeLanguageIdSchema,
  CreateCodeLanguageSchema,
  UpdateCodeLanguageSchema,
} from "./code_languages.schema.js";
import * as service from "./code_languages.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Code language"],
        summary: "Получение полного списка языков программирования",
        response: { 200: Type.Array(CodeLanguageResponseSchema) },
      },
    },
    async () => service.getCodeLanguages(),
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Code language"],
        summary: "Получение языка программирования по id",
        params: CodeLanguageIdSchema,
        response: { 200: CodeLanguageResponseSchema },
      },
    },
    async (request) => service.getCodeLanguageById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Code language"],
        summary: "Добавление языка программирования",
        body: CreateCodeLanguageSchema,
        response: { 201: CodeLanguageResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createCodeLanguage(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Code language"],
        summary: "Редактирование языка программирования",
        params: CodeLanguageIdSchema,
        body: UpdateCodeLanguageSchema,
        response: { 200: CodeLanguageResponseSchema },
      },
    },
    async (request) => service.updateCodeLanguage(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { tags: ["Code language"],summary: "Удаление языка программирования", params: CodeLanguageIdSchema } },
    async (request, reply) => {
      await service.deleteCodeLanguage(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
