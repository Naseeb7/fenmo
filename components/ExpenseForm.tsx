"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import type {
  CreateExpenseResponse,
  ExpenseFormProps,
  ExpenseFormValues,
} from "@/types/expense";

function getTodayDateValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function getInitialFormValues(): ExpenseFormValues {
  return {
    amount: "",
    category: "",
    description: "",
    date: getTodayDateValue(),
  };
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [formValues, setFormValues] =
    useState<ExpenseFormValues>(getInitialFormValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: formValues.amount,
          category: formValues.category,
          description: formValues.description,
          date: formValues.date,
        }),
      });

      const payload = (await response.json()) as CreateExpenseResponse;

      if (!response.ok || !payload.success) {
        setErrorMessage(
          "error" in payload ? payload.error : "Failed to create expense",
        );
        return;
      }

      setFormValues(getInitialFormValues());
      onSuccess?.(payload.data);
    } catch {
      setErrorMessage("Failed to create expense");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">Amount (INR)</span>
        <input
          required
          min="1"
          step="1"
          type="number"
          name="amount"
          value={formValues.amount}
          onChange={handleChange}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">Category</span>
        <input
          required
          type="text"
          name="category"
          value={formValues.category}
          onChange={handleChange}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">Description</span>
        <input
          required
          type="text"
          name="description"
          value={formValues.description}
          onChange={handleChange}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">Date</span>
        <input
          required
          type="date"
          name="date"
          value={formValues.date}
          onChange={handleChange}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </label>

      {errorMessage ? (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving expense..." : "Add Expense"}
      </button>
    </form>
  );
}
