import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
      (value) => {
        try {
          const parsedUrl = new URL(value);

          return parsedUrl.protocol === "mongodb:" || parsedUrl.protocol === "mongodb+srv:";
        } catch {
          return false;
        }
      },
      "MONGODB_URI must be a valid MongoDB connection string"
    ),
});

export const env = envSchema.parse(process.env);
