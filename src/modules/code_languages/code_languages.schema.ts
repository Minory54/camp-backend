import { Type, Static } from "typebox";

// СХЕМА ОТВЕТА
export const CodeLanguageResponseSchema = Type.Object({
  id: Type.Integer(),
  title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
});

// СХЕМА ДЛЯ ПАРАМЕТРА ID
export const CodeLanguageIdSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
});

// СХЕМА ДЛЯ СОЗДАНИЯ
export const CreateCodeLanguageSchema = Type.Object(
  {
    title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  },
  { additionalProperties: false },
);

// СХЕМА ДЛЯ ОБНОВЛЕНИЯ
export const UpdateCodeLanguageSchema = Type.Partial(CreateCodeLanguageSchema, {
  minProperties: 1,
  additionalProperties: false,
});

// ТИПЫ
export type CreateCodeLanguageData = Static<typeof CreateCodeLanguageSchema>;
export type UpdateCodeLanguageData = Static<typeof UpdateCodeLanguageSchema>;
