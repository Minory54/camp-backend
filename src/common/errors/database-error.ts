import { ResponseError } from "./response.error.js";

export async function write<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (typeof error === "object" && error !== null && "sqlState" in error) {
      if (error.sqlState === "23505") {
        throw new ResponseError(409, "Запись с такими данными уже существует");
      }

      if (error.sqlState === "23514") {
        throw new ResponseError(400, "Данные нарушают ограничение модели");
      }

      if (error.sqlState === "23503") {
        throw new ResponseError(409, "Операция нарушает связь между записями");
      }
    }

    throw error;
  }
}
