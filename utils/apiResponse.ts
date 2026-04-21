import type { ZodError } from "zod";

export function formatValidationErrors(error: ZodError): Record<string, string> {
  return error.issues.reduce<Record<string, string>>((accumulator, issue) => {
    const field = issue.path.join(".") || "form";

    if (!(field in accumulator)) {
      accumulator[field] = issue.message;
    }

    return accumulator;
  }, {});
}
