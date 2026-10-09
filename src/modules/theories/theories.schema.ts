import { Type, type Static } from "typebox";

// Структура теории
export const TheoryResponseSchema = Type.Object({
  id: Type.Integer(),
  title: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  id_technology: Type.Integer(),
  position: Type.Integer(),
  mdx_source: Type.String(),
  technology: Type.Optional(Type.Any()),
});

// Параметры URL
export const TheoryIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
});

// Фильтрация теорий по технологии
export const TheoriesFilterSchema = Type.Object({
  technologyId: Type.Optional(Type.Integer({ minimum: 1 })),
});

// Создание теории
export const CreateTheorySchema = Type.Object(
  {
    title: Type.String({ minLength: 1, maxLength: 255 }),
    description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    id_technology: Type.Integer({ minimum: 1 }),
    position: Type.Integer({ minimum: 1 }),
    mdx_source: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export const UpdateTheorySchema = Type.Partial(CreateTheorySchema, {
  minProperties: 1,
  additionalProperties: false,
});

export type CreateTheoryData = Static<typeof CreateTheorySchema>;
export type UpdateTheoryData = Static<typeof UpdateTheorySchema>;
