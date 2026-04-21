export function sanitizeExpense<T extends { idempotencyKey?: string; __v?: number }>(
  expense: T
): Omit<T, "idempotencyKey" | "__v"> {
  const {
    idempotencyKey: _idempotencyKey,
    __v: _version,
    ...sanitizedExpense
  } = expense;

  return sanitizedExpense;
}
