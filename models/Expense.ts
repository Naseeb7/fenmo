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
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ idempotencyKey: 1 }, { unique: true });
expenseSchema.index({ category: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ createdAt: -1 });
expenseSchema.index({ amount: -1 });

export type ExpenseDocument = InferSchemaType<typeof expenseSchema>;

export const Expense = models.Expense || model("Expense", expenseSchema);
