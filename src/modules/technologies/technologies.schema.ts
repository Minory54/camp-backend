import { Type, type Static } from "typebox";
import { TheoryResponseSchema } from "../theories/theories.schema.js";

export const TechnologyResponseSchema = Type.Object({
  id: Type.Integer(),
  title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  Theories: Type.Optional(Type.Array(Type.Pick(TheoryResponseSchema, ["id", "title", "position"]))),
});

export const TechnologyIdSchema = Type.Object(
  {
    id: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
);

export const CreateTechnologySchema = Type.Object(
  {
    title: Type.String({ minLength: 1, maxLength: 255, pattern: "\\S" }),
  },
  { additionalProperties: false },
);

export const UpdateTechnologySchema = Type.Partial(CreateTechnologySchema, {
  minProperties: 1,
  additionalProperties: false,
});

export type CreateTechnologyData = Static<typeof CreateTechnologySchema>;
export type UpdateTechnologyData = Static<typeof UpdateTechnologySchema>;
