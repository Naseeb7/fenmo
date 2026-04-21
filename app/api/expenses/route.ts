import { connectDB } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { formatValidationErrors } from "@/utils/apiResponse";
import { sanitizeExpense } from "@/utils/expenseResponse";
import { generateIdempotencyKey } from "@/utils/idempotencyKey";
import { createExpenseSchema } from "@/validators/expenseValidator";
import { ZodError } from "zod";

type DuplicateKeyError = {
  code?: number;
};

const DEFAULT_EXPENSE_SORT = "date_desc";

const expenseSortOptions = {
  date_desc: { date: -1 as const },
  date_asc: { date: 1 as const },
  createdAt_desc: { createdAt: -1 as const },
  createdAt_asc: { createdAt: 1 as const },
};

type ExpenseSortOption = keyof typeof expenseSortOptions;

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const rawCategory = searchParams.get("category");
    const rawSort = searchParams.get("sort");
    const category = rawCategory ? rawCategory.trim().toLowerCase() : undefined;
    const sort =
      rawSort && rawSort in expenseSortOptions
        ? (rawSort as ExpenseSortOption)
        : DEFAULT_EXPENSE_SORT;

    const query: Record<string, unknown> = {};

    if (category) {
      query.category = category;
    }

    const sortOption = expenseSortOptions[sort];

    const expenses = await Expense.find(query).sort(sortOption).lean();

    return Response.json(
      {
        success: true,
        data: expenses.map((expense) => sanitizeExpense(expense)),
      },
      { status: 200 }
    );
  } catch {
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
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
    const normalizedCategory = validatedInput.category.toLowerCase();
    const idempotencyKey = generateIdempotencyKey({
      amount: validatedInput.amount,
      category: normalizedCategory,
      description: validatedInput.description,
      date: validatedInput.date,
    });

    await connectDB();

    const existingExpense = await Expense.findOne({ idempotencyKey }).lean();

    if (existingExpense) {
      return Response.json(
        {
          success: true,
          data: sanitizeExpense(existingExpense),
        },
        { status: 200 }
      );
    }

    try {
      const expense = await Expense.create({
        amount: validatedInput.amount,
        category: normalizedCategory,
        description: validatedInput.description,
        date: validatedInput.date,
        idempotencyKey,
      });

      return Response.json(
        {
          success: true,
          data: sanitizeExpense(expense.toObject()),
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
              data: sanitizeExpense(duplicateExpense),
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
