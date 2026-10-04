import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  SaveFileResponseSchema,
  SaveFileIdSchema,
  CreateSaveFileSchema,
  UpdateSaveFileSchema,
  SaveFilesFilterSchema,
} from "./save_files.schema.js";
import * as service from "./save_files.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        querystring: SaveFilesFilterSchema,
        response: { 200: Type.Array(SaveFileResponseSchema) },
      },
    },
    async (request) => service.getSaveFiles(request.query),
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
