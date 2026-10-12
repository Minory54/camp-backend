import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  PracticeResponseSchema,
  PracticeIdSchema,
  CreatePracticeSchema,
  UpdatePracticeSchema,
  CheckPracticeSchema,
  CheckPracticeResponseSchema,
} from "./practices.schema.js";
import { requireStudent, assertStudentOwner } from "../students/students.service.js";
import * as service from "./practices.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    "/check",
    {
      onRequest: requireStudent,
      schema: {
        operationId: "checkPractice",
        tags: ["Practice"],
        summary: "Проверка решения практического задания",
        body: CheckPracticeSchema,
        response: { 200: CheckPracticeResponseSchema },
      },
    },
    async (request) => {
      assertStudentOwner(request, request.body.id_student);
      return service.checkPractice({ ...request.body, id_student: request.studentId });
    },
  );
  fastify.get(
    "/",
    { schema: { operationId: "getPractices", tags: ["Practice"], summary: "Получение списка практических заданий", response: { 200: Type.Array(PracticeResponseSchema) } } },
    async () => service.getPractices(),
  );

  fastify.get(
    "/:id",
    {
      schema: {
        operationId: "getPracticeById",
        tags: ["Practice"],
        summary: "Получение практического задания по id",
        params: PracticeIdSchema,
        response: { 200: PracticeResponseSchema },
      },
    },
    async (request) => service.getPracticeById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: {
        operationId: "createPractice",
        tags: ["Practice"],
        summary: "Добавление практического задания",
        body: CreatePracticeSchema,
        response: { 201: PracticeResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createPractice(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        operationId: "updatePractice",
        tags: ["Practice"],
        summary: "Редактирование практического задания",
        params: PracticeIdSchema,
        body: UpdatePracticeSchema,
        response: { 200: PracticeResponseSchema },
      },
    },
    async (request) => service.updatePractice(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { operationId: "deletePractice", tags: ["Practice"], summary: "Удаление практического задания", params: PracticeIdSchema } },
    async (request, reply) => {
      await service.deletePractice(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
