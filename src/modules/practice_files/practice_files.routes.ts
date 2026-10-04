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
        querystring: PracticeFilesFilterSchema,
        response: { 200: Type.Array(PracticeFileResponseSchema) },
      },
    },
    async (request) => service.getPracticeFiles(request.query),
  );

  fastify.get(
    "/:id",
    { schema: { params: PracticeFileIdSchema, response: { 200: PracticeFileResponseSchema } } },
    async (request) => service.getPracticeFileById(request.params.id),
  );

  fastify.post(
    "/",
    { schema: { body: CreatePracticeFileSchema, response: { 201: PracticeFileResponseSchema } } },
    async (request, reply) => {
      const result = await service.createPracticeFile(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        params: PracticeFileIdSchema,
        body: UpdatePracticeFileSchema,
        response: { 200: PracticeFileResponseSchema },
      },
    },
    async (request) => service.updatePracticeFile(request.params.id, request.body),
  );

  fastify.delete("/:id", { schema: { params: PracticeFileIdSchema } }, async (request, reply) => {
    await service.deletePracticeFile(request.params.id);
    return reply.code(204).send();
  });
};

export default routes;
