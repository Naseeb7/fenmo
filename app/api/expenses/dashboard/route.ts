import { connectDB } from "@/lib/db";
import { getExpenseDashboardSummary } from "@/services/expenseService";

export async function GET() {
  try {
    await connectDB();

    const summary = await getExpenseDashboardSummary();

    return Response.json(
      {
        success: true,
        data: summary,
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
