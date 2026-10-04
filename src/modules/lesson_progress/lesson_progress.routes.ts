import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  LessonProgressResponseSchema,
  LessonProgressIdSchema,
  CreateLessonProgressSchema,
  UpdateLessonProgressSchema,
  LessonProgressFilterSchema,
} from "./lesson_progress.schema.js";
import * as service from "./lesson_progress.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        querystring: LessonProgressFilterSchema,
        response: { 200: Type.Array(LessonProgressResponseSchema) },
      },
    },
    async (request) => service.getLessonProgress(request.query),
  );

  fastify.get(
    "/:id",
    {
      schema: {
        params: LessonProgressIdSchema,
        response: { 200: LessonProgressResponseSchema },
      },
    },
    async (request) => service.getLessonProgressById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: {
        body: CreateLessonProgressSchema,
        response: { 201: LessonProgressResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createLessonProgress(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        params: LessonProgressIdSchema,
        body: UpdateLessonProgressSchema,
        response: { 200: LessonProgressResponseSchema },
      },
    },
    async (request) => service.updateLessonProgress(request.params.id, request.body),
  );

  fastify.delete("/:id", { schema: { params: LessonProgressIdSchema } }, async (request, reply) => {
    await service.deleteLessonProgress(request.params.id);
    return reply.code(204).send();
  });
};

export default routes;
