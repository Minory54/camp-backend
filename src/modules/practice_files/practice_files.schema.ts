import { Type, type Static } from "typebox";

export const PracticeFileResponseSchema = Type.Object({
  id: Type.Integer(),
  id_practice: Type.Integer({ minimum: 1 }),
  id_code_language: Type.Integer({ minimum: 1 }),
  code: Type.String(),
  filename: Type.String({ minLength: 1, pattern: "\\S" }),
  practice: Type.Optional(Type.Any()),
  code_language: Type.Optional(Type.Any()),
});

export const PracticeFileIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
}, { additionalProperties: false });

export const PracticeFilesFilterSchema = Type.Object({
  practiceId: Type.Optional(Type.Integer({ minimum: 1 })),
  codeLanguageId: Type.Optional(Type.Integer({ minimum: 1 })),
}, { additionalProperties: false });

export const CreatePracticeFileSchema = Type.Object(
  {
    id_practice: Type.Integer({ minimum: 1 }),
    id_code_language: Type.Integer({ minimum: 1 }),
    code: Type.String(),
    filename: Type.String({ minLength: 1, pattern: "\\S" }),
  },
  { additionalProperties: false },
);

export const UpdatePracticeFileSchema = Type.Partial(CreatePracticeFileSchema, {
  minProperties: 1,
  additionalProperties: false,
});

export type CreatePracticeFileData = Static<typeof CreatePracticeFileSchema>;
export type UpdatePracticeFileData = Static<typeof UpdatePracticeFileSchema>;
export type PracticeFilesQuery = Static<typeof PracticeFilesFilterSchema>;
