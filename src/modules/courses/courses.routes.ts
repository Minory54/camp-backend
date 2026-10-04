import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  CourseResponseSchema,
  CourseIdSchema,
  CreateCourseSchema,
  UpdateCourseSchema,
  CourseProgressResponseSchema
} from "./courses.schema.js";
import * as service from "./courses.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/", { schema: { response: { 200: Type.Array(CourseResponseSchema) } } }, async () =>
    service.getCourses(),
  );

  fastify.get(
    "/:id",
    {
      schema: {
        params: CourseIdSchema,
        response: { 200: CourseResponseSchema },
      },
    },
    async (request) => service.getCourseById(request.params.id),
  );

  fastify.get(
  "/:id/progress",
  {
    schema: {
      params: CourseIdSchema,
      querystring: Type.Object({
        studentId: Type.String({ format: "uuid" }),
      }),
      response: {
        200: CourseProgressResponseSchema,
      },
    },
  },
  async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");

    return service.getCourseProgress(
      request.params.id,
      request.query.studentId,
    );
  },
);

  fastify.post(
    "/",
    {
      schema: {
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
        params: CourseIdSchema,
        body: UpdateCourseSchema,
        response: { 200: CourseResponseSchema },
      },
    },
    async (request) => service.updateCourse(request.params.id, request.body),
  );

  fastify.delete("/:id", { schema: { params: CourseIdSchema } }, async (request, reply) => {
    await service.deleteCourse(request.params.id);
    return reply.code(204).send();
  });
};

export default routes;
