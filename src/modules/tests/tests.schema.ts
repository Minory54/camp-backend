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

export const CheckAnswerSchema = Type.Object({
  id_student: Type.String({ format: "uuid" }),
  id_question: Type.Integer({ minimum: 1 }),
  selected_option_ids: Type.Array(Type.Integer({ minimum: 1 })),
});

export const CheckAnswerResponseSchema = Type.Object({
  is_correct: Type.Boolean(),
  is_test_completed: Type.Boolean(),
  message: Type.Optional(Type.String()),
});

export type CreateTestData = Static<typeof CreateTestSchema>;
export type UpdateTestData = Static<typeof UpdateTestSchema>;
export type CheckAnswerData = Static<typeof CheckAnswerSchema>;
