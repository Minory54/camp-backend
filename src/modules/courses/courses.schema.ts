import { Type, type Static } from "typebox";

const nullableDate = Type.Union([Type.String({ format: "date-time" }), Type.Null()]);

export const CourseProgressResponseSchema = Type.Object({
  courseId: Type.Integer(),
  lessons: Type.Array(
    Type.Object({
      lessonId: Type.Integer(),
      theoryCompletedAt: nullableDate,
      practiceCompletedAt: nullableDate,
      testCompletedAt: nullableDate,
      isCompleted: Type.Boolean(),
      isAvailable: Type.Boolean(),
    }),
  ),
});

export const CourseResponseSchema = Type.Object({
  id: Type.Integer(),
  title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  description: Type.Union([Type.String(), Type.Null()]),
  Groups: Type.Optional(Type.Array(Type.Any())),
});

export const CourseIdSchema = Type.Object(
  {
    id: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
);

export const CreateCourseSchema = Type.Object(
  {
    title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
    description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  },
  { additionalProperties: false },
);

export const UpdateCourseSchema = Type.Partial(CreateCourseSchema, {
  minProperties: 1,
  additionalProperties: false,
});

export type CreateCourseData = Static<typeof CreateCourseSchema>;
export type UpdateCourseData = Static<typeof UpdateCourseSchema>;
