"use client";

import { useEffect, useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseTable } from "@/components/ExpenseTable";
import type {
  ExpenseRecord,
  ExpenseSortOrder,
  GetExpenseCategoriesResponse,
  GetExpensesResponse,
} from "@/types/expense";
import { formatExpenseCurrency } from "@/utils/expenseDisplay";

const sortOptions: Array<{ label: string; value: ExpenseSortOrder }> = [
  { label: "Expense date: newest first", value: "date_desc" },
  { label: "Expense date: oldest first", value: "date_asc" },
  { label: "Created time: newest first", value: "createdAt_desc" },
  { label: "Created time: oldest first", value: "createdAt_asc" },
];

export function ExpenseDashboard() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState<ExpenseSortOrder>("date_desc");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadCategories() {
      try {
        const response = await fetch("/api/expenses/categories");
        const payload = (await response.json()) as GetExpenseCategoriesResponse;

        if (!response.ok || !payload.success) {
          return;
        }

        if (isActive) {
          setCategories(payload.data);
        }
      } catch {
        // Keep the filter usable even if categories fail to load.
      }
    }

    void loadCategories();

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;

    async function loadExpenses() {
      try {
        const searchParams = new URLSearchParams();

        if (selectedCategory.trim()) {
          searchParams.set("category", selectedCategory.trim());
        }

        searchParams.set("sort", sortOrder);

        const query = searchParams.toString();
        const response = await fetch(`/api/expenses${query ? `?${query}` : ""}`, {
          signal: abortController.signal,
        });
        const payload = (await response.json()) as GetExpensesResponse;

        if (!response.ok || !payload.success) {
          if (isActive) {
            setError("error" in payload ? payload.error : "Failed to load expenses");
          }
          return;
        }

        if (isActive) {
          setExpenses(payload.data);
          setError(null);
        }
      } catch (fetchError) {
        if (
          isActive &&
          !(fetchError instanceof DOMException && fetchError.name === "AbortError")
        ) {
          setError("Network error. Please retry.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadExpenses();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [refreshKey, selectedCategory, sortOrder]);

  function handleCategoryChange(category: string) {
    setLoading(true);
    setError(null);
    setSelectedCategory(category);
  }

  function handleSortChange(sort: ExpenseSortOrder) {
    setLoading(true);
    setError(null);
    setSortOrder(sort);
  }

  function handleExpenseCreated() {
    setLoading(true);
    setError(null);
    setRefreshKey((currentKey) => currentKey + 1);
  }

  const totalVisibleAmount = expenses.reduce(
    (runningTotal, expense) => runningTotal + expense.amount,
    0
  );
  const emptyMessage = selectedCategory.trim()
    ? "No expenses found for the current filters."
    : "No expenses recorded yet.";

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Expense Tracker
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            Track spending with a backend-first workflow.
          </h1>
        </div>
        <ExpenseForm onSuccess={handleExpenseCreated} />
      </div>

      <div className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">Filter by category</span>
          <select
            value={selectedCategory}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">Sort by</span>
          <select
            value={sortOrder}
            onChange={(event) => handleSortChange(event.target.value as ExpenseSortOrder)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl bg-zinc-950 px-4 py-3 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Visible total</p>
          <p className="mt-1 text-2xl font-semibold">{formatExpenseCurrency(totalVisibleAmount)}</p>
        </div>
      </div>

      {loading ? <p className="text-sm text-zinc-600">Loading expenses...</p> : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {!loading && !error ? (
        <ExpenseTable expenses={expenses} emptyMessage={emptyMessage} />
      ) : null}
    </section>
  );
}
