import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  PracticeSaveResponseSchema,
  PracticeSaveIdSchema,
  CreatePracticeSaveSchema,
  UpdatePracticeSaveSchema,
  PracticeSavesFilterSchema,
} from "./practice_saves.schema.js";
import { requireStudent, assertStudentOwner } from "../students/students.service.js";
import * as service from "./practice_saves.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook("onRequest", requireStudent);
  fastify.addHook("preHandler", async (request) => {
    const { id } = request.params as { id?: number };
    if (id !== undefined) {
      const current = await service.getPracticeSaveById(id);
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
        querystring: PracticeSavesFilterSchema,
        response: { 200: Type.Array(PracticeSaveResponseSchema) },
      },
    },
    async (request) => service.getPracticeSaves({ ...request.query, studentId: request.studentId }),
  );

  fastify.get(
    "/:id",
    { schema: { params: PracticeSaveIdSchema, response: { 200: PracticeSaveResponseSchema } } },
    async (request) => service.getPracticeSaveById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: { body: CreatePracticeSaveSchema, response: { 201: PracticeSaveResponseSchema } },
    },
    async (request, reply) => {
      const result = await service.createPracticeSave(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        params: PracticeSaveIdSchema,
        body: UpdatePracticeSaveSchema,
        response: { 200: PracticeSaveResponseSchema },
      },
    },
    async (request) => service.updatePracticeSave(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { params: PracticeSaveIdSchema } },
    async (request, reply) => {
      await service.deletePracticeSave(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
