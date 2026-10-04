import { Type, type Static } from "typebox";

export const PracticeResponseSchema = Type.Object({
  id: Type.Integer(),
  title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  description: Type.Union([Type.String(), Type.Null()]),
  mdx_source: Type.String({ minLength: 1, pattern: "\\S" }),
  test_js: Type.String({ minLength: 1, pattern: "\\S" }),
  Lessons: Type.Optional(Type.Array(Type.Any())),
  Practice_saves: Type.Optional(Type.Array(Type.Any())),
  Practice_files: Type.Optional(Type.Array(Type.Any())),
});

export const PracticeIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
});

export const CreatePracticeSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  mdx_source: Type.String({ minLength: 1, pattern: "\\S" }),
  test_js: Type.String({ minLength: 1, pattern: "\\S" }),
});

export const UpdatePracticeSchema = Type.Partial(CreatePracticeSchema, {
  minProperties: 1,
});

export type CreatePracticeData = Static<typeof CreatePracticeSchema>;
export type UpdatePracticeData = Static<typeof UpdatePracticeSchema>;
