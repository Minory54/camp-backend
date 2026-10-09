import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  SaveFileResponseSchema,
  SaveFileIdSchema,
  CreateSaveFileSchema,
  UpdateSaveFileSchema,
  SaveFilesFilterSchema,
} from "./save_files.schema.js";
import { requireStudent, assertStudentOwner } from "../students/students.service.js";
import { getPracticeSaveById } from "../practice_saves/practice_saves.service.js";
import { ResponseError } from "../../common/errors/response.error.js";
import * as service from "./save_files.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook("onRequest", requireStudent);
  fastify.addHook("preHandler", async (request) => {
    const { id } = request.params as { id?: number };
    if (id !== undefined) {
      const current = await service.getSaveFileById(id);
      if (current.practice_save === null) throw new ResponseError(404, "Сохранение не найдено");
      assertStudentOwner(request, current.practice_save.id_student);
    }
    const query = request.query as { practiceSaveId?: number };
    const body = request.body as { id_practice_save?: number } | undefined;
    for (const saveId of [query.practiceSaveId, body?.id_practice_save]) {
      if (saveId !== undefined) {
        const save = await getPracticeSaveById(saveId);
        assertStudentOwner(request, save.id_student);
      }
    }
  });
  fastify.get(
    "/",
    {
      schema: {
        querystring: SaveFilesFilterSchema,
        response: { 200: Type.Array(SaveFileResponseSchema) },
      },
    },
    async (request) => service.getSaveFiles(request.query, request.studentId),
  );

  fastify.get(
    "/:id",
    { schema: { params: SaveFileIdSchema, response: { 200: SaveFileResponseSchema } } },
    async (request) => service.getSaveFileById(request.params.id),
  );

  fastify.post(
    "/",
    { schema: { body: CreateSaveFileSchema, response: { 201: SaveFileResponseSchema } } },
    async (request, reply) => {
      const result = await service.createSaveFile(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        params: SaveFileIdSchema,
        body: UpdateSaveFileSchema,
        response: { 200: SaveFileResponseSchema },
      },
    },
    async (request) => service.updateSaveFile(request.params.id, request.body),
  );

  fastify.delete("/:id", { schema: { params: SaveFileIdSchema } }, async (request, reply) => {
    await service.deleteSaveFile(request.params.id);
    return reply.code(204).send();
  });
};

export default routes;
