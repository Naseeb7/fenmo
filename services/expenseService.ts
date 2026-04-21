import { Expense } from "@/models/Expense";
import type { ExpenseDashboardSummary, ExpenseRecord } from "@/types/expense";

type DashboardFacetResult = {
  totals: Array<{
    totalAmount: number;
    expenseCount: number;
  }>;
  highestExpense: Array<ExpenseRecord>;
  categoryTotals: Array<{
    category: string;
    totalAmount: number;
  }>;
  topCategories: Array<{
    category: string;
    totalAmount: number;
  }>;
};

export async function getExpenseDashboardSummary(): Promise<ExpenseDashboardSummary> {
  const [dashboardData] = await Expense.aggregate<DashboardFacetResult>([
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$amount" },
              expenseCount: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              totalAmount: 1,
              expenseCount: 1,
            },
          },
        ],
        highestExpense: [
          { $sort: { amount: -1, date: -1 } },
          { $limit: 1 },
          { $project: { __v: 0, idempotencyKey: 0 } },
        ],
        categoryTotals: [
          {
            $group: {
              _id: "$category",
              totalAmount: { $sum: "$amount" },
            },
          },
          { $sort: { totalAmount: -1, _id: 1 } },
          {
            $project: {
              _id: 0,
              category: "$_id",
              totalAmount: 1,
            },
          },
        ],
        topCategories: [
          {
            $group: {
              _id: "$category",
              totalAmount: { $sum: "$amount" },
            },
          },
          { $sort: { totalAmount: -1, _id: 1 } },
          { $limit: 3 },
          {
            $project: {
              _id: 0,
              category: "$_id",
              totalAmount: 1,
            },
          },
        ],
      },
    },
  ]);

  const totals = dashboardData?.totals[0];

  return {
    totalAmount: totals?.totalAmount ?? 0,
    expenseCount: totals?.expenseCount ?? 0,
    highestExpense: dashboardData?.highestExpense[0] ?? null,
    categoryTotals: dashboardData?.categoryTotals ?? [],
    topCategories: dashboardData?.topCategories ?? [],
  };
}
