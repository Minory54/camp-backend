import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  CourseResponseSchema,
  CourseIdSchema,
  CreateCourseSchema,
  UpdateCourseSchema,
  CourseProgressResponseSchema,
} from "./courses.schema.js";
import { requireStudent, assertStudentOwner } from "../students/students.service.js";
import * as service from "./courses.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    { schema: { operationId: "getCourses", tags: ["Course"], summary: "Получение списка курсов", response: { 200: Type.Array(CourseResponseSchema) } } },
    async () => service.getCourses(),
  );

  fastify.get(
    "/:id",
    {
      schema: {
        operationId: "getCourseById",
        tags: ["Course"],
        summary: "Получение курса по id",
        params: CourseIdSchema,
        response: { 200: CourseResponseSchema },
      },
    },
    async (request) => service.getCourseById(request.params.id),
  );

  fastify.get(
    "/:id/progress",
    {
      onRequest: requireStudent,
      schema: {
        operationId: "getCourseProgress",
        tags: ["Course"],
        summary: "Получение прогресса студента по курсу",
        params: CourseIdSchema,
        querystring: Type.Object({
          studentId: Type.Optional(Type.String({ format: "uuid" })),
        }),
        response: {
          200: CourseProgressResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (request.query.studentId !== undefined)
        assertStudentOwner(request, request.query.studentId);

      return service.getCourseProgress(request.params.id, request.studentId);
    },
  );

  fastify.post(
    "/",
    {
      schema: {
        operationId: "createCourse",
        tags: ["Course"],
        summary: "Добавление курса",
        body: CreateCourseSchema,
        response: { 201: CourseResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createCourse(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        operationId: "updateCourse",
        tags: ["Course"],
        summary: "Редактирование курса",
        params: CourseIdSchema,
        body: UpdateCourseSchema,
        response: { 200: CourseResponseSchema },
      },
    },
    async (request) => service.updateCourse(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { operationId: "deleteCourse", tags: ["Course"], summary: "Удаление курса", params: CourseIdSchema } },
    async (request, reply) => {
      await service.deleteCourse(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
