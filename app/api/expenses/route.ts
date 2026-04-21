import { connectDB } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { generateIdempotencyKey } from "@/utils/idempotencyKey";
import { createExpenseSchema } from "@/validators/expenseValidator";
import { ZodError } from "zod";

type DuplicateKeyError = {
  code?: number;
};

function formatValidationErrors(error: ZodError) {
  return error.issues.reduce<Record<string, string>>((accumulator, issue) => {
    const field = issue.path.join(".") || "form";

    if (!(field in accumulator)) {
      accumulator[field] = issue.message;
    }

    return accumulator;
  }, {});
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          error: "Invalid JSON body",
        },
        { status: 400 }
      );
    }

    const validatedInput = createExpenseSchema.parse(body);
    const idempotencyKey = generateIdempotencyKey({
      amount: validatedInput.amount,
      category: validatedInput.category,
      description: validatedInput.description,
      date: validatedInput.date,
    });

    await connectDB();

    const existingExpense = await Expense.findOne({ idempotencyKey }).lean();

    if (existingExpense) {
      return Response.json(
        {
          success: true,
          data: existingExpense,
        },
        { status: 200 }
      );
    }

    try {
      const expense = await Expense.create({
        amount: validatedInput.amount,
        category: validatedInput.category,
        description: validatedInput.description,
        date: validatedInput.date,
        idempotencyKey,
      });

      return Response.json(
        {
          success: true,
          data: expense.toObject(),
        },
        { status: 201 }
      );
    } catch (error) {
      if ((error as DuplicateKeyError).code === 11000) {
        const duplicateExpense = await Expense.findOne({ idempotencyKey }).lean();

        if (duplicateExpense) {
          return Response.json(
            {
              success: true,
              data: duplicateExpense,
            },
            { status: 200 }
          );
        }
      }

      throw error;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          success: false,
          error: "Validation failed",
          errors: formatValidationErrors(error),
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
