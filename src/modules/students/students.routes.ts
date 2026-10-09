import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  StudentResponseSchema,
  StudentIdSchema,
  CreateStudentSchema,
  UpdateStudentSchema,
  RecoverStudentSchema,
  StudentAccessResponseSchema,
  StudentRegistrationResponseSchema,
} from "./students.schema.js";
import * as service from "./students.service.js";
import { ResponseError } from "../../common/errors/response.error.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  // fastify.get("/", { schema: { response: { 200: Type.Array(StudentResponseSchema) } } }, async () =>
  //   service.getAll(),
  // );

  fastify.post(
    "/",
    {
      schema: { body: CreateStudentSchema, response: { 201: StudentRegistrationResponseSchema } },
    },
    async (request, reply) => {
      reply.header("Cache-Control", "private, no-store");
      return reply.code(201).send(await service.createStudent(request.body));
    },
  );

  fastify.post(
    "/recover",
    {
      schema: { body: RecoverStudentSchema, response: { 200: StudentAccessResponseSchema } },
    },
    async (request, reply) => {
      reply.header("Cache-Control", "private, no-store");
      return service.recoverStudent(request.body.recovery_code);
    },
  );

  fastify.get(
    "/me",
    {
      onRequest: service.requireStudent,
      schema: { response: { 200: StudentResponseSchema } },
    },
    async (request) => service.getStudentById(request.studentId),
  );

  fastify.get(
    "/",
    {
      onRequest: service.requireStudent,
      schema: { response: { 200: Type.Array(StudentResponseSchema) } },
    },
    async (request) => [await service.getStudentById(request.studentId)],
  );

  fastify.get(
    "/:id",
    {
      onRequest: service.requireStudent,
      schema: { params: StudentIdSchema, response: { 200: StudentResponseSchema } },
    },
    async (request) => {
      service.assertStudentOwner(request, request.params.id);
      return service.getStudentById(request.studentId);
    },
  );

  fastify.patch(
    "/:id",
    {
      onRequest: service.requireStudent,
      schema: {
        params: StudentIdSchema,
        body: UpdateStudentSchema,
        response: { 200: StudentResponseSchema },
      },
    },
    async (request) => {
      service.assertStudentOwner(request, request.params.id);
      return service.updateStudent(request.studentId, request.body);
    },
  );

  fastify.delete(
    "/:id",
    {
      onRequest: service.requireStudent,
      schema: { params: StudentIdSchema },
    },
    async (request, reply) => {
      service.assertStudentOwner(request, request.params.id);
      await service.deleteStudent(request.studentId);
      return reply.code(204).send();
    },
  );
};

export default routes;
