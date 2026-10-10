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
  // ПОЛУЧЕНИЕ ВСЕХ ЗАПИСЕЙ
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Code language"],
        response: { 200: Type.Array(CodeLanguageResponseSchema) },
      },
    },
    async () => service.getCodeLanguages(),
  );

  // ПОЛУЧЕНИЕ ЗАПИСИ ПО КОНКРЕТНОМУ ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Code language"],
        params: CodeLanguageIdSchema,
        response: { 200: CodeLanguageResponseSchema },
      },
    },
    async (request) => service.getCodeLanguageById(request.params.id),
  );

  // СОЗДАНИЕ НОВОЙ ЗАПИСИ
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Code language"],
        body: CreateCodeLanguageSchema,
        response: { 201: CodeLanguageResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createCodeLanguage(request.body);
      return reply.code(201).send(result);
    },
  );

  // РЕДАКТИРОВАНИЕ ЗАПИСИ
  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Code language"],
        params: CodeLanguageIdSchema,
        body: UpdateCodeLanguageSchema,
        response: { 200: CodeLanguageResponseSchema },
      },
    },
    async (request) => service.updateCodeLanguage(request.params.id, request.body),
  );

  // УДАЛЕНИЕ ЗАПИСИ
  fastify.delete(
    "/:id",
    { schema: { tags: ["Code language"], params: CodeLanguageIdSchema } },
    async (request, reply) => {
      await service.deleteCodeLanguage(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
