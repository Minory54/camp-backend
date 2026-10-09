import { Type, type Static } from "typebox";

export const SaveFileResponseSchema = Type.Object({
  id: Type.Integer(),
  id_practice_save: Type.Integer({ minimum: 1 }),
  id_practice_file: Type.Integer({ minimum: 1 }),
  code: Type.String(),
  practice_file: Type.Optional(Type.Any()),
  practice_save: Type.Optional(Type.Any()),
});

export const SaveFileIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
});

export const SaveFilesFilterSchema = Type.Object({
  practiceSaveId: Type.Optional(Type.Integer({ minimum: 1 })),
  practiceFileId: Type.Optional(Type.Integer({ minimum: 1 })),
});

export const CreateSaveFileSchema = Type.Object(
  {
    id_practice_save: Type.Integer({ minimum: 1 }),
    id_practice_file: Type.Integer({ minimum: 1 }),
    code: Type.String(),
  },
  { additionalProperties: false },
);

export const UpdateSaveFileSchema = Type.Partial(CreateSaveFileSchema, {
  minProperties: 1,
  additionalProperties: false,
});

export type CreateSaveFileData = Static<typeof CreateSaveFileSchema>;
export type UpdateSaveFileData = Static<typeof UpdateSaveFileSchema>;
export type SaveFilesQuery = Static<typeof SaveFilesFilterSchema>;
