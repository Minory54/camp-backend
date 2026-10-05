import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  TestResponseSchema,
  TestIdSchema,
  CreateTestSchema,
  UpdateTestSchema,
  CheckAnswerSchema,
  CheckAnswerResponseSchema,
} from "./tests.schema.js";
import * as service from "./tests.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/", { schema: { response: { 200: Type.Array(TestResponseSchema) } } }, async () =>
    service.getTests(),
  );

  fastify.get(
    "/:id",
    { schema: { params: TestIdSchema, response: { 200: TestResponseSchema } } },
    async (request) => service.getTestById(request.params.id),
  );

  fastify.post(
    "/answer",
    {
      schema: {
        body: CheckAnswerSchema,
        response: { 200: CheckAnswerResponseSchema },
      },
    },
    async (request) => service.checkAnswer(request.body),
  );

  fastify.post(
    "/",
    { schema: { body: CreateTestSchema, response: { 201: TestResponseSchema } } },
    async (request, reply) => {
      const result = await service.createTest(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        params: TestIdSchema,
        body: UpdateTestSchema,
        response: { 200: TestResponseSchema },
      },
    },
    async (request) => service.updateTest(request.params.id, request.body),
  );

  fastify.delete("/:id", { schema: { params: TestIdSchema } }, async (request, reply) => {
    await service.deleteTest(request.params.id);
    return reply.code(204).send();
  });
};

export default routes;
