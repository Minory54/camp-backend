import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  StudentResponseSchema,
  StudentIdSchema,
  CreateStudentSchema,
  UpdateStudentSchema,
} from "./students.schema.js";
import * as service from "./students.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/", { schema: { response: { 200: Type.Array(StudentResponseSchema) } } }, async () =>
    service.getStudents(),
  );

  fastify.get(
    "/:id",
    {
      schema: { params: StudentIdSchema, response: { 200: StudentResponseSchema } },
    },
    async (request) => service.getStudentById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: {
        body: CreateStudentSchema,
        response: { 201: StudentResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createStudent(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        params: StudentIdSchema,
        body: UpdateStudentSchema,
        response: { 200: StudentResponseSchema },
      },
    },
    async (request) => service.updateStudent(request.params.id, request.body),
  );

  fastify.delete("/:id", { schema: { params: StudentIdSchema } }, async (request, reply) => {
    await service.deleteStudent(request.params.id);
    return reply.code(204).send();
  });
};

export default routes;
