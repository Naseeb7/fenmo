import { connectDB } from "@/lib/db";
import { Expense } from "@/models/Expense";

export async function GET() {
  try {
    await connectDB();

    const categories = await Expense.distinct("category");

    return Response.json(
      {
        success: true,
        data: categories,
      },
      { status: 200 }
    );
  } catch {
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
