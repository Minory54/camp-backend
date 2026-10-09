import { Type, type Static } from "typebox";

export const QuestionOptionResponseSchema = Type.Object({
  id: Type.Integer(),
  id_question: Type.Integer({ minimum: 1 }),
  position: Type.Integer({ minimum: 1 }),
  title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
});

export const QuestionOptionIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
});

export const QuestionOptionsFilterSchema = Type.Object({
  questionId: Type.Optional(Type.Integer({ minimum: 1 })),
});

export const CreateQuestionOptionSchema = Type.Object({
  id_question: Type.Integer({ minimum: 1 }),
  position: Type.Integer({ minimum: 1 }),
  title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  is_correct: Type.Optional(Type.Boolean()),
});

export const UpdateQuestionOptionSchema = Type.Partial(
  CreateQuestionOptionSchema,
  {
    minProperties: 1,
  },
);

export type CreateQuestionOptionData = Static<
  typeof CreateQuestionOptionSchema
>;
export type UpdateQuestionOptionData = Static<
  typeof UpdateQuestionOptionSchema
>;
