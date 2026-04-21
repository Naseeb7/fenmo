import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .superRefine((value, ctx) => {
      try {
        const parsedUrl = new URL(value);
        const isMongoProtocol =
          parsedUrl.protocol === "mongodb:" || parsedUrl.protocol === "mongodb+srv:";

        if (!isMongoProtocol) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "MONGODB_URI must be a valid MongoDB connection string",
          });
        }

        if (!parsedUrl.pathname || parsedUrl.pathname === "/") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "MONGODB_URI must include a database name",
          });
        }

        if (parsedUrl.pathname.endsWith("/")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "MONGODB_URI database name must not end with a slash",
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "MONGODB_URI must be a valid MongoDB connection string",
        });
      }
    }),
});

export const env = envSchema.parse(process.env);
