import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  StudentSessionResponseSchema,
  StudentSessionIdSchema,
  CreateStudentSessionSchema,
  UpdateStudentSessionSchema,
  StudentSessionsFilterSchema,
} from "./student_sessions.schema.js";
import * as service from "./student_sessions.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        querystring: StudentSessionsFilterSchema,
        response: { 200: Type.Array(StudentSessionResponseSchema) },
      },
    },
    async (request) => service.getStudentSessions(request.query.studentId),
  );

  fastify.get(
    "/:id",
    {
      schema: {
        params: StudentSessionIdSchema,
        response: { 200: StudentSessionResponseSchema },
      },
    },
    async (request) => service.getStudentSessionById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: {
        body: CreateStudentSessionSchema,
        response: { 201: StudentSessionResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createStudentSession(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        params: StudentSessionIdSchema,
        body: UpdateStudentSessionSchema,
        response: { 200: StudentSessionResponseSchema },
      },
    },
    async (request) => service.updateStudentSession(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { params: StudentSessionIdSchema } },
    async (request, reply) => {
      await service.deleteStudentSession(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
