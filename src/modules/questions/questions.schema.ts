import { Type, type Static } from "typebox";
import { QuestionOptionResponseSchema } from "../question_options/question_options.schema.js";

export const QuestionTypeSchema = Type.Union([Type.Literal("single"), Type.Literal("multiple")]);

export const QuestionResponseSchema = Type.Object({
  id: Type.Integer(),
  id_test: Type.Integer({ minimum: 1 }),
  position: Type.Integer({ minimum: 1 }),
  title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  description: Type.Union([Type.String(), Type.Null()]),
  type: QuestionTypeSchema,
  code_block: Type.Union([Type.String(), Type.Null()]),
  id_code_language: Type.Union([Type.Integer({ minimum: 1 }), Type.Null()]),
  test: Type.Optional(Type.Any()),
  code_language: Type.Optional(Type.Any()),
  Question_options: Type.Optional(Type.Array(QuestionOptionResponseSchema)),
});

export const QuestionIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
});

export const QuestionsFilterSchema = Type.Object({
  testId: Type.Optional(Type.Integer({ minimum: 1 })),
});

export const CreateQuestionSchema = Type.Object(
  {
    id_test: Type.Integer({ minimum: 1 }),
    position: Type.Integer({ minimum: 1 }),
    title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
    description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    type: Type.Optional(QuestionTypeSchema),
    code_block: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    id_code_language: Type.Optional(Type.Union([Type.Integer({ minimum: 1 }), Type.Null()])),
  },
  { additionalProperties: false },
);

export const UpdateQuestionSchema = Type.Partial(CreateQuestionSchema, {
  minProperties: 1,
  additionalProperties: false,
});

export type CreateQuestionData = Static<typeof CreateQuestionSchema>;
export type UpdateQuestionData = Static<typeof UpdateQuestionSchema>;
