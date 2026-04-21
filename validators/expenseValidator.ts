import { z } from "zod";

const numericAmountPattern = /^\d+(?:\.\d{1,2})?$/;

const rupeeAmountSchema = z.union([z.number(), z.string()]).transform((value, ctx) => {
  let normalizedValue: number;

  if (typeof value === "number") {
    normalizedValue = value;
  } else {
    const trimmedValue = value.trim();

    if (!numericAmountPattern.test(trimmedValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount must be a valid number with up to two decimal places",
      });

      return z.NEVER;
    }

    normalizedValue = Number(trimmedValue);
  }

  if (!Number.isFinite(normalizedValue)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount must be a valid number",
    });

    return z.NEVER;
  }

  const roundedValue = Math.round(normalizedValue * 100);

  if (!Number.isInteger(normalizedValue * 100)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount can have at most two decimal places",
    });

    return z.NEVER;
  }

  if (roundedValue <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount must be greater than zero",
    });

    return z.NEVER;
  }

  return roundedValue;
});

const expenseDateSchema = z.union([z.string(), z.date()]).transform((value, ctx) => {
  const parsedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Date must be a valid date",
    });

    return z.NEVER;
  }

  return parsedDate;
});

export const createExpenseSchema = z.object({
  amount: rupeeAmountSchema,
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .transform((value) => value.toLowerCase()),
  description: z.string().trim().min(1, "Description is required"),
  date: expenseDateSchema,
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
