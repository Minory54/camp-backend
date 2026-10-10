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
import { requireStudent, assertStudentOwner } from "../students/students.service.js";
import * as service from "./tests.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    { schema: { tags: ["Test"], response: { 200: Type.Array(TestResponseSchema) } } },
    async () => service.getTests(),
  );

  fastify.get(
    "/:id",
    {
      schema: { tags: ["Test"], params: TestIdSchema, response: { 200: TestResponseSchema } },
    },
    async (request) => service.getTestById(request.params.id),
  );

  fastify.post(
    "/answer",
    {
      onRequest: requireStudent,
      schema: {
        tags: ["Test"],
        body: CheckAnswerSchema,
        response: { 200: CheckAnswerResponseSchema },
      },
    },
    async (request) => {
      assertStudentOwner(request, request.body.id_student);
      return service.checkAnswer({ ...request.body, id_student: request.studentId });
    },
  );

  fastify.get(
    "/:id/answers",
    {
      onRequest: requireStudent,
      schema: {
        tags: ["Test"],
        params: TestIdSchema,
        response: {
          200: Type.Array(
            Type.Object({
              id_question: Type.Integer(),
              is_correct: Type.Boolean(),
            }),
          ),
        },
      },
    },
    async (request) => service.getTestAnswers(request.params.id, request.studentId),
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Test"],
        body: CreateTestSchema,
        response: { 201: TestResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createTest(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Test"],
        params: TestIdSchema,
        body: UpdateTestSchema,
        response: { 200: TestResponseSchema },
      },
    },
    async (request) => service.updateTest(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { tags: ["Test"], params: TestIdSchema } },
    async (request, reply) => {
      await service.deleteTest(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
