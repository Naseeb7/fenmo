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

export function formatExpenseCategory(category: string): string {
  return category
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
