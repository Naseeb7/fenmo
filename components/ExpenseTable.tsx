import type { ExpenseRecord, ExpenseTableProps } from "@/types/expense";
import { formatExpenseCurrency, formatExpenseDate } from "@/utils/expenseDisplay";

export function ExpenseTable({ expenses }: ExpenseTableProps) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
        No expenses found for the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Description
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {expenses.map((expense) => (
            <tr key={expense._id}>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {formatExpenseDate(expense.date)}
              </td>
              <td className="px-4 py-3 text-sm capitalize text-zinc-700">{expense.category}</td>
              <td className="px-4 py-3 text-sm text-zinc-700">{expense.description}</td>
              <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">
                {formatExpenseCurrency(expense.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
