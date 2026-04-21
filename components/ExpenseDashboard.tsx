"use client";

import { useEffect, useRef, useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseTable } from "@/components/ExpenseTable";
import type { ExpenseRecord, ExpenseSortOrder, GetExpensesResponse } from "@/types/expense";
import { formatExpenseCurrency } from "@/utils/expenseDisplay";

export function ExpenseDashboard() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState<ExpenseSortOrder>("date_desc");
  const inFlightRequestRef = useRef<AbortController | null>(null);

  async function fetchExpenses() {
    if (inFlightRequestRef.current) {
      return;
    }

    const abortController = new AbortController();
    const searchParams = new URLSearchParams();

    if (selectedCategory.trim()) {
      searchParams.set("category", selectedCategory.trim());
    }

    searchParams.set("sort", sortOrder);

    inFlightRequestRef.current = abortController;
    setLoading(true);
    setError(null);

    try {
      const query = searchParams.toString();
      const response = await fetch(`/api/expenses${query ? `?${query}` : ""}`, {
        signal: abortController.signal,
      });
      const payload = (await response.json()) as GetExpensesResponse;

      if (!response.ok || !payload.success) {
        setError("error" in payload ? payload.error : "Failed to load expenses");
        return;
      }

      setExpenses(payload.data);
    } catch (fetchError) {
      if (!(fetchError instanceof DOMException && fetchError.name === "AbortError")) {
        setError("Failed to load expenses");
      }
    } finally {
      if (inFlightRequestRef.current === abortController) {
        inFlightRequestRef.current = null;
      }

      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchExpenses();

    return () => {
      inFlightRequestRef.current?.abort();
      inFlightRequestRef.current = null;
    };
  }, [selectedCategory, sortOrder]);

  function handleSortToggle() {
    setSortOrder((currentSortOrder) =>
      currentSortOrder === "date_desc" ? "date_asc" : "date_desc"
    );
  }

  const totalVisibleAmount = expenses.reduce(
    (runningTotal, expense) => runningTotal + expense.amount,
    0
  );

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
        <ExpenseForm onSuccess={fetchExpenses} />
      </div>

      <div className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">Filter by category</span>
          <input
            type="text"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            placeholder="e.g. food"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <button
          type="button"
          onClick={handleSortToggle}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
        >
          Sort: {sortOrder === "date_desc" ? "Newest first" : "Oldest first"}
        </button>

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
      {!loading && !error ? <ExpenseTable expenses={expenses} /> : null}
    </section>
  );
}
