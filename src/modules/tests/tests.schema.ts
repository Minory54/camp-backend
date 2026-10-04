import { Type, type Static } from "typebox";
import { QuestionResponseSchema } from "../questions/questions.schema.js";

export const TestResponseSchema = Type.Object({
  id: Type.Integer(),
  title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  description: Type.Union([Type.String(), Type.Null()]),
  Test_questions: Type.Optional(Type.Array(Type.Any())),
});

export const TestIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
});

export const CreateTestSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const UpdateTestSchema = Type.Partial(CreateTestSchema, {
  minProperties: 1,
});

export type CreateTestData = Static<typeof CreateTestSchema>;
export type UpdateTestData = Static<typeof UpdateTestSchema>;
