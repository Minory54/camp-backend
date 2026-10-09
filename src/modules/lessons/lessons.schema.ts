import { Type, type Static } from "typebox";

export const LessonResponseSchema = Type.Object({
  id: Type.Integer(),
  id_group: Type.Integer({ minimum: 1 }),
  title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  position: Type.Integer({ minimum: 1 }),
  is_hidden: Type.Boolean(),
  id_theory: Type.Union([Type.Integer({ minimum: 1 }), Type.Null()]),
  id_practice: Type.Union([Type.Integer({ minimum: 1 }), Type.Null()]),
  id_test: Type.Union([Type.Integer({ minimum: 1 }), Type.Null()]),
  group: Type.Optional(Type.Any()),
  theory: Type.Optional(Type.Any()),
  test: Type.Optional(Type.Any()),
  practice: Type.Optional(Type.Any()),
  Lesson_progress: Type.Optional(Type.Array(Type.Any())),
});

export const LessonIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
});

export const LessonsFilterSchema = Type.Object({
  groupId: Type.Optional(Type.Integer({ minimum: 1 })),
});

export const CreateLessonSchema = Type.Object(
  {
    id_group: Type.Integer({ minimum: 1 }),
    title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
    position: Type.Integer({ minimum: 1 }),
    is_hidden: Type.Optional(Type.Boolean()),
    id_theory: Type.Optional(Type.Union([Type.Integer({ minimum: 1 }), Type.Null()])),
    id_practice: Type.Optional(Type.Union([Type.Integer({ minimum: 1 }), Type.Null()])),
    id_test: Type.Optional(Type.Union([Type.Integer({ minimum: 1 }), Type.Null()])),
  },
  { additionalProperties: false },
);

export const UpdateLessonSchema = Type.Partial(CreateLessonSchema, {
  minProperties: 1,
  additionalProperties: false,
});

export type CreateLessonData = Static<typeof CreateLessonSchema>;
export type UpdateLessonData = Static<typeof UpdateLessonSchema>;
export type LessonsQuery = Static<typeof LessonsFilterSchema>;
