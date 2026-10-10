import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  PracticeFileResponseSchema,
  PracticeFileIdSchema,
  CreatePracticeFileSchema,
  UpdatePracticeFileSchema,
  PracticeFilesFilterSchema,
} from "./practice_files.schema.js";
import * as service from "./practice_files.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Practice file"],
        summary: "Получение списка файлов практических заданий",
        querystring: PracticeFilesFilterSchema,
        response: { 200: Type.Array(PracticeFileResponseSchema) },
      },
    },
    async (request) => service.getPracticeFiles(request.query),
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Practice file"],
        summary: "Получение файла практического задания по id",
        params: PracticeFileIdSchema,
        response: { 200: PracticeFileResponseSchema },
      },
    },
    async (request) => service.getPracticeFileById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Practice file"],
        summary: "Добавление файла практического задания",
        body: CreatePracticeFileSchema,
        response: { 201: PracticeFileResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createPracticeFile(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Practice file"],
        summary: "Редактирование файла практического задания",
        params: PracticeFileIdSchema,
        body: UpdatePracticeFileSchema,
        response: { 200: PracticeFileResponseSchema },
      },
    },
    async (request) => service.updatePracticeFile(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { tags: ["Practice file"], summary: "Удаление файла практического задания", params: PracticeFileIdSchema } },
    async (request, reply) => {
      await service.deletePracticeFile(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
