import { createHash } from "crypto";

type GenerateIdempotencyKeyParams = {
  amount: number;
  category: string;
  description: string;
  date: string | Date;
};

export function generateIdempotencyKey(
  params: GenerateIdempotencyKeyParams
): string {
  const normalizedPayload = {
    amount: params.amount,
    category: params.category.trim(),
    description: params.description.trim(),
    date:
      params.date instanceof Date
        ? params.date.toISOString()
        : new Date(params.date).toISOString(),
  };

  return createHash("sha256")
    .update(JSON.stringify(normalizedPayload))
    .digest("hex");
}
