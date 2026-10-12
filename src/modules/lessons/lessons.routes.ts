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
import { requireStudent } from "../students/students.service.js";
import { openLessonTheory } from "../lesson_progress/lesson_progress.service.js";
import { LessonProgressResponseSchema } from "../lesson_progress/lesson_progress.schema.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    "/:id/theory/open",
    {
      onRequest: requireStudent,
      schema: {
        operationId: "openLessonTheory",
        tags: ["Lesson"],
        summary: "Отметка открытия теории урока",
        params: LessonIdSchema,
        body: Type.Object({}, { additionalProperties: false }),
        response: { 200: LessonProgressResponseSchema },
      },
    },
    async (request) => openLessonTheory(request.params.id, request.studentId),
  );
  fastify.get(
    "/",
    {
      schema: {
        operationId: "getLessons",
        tags: ["Lesson"],
        summary: "Получение списка уроков",
        querystring: LessonsFilterSchema,
        response: { 200: Type.Array(LessonResponseSchema) },
      },
    },
    async (request) => service.getLessons(request.query),
  );

  fastify.get(
    "/:id",
    {
      schema: { operationId: "getLessonById", tags: ["Lesson"], summary: "Получение урока по id", params: LessonIdSchema, response: { 200: LessonResponseSchema } },
    },
    async (request) => service.getLessonById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: {
        operationId: "createLesson",
        tags: ["Lesson"],
        summary: "Добавление урока",
        body: CreateLessonSchema,
        response: { 201: LessonResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createLesson(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        operationId: "updateLesson",
        tags: ["Lesson"],
        summary: "Редактирование урока",
        params: LessonIdSchema,
        body: UpdateLessonSchema,
        response: { 200: LessonResponseSchema },
      },
    },
    async (request) => service.updateLesson(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { operationId: "deleteLesson", tags: ["Lesson"], summary: "Удаление урока", params: LessonIdSchema } },
    async (request, reply) => {
      await service.deleteLesson(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
