export function sanitizeExpense<T extends { idempotencyKey?: string }>(
  expense: T
): Omit<T, "idempotencyKey"> {
  const { idempotencyKey: _idempotencyKey, ...sanitizedExpense } = expense;

  return sanitizedExpense;
}
