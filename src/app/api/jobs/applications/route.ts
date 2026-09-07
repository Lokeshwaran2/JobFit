import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApplicationService } from "@/lib/applications/application-service";

/**
 * GET /api/jobs/applications
 *
 * Retrieves tracked jobs and applications for the Job Dashboard.
 * Supports status filtering, search by company/title/location, and sorting.
 *
 * Security: Strictly scoped to authenticated user session.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "recent_updated";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const result = await ApplicationService.listDashboardItems(userId, {
      status,
      search,
      sort,
      limit,
      skip,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[List Applications Error]:", error?.message || "Internal server error");
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }
}
