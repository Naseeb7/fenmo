export function formatExpenseCurrency(amountInPaise: number): string {
  return `₹${(amountInPaise / 100).toFixed(2)}`;
}

export function formatExpenseDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
