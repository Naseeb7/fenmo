import { model, models, Schema, type InferSchemaType } from "mongoose";

const expenseSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number) => Number.isInteger(value) && value > 0,
        message: "Amount must be a positive integer in paise",
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export type ExpenseDocument = InferSchemaType<typeof expenseSchema>;

export const Expense = models.Expense || model("Expense", expenseSchema);
