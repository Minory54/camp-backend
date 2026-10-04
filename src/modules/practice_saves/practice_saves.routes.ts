import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  PracticeSaveResponseSchema,
  PracticeSaveIdSchema,
  CreatePracticeSaveSchema,
  UpdatePracticeSaveSchema,
  PracticeSavesFilterSchema,
} from "./practice_saves.schema.js";
import * as service from "./practice_saves.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        querystring: PracticeSavesFilterSchema,
        response: { 200: Type.Array(PracticeSaveResponseSchema) },
      },
    },
    async (request) => service.getPracticeSaves(request.query),
  );

  fastify.get(
    "/:id",
    { schema: { params: PracticeSaveIdSchema, response: { 200: PracticeSaveResponseSchema } } },
    async (request) => service.getPracticeSaveById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: { body: CreatePracticeSaveSchema, response: { 201: PracticeSaveResponseSchema } },
    },
    async (request, reply) => {
      const result = await service.createPracticeSave(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        params: PracticeSaveIdSchema,
        body: UpdatePracticeSaveSchema,
        response: { 200: PracticeSaveResponseSchema },
      },
    },
    async (request) => service.updatePracticeSave(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { params: PracticeSaveIdSchema } },
    async (request, reply) => {
      await service.deletePracticeSave(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
