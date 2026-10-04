import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import {
  GroupResponseSchema,
  GroupIdSchema,
  GroupsFilterSchema,
  CreateGroupSchema,
  UpdateGroupSchema,
} from "./groups.schema.js";

import * as groupsService from "./groups.service.js";

const groupsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // GET /groups
  // GET /groups?courseId=1
  fastify.get(
    "/",
    {
      schema: {
        querystring: GroupsFilterSchema,
      },
    },
    async (request) => {
      const { courseId } = request.query;

      return groupsService.getGroups(courseId);
    },
  );

  // GET /groups/:id
  fastify.get(
    "/:id",
    {
      schema: {
        params: GroupIdSchema,

        response: {
          200: GroupResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;

      return groupsService.getGroupById(id);
    },
  );

  // POST /groups
  fastify.post(
    "/",
    {
      schema: {
        body: CreateGroupSchema,

        response: {
          201: GroupResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const group = await groupsService.createGroup(request.body);
      return reply.code(201).send(group);
    },
  );

  // PATCH /groups/:id
  fastify.patch(
    "/:id",
    {
      schema: {
        params: GroupIdSchema,
        body: UpdateGroupSchema,

        response: {
          200: GroupResponseSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params;
      return groupsService.updateGroup(id, request.body);
    },
  );

  //  DELETE /groups/:id
  fastify.delete(
    "/:id",
    {
      schema: {
        params: GroupIdSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      await groupsService.deleteGroup(id);

      return reply.code(204).send();
    },
  );
};

export default groupsRoutes;
