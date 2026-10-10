import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  LessonProgressResponseSchema,
  LessonProgressIdSchema,
  CreateLessonProgressSchema,
  LessonProgressFilterSchema,
} from "./lesson_progress.schema.js";
import { requireStudent, assertStudentOwner } from "../students/students.service.js";
import * as service from "./lesson_progress.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook("onRequest", requireStudent);
  fastify.addHook("preHandler", async (request) => {
    const { id } = request.params as { id?: number };
    if (id !== undefined) {
      const current = await service.getLessonProgressById(id);
      assertStudentOwner(request, current.id_student);
    }
    const body = request.body as { id_student?: string } | undefined;
    if (body?.id_student !== undefined) assertStudentOwner(request, body.id_student);
    const query = request.query as { studentId?: string };
    if (query.studentId !== undefined) assertStudentOwner(request, query.studentId);
  });
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Lesson progress"],
        summary: "Получение списка записей прогресса по урокам",
        querystring: LessonProgressFilterSchema,
        response: { 200: Type.Array(LessonProgressResponseSchema) },
      },
    },
    async (request) =>
      service.getLessonProgress({ ...request.query, studentId: request.studentId }),
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Lesson progress"],
        summary: "Получение записи прогресса по уроку по id",
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
        tags: ["Lesson progress"],
        summary: "Добавление записи прогресса по уроку",
        body: CreateLessonProgressSchema,
        response: { 201: LessonProgressResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createLessonProgress(request.body);
      return reply.code(201).send(result);
    },
  );

  // fastify.patch(
  //   "/:id",
  //   {
  //     schema: {
  //       params: LessonProgressIdSchema,
  //       body: UpdateLessonProgressSchema,
  //       response: { 200: LessonProgressResponseSchema },
  //     },
  //   },
  //   async (request) => service.updateLessonProgress(request.params.id, request.body),
  // );

  fastify.delete(
    "/:id",
    { schema: { tags: ["Lesson progress"], summary: "Удаление записи прогресса по уроку", params: LessonProgressIdSchema } },
    async (request, reply) => {
      await service.deleteLessonProgress(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
