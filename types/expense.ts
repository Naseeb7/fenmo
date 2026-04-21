export type ExpenseFormValues = {
  amount: string;
  category: string;
  description: string;
  date: string;
};

export type ExpenseRecord = {
  _id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseFormProps = {
  onSuccess?: (expense: ExpenseRecord) => void | Promise<void>;
};

export type CreateExpenseResponse =
  | {
      success: true;
      data: ExpenseRecord;
    }
  | {
      success: false;
      error: string;
      errors?: Record<string, string>;
    };

export type ExpenseSortOrder =
  | "date_desc"
  | "date_asc"
  | "createdAt_desc"
  | "createdAt_asc";

export type GetExpensesResponse =
  | {
      success: true;
      data: ExpenseRecord[];
    }
  | {
      success: false;
      error: string;
    };

export type GetExpenseCategoriesResponse =
  | {
      success: true;
      data: string[];
    }
  | {
      success: false;
      error: string;
    };

export type ExpenseTableProps = {
  expenses: ExpenseRecord[];
  emptyMessage?: string;
};
