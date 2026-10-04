import { Type, type Static } from "typebox";

export const StudentResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  display_code: Type.String({ minLength: 1, pattern: "\\S" }),
  recovery_code: Type.String({ minLength: 1, pattern: "\\S" }),
  label: Type.Union([Type.String(), Type.Null()]),
  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
  Student_sessions: Type.Optional(Type.Array(Type.Any())),
  Lesson_progress: Type.Optional(Type.Array(Type.Any())),
  Practice_saves: Type.Optional(Type.Array(Type.Any())),
});

export const StudentIdSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
});

export const CreateStudentSchema = Type.Object({
  display_code: Type.String({ minLength: 1, pattern: "\\S" }),
  recovery_code: Type.String({ minLength: 1, pattern: "\\S" }),
  label: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const UpdateStudentSchema = Type.Partial(CreateStudentSchema, {
  minProperties: 1,
});

export type CreateStudentData = Static<typeof CreateStudentSchema>;
export type UpdateStudentData = Static<typeof UpdateStudentSchema>;
