import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  LessonResponseSchema,
  LessonIdSchema,
  CreateLessonSchema,
  UpdateLessonSchema,
  LessonsFilterSchema,
} from "./lessons.schema.js";
import * as service from "./lessons.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        querystring: LessonsFilterSchema,
        response: { 200: Type.Array(LessonResponseSchema) },
      },
    },
    async (request) => service.getLessons(request.query),
  );

  fastify.get(
    "/:id",
    { schema: { params: LessonIdSchema, response: { 200: LessonResponseSchema } } },
    async (request) => service.getLessonById(request.params.id),
  );

  fastify.post(
    "/",
    { schema: { body: CreateLessonSchema, response: { 201: LessonResponseSchema } } },
    async (request, reply) => {
      const result = await service.createLesson(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        params: LessonIdSchema,
        body: UpdateLessonSchema,
        response: { 200: LessonResponseSchema },
      },
    },
    async (request) => service.updateLesson(request.params.id, request.body),
  );

  fastify.delete("/:id", { schema: { params: LessonIdSchema } }, async (request, reply) => {
    await service.deleteLesson(request.params.id);
    return reply.code(204).send();
  });
};

export default routes;
