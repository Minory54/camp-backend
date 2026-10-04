import { Type, type Static } from "typebox";

export const StudentSessionResponseSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  id_student: Type.String({ format: "uuid" }),
  token_hash: Type.String({ minLength: 1, pattern: "\\S" }),
  expires_at: Type.String({ format: "date-time" }),
  created_at: Type.String({ format: "date-time" }),
  student: Type.Optional(Type.Any()),
});

export const StudentSessionIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
});

export const StudentSessionsFilterSchema = Type.Object({
  studentId: Type.Optional(Type.String({ format: "uuid" })),
});

export const CreateStudentSessionSchema = Type.Object({
  id_student: Type.String({ format: "uuid" }),
  token_hash: Type.String({ minLength: 1, pattern: "\\S" }),
  expires_at: Type.String({ format: "date-time" }),
});

export const UpdateStudentSessionSchema = Type.Partial(
  CreateStudentSessionSchema,
  {
    minProperties: 1,
  },
);

export type CreateStudentSessionData = Static<
  typeof CreateStudentSessionSchema
>;
export type UpdateStudentSessionData = Static<
  typeof UpdateStudentSessionSchema
>;
