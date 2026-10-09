import { Type, type Static } from "typebox";

export const PracticeSaveResponseSchema = Type.Object({
  id: Type.Integer(),
  id_student: Type.String({ format: "uuid" }),
  id_practice: Type.Integer({ minimum: 1 }),
  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
  student: Type.Optional(Type.Any()),
  practice: Type.Optional(Type.Any()),
});

export const PracticeSaveIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
}, { additionalProperties: false });

export const PracticeSavesFilterSchema = Type.Object({
  studentId: Type.Optional(Type.String({ format: "uuid" })),
  practiceId: Type.Optional(Type.Integer({ minimum: 1 })),
}, { additionalProperties: false });

export const CreatePracticeSaveSchema = Type.Object(
  {
    id_student: Type.String({ format: "uuid" }),
    id_practice: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
);

export const UpdatePracticeSaveSchema = Type.Partial(
  CreatePracticeSaveSchema,
  {
    minProperties: 1,
    additionalProperties: false,
  },
);

export type CreatePracticeSaveData = Static<typeof CreatePracticeSaveSchema>;
export type UpdatePracticeSaveData = Static<typeof UpdatePracticeSaveSchema>;
export type PracticeSavesQuery = Static<typeof PracticeSavesFilterSchema>;
