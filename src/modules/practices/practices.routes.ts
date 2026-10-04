import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  PracticeResponseSchema,
  PracticeIdSchema,
  CreatePracticeSchema,
  UpdatePracticeSchema,
} from "./practices.schema.js";
import * as service from "./practices.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    { schema: { response: { 200: Type.Array(PracticeResponseSchema) } } },
    async () => service.getPractices(),
  );

  fastify.get(
    "/:id",
    { schema: { params: PracticeIdSchema, response: { 200: PracticeResponseSchema } } },
    async (request) => service.getPracticeById(request.params.id),
  );

  fastify.post(
    "/",
    { schema: { body: CreatePracticeSchema, response: { 201: PracticeResponseSchema } } },
    async (request, reply) => {
      const result = await service.createPractice(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        params: PracticeIdSchema,
        body: UpdatePracticeSchema,
        response: { 200: PracticeResponseSchema },
      },
    },
    async (request) => service.updatePractice(request.params.id, request.body),
  );

  fastify.delete("/:id", { schema: { params: PracticeIdSchema } }, async (request, reply) => {
    await service.deletePractice(request.params.id);
    return reply.code(204).send();
  });
};

export default routes;
