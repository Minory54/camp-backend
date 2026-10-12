import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  TechnologyResponseSchema,
  TechnologyIdSchema,
  CreateTechnologySchema,
  UpdateTechnologySchema,
} from "./technologies.schema.js";
import * as service from "./technologies.service.js";

const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    { schema: { operationId: "getTechnologies", tags: ["Technology"], summary: "Получение списка технологий", response: { 200: Type.Array(TechnologyResponseSchema) } } },
    async () => service.getTechnologies(),
  );

  fastify.get(
    "/:id",
    {
      schema: {
        operationId: "getTechnologyById",
        tags: ["Technology"],
        summary: "Получение технологии по id",
        params: TechnologyIdSchema,
        response: { 200: TechnologyResponseSchema },
      },
    },
    async (request) => service.getTechnologyById(request.params.id),
  );

  fastify.post(
    "/",
    {
      schema: {
        operationId: "createTechnology",
        tags: ["Technology"],
        summary: "Добавление технологии",
        body: CreateTechnologySchema,
        response: { 201: TechnologyResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await service.createTechnology(request.body);
      return reply.code(201).send(result);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        operationId: "updateTechnology",
        tags: ["Technology"],
        summary: "Редактирование технологии",
        params: TechnologyIdSchema,
        body: UpdateTechnologySchema,
        response: { 200: TechnologyResponseSchema },
      },
    },
    async (request) => service.updateTechnology(request.params.id, request.body),
  );

  fastify.delete(
    "/:id",
    { schema: { operationId: "deleteTechnology", tags: ["Technology"], summary: "Удаление технологии", params: TechnologyIdSchema } },
    async (request, reply) => {
      await service.deleteTechnology(request.params.id);
      return reply.code(204).send();
    },
  );
};

export default routes;
