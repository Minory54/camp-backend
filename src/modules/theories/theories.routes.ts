import type { FastifyPluginAsync } from "fastify";
import * as theoriesService from "./theories.services.js";
import { Type } from "typebox";

import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import {
  TheoryResponseSchema,
  TheoryIdSchema,
  TheoriesFilterSchema,
  CreateTheorySchema,
  UpdateTheorySchema,
} from "./theories.schema.js";

const theoriesRoutes: FastifyPluginAsync = async (app) => {
  const fastify = app.withTypeProvider<TypeBoxTypeProvider>();

  /*
   * GET /theories
   * GET /theories?technologyId=1
   */
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Theory"],
        querystring: TheoriesFilterSchema,
        response: {
          200: Type.Array(TheoryResponseSchema),
        },
      },
    },
    async (request) => {
      const { technologyId } = request.query;
      return theoriesService.getTheories(technologyId);
    },
  );

  /*
   * GET /theories/:id
   */
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Theory"],
        params: TheoryIdSchema,

        response: {
          200: TheoryResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      return theoriesService.getTheoryById(id);
    },
  );

  /*
   * POST /theories
   */
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Theory"],
        body: CreateTheorySchema,

        response: {
          201: TheoryResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const theory = await theoriesService.createTheory(request.body);
      return reply.code(201).send(theory);
    },
  );

  /*
   * PATCH /theories/:id
   */
  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Theory"],
        params: TheoryIdSchema,
        body: UpdateTheorySchema,

        response: {
          200: TheoryResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      return theoriesService.updateTheory(id, request.body);
    },
  );

  /*
   * DELETE /theories/:id
   */
  fastify.delete(
    "/:id",
    {
      schema: { tags: ["Theory"], params: TheoryIdSchema },
    },
    async (request, reply) => {
      const { id } = request.params;

      await theoriesService.deleteTheory(id);
      return reply.code(204).send();
    },
  );
};

export default theoriesRoutes;
