import { Type, type Static } from "typebox";

export const LessonProgressResponseSchema = Type.Object({
  id: Type.Integer(),
  id_student: Type.String({ format: "uuid" }),
  id_lesson: Type.Integer({ minimum: 1 }),
  theory_completed_at: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  practice_completed_at: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  test_completed_at: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  student: Type.Optional(Type.Any()),
  lesson: Type.Optional(Type.Any()),
});

export const LessonProgressIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
});

export const LessonProgressFilterSchema = Type.Object({
  studentId: Type.Optional(Type.String({ format: "uuid" })),
  lessonId: Type.Optional(Type.Integer({ minimum: 1 })),
});

export const CreateLessonProgressSchema = Type.Object({
  id_student: Type.String({ format: "uuid" }),
  id_lesson: Type.Integer({ minimum: 1 }),
  theory_completed_at: Type.Optional(
    Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  ),
});

// export const UpdateLessonProgressSchema = Type.Partial(
//   CreateLessonProgressSchema,
//   {
//     minProperties: 1,
//   },
// );

export type CreateLessonProgressData = Static<typeof CreateLessonProgressSchema>;
// export type UpdateLessonProgressData = Static<typeof UpdateLessonProgressSchema>;
export type LessonProgressQuery = Static<typeof LessonProgressFilterSchema>;
