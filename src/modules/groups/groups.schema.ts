import { Type, Static } from "typebox";

export const GroupStateResponseSchema = Type.Union([
  Type.Literal("open"),
  Type.Literal("locked"),
  Type.Literal("hidden"),
]);

// СХЕМА ОТВЕТА
export const GroupResponseSchema = Type.Object({
  id: Type.Integer(),
  id_course: Type.Integer(),
  title: Type.String(),
  position: Type.Integer(),
  state: GroupStateResponseSchema,
  course: Type.Optional(Type.Any()),
  Lessons: Type.Optional(Type.Array(Type.Any())),
});

// СХЕМА ДЛЯ ПАРАМЕТРА ID
export const GroupIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
});

// СХЕМА ДЛЯ QUERYSTRING
export const GroupsFilterSchema = Type.Object({
  courseId: Type.Optional(Type.Integer({ minimum: 1 })),
});

// СХЕМА ДЛЯ СОЗДАНИЯ
export const CreateGroupSchema = Type.Object(
  {
    id_course: Type.Integer({ minimum: 1 }),
    title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
    position: Type.Integer({ minimum: 1 }),
    state: Type.Optional(GroupStateResponseSchema),
  },
  { additionalProperties: false },
);

// СХЕМА ДЛЯ ОБНОВЛЕНИЯ
export const UpdateGroupSchema = Type.Partial(CreateGroupSchema, {
  minProperties: 1,
  additionalProperties: false,
});

// ТИПЫ
export type CreateGroupData = Static<typeof CreateGroupSchema>;
export type UpdateGroupData = Static<typeof UpdateGroupSchema>;
