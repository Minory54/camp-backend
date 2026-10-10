import { Type, type Static } from "typebox";

export const StudentResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  display_code: Type.String({ minLength: 1, pattern: "\\S" }),
  label: Type.Union([Type.String(), Type.Null()]),
  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
  Lesson_progress: Type.Optional(Type.Array(Type.Any())),
  Practice_saves: Type.Optional(Type.Array(Type.Any())),
});

export const StudentIdSchema = Type.Object(
  {
    id: Type.String({ format: "uuid" }),
  },
  { additionalProperties: false },
);

export const CreateStudentSchema = Type.Object(
  {
    display_code: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  },
  { additionalProperties: false },
);

export const UpdateStudentSchema = Type.Partial(
  Type.Object({
    display_code: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
    label: Type.Union([Type.String({ maxLength: 255 }), Type.Null()]),
  }),
  {
    minProperties: 1,
    additionalProperties: false,
  },
);

export const RecoverStudentSchema = Type.Object(
  {
    recovery_code: Type.String({ pattern: "^SDC[0-9]{4}$" }),
  },
  { additionalProperties: false },
);

export const StudentAccessResponseSchema = Type.Object({
  student: StudentResponseSchema,
  access_token: Type.String(),
});

export const StudentRegistrationResponseSchema = Type.Object({
  student: StudentResponseSchema,
  access_token: Type.String(),
  recovery_code: Type.String({ pattern: "^SDC[0-9]{4}$" }),
});

export type CreateStudentData = Static<typeof CreateStudentSchema>;
export type UpdateStudentData = Static<typeof UpdateStudentSchema>;
