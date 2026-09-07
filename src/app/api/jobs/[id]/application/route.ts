import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApplicationService } from "@/lib/applications/application-service";
import { isValidApplicationStatus } from "@/lib/applications/types";

/**
 * GET /api/jobs/[id]/application
 *
 * Retrieves the application tracking record for the specified Job.
 *
 * Security:
 * 1. Requires active session.
 * 2. Scoped strictly to authenticated user (IDOR protection).
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await context.params;
    if (!jobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    const application = await ApplicationService.getApplicationByJobId(userId, jobId);

    return NextResponse.json({ application });
  } catch (error: any) {
    console.error("[Get Application Error]:", error?.message || "Internal server error");
    return NextResponse.json({ error: "Failed to retrieve application" }, { status: 500 });
  }
}

/**
 * POST /api/jobs/[id]/application
 *
 * Creates or gets the application tracking record for the specified Job.
 *
 * Security:
 * 1. Requires active session.
 * 2. Scoped strictly to authenticated user's Job.
 * 3. Never triggers AI analysis.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await context.params;
    if (!jobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { status, appliedAt, notes } = body;

    if (status && !isValidApplicationStatus(status)) {
      return NextResponse.json({ error: `Invalid application status '${status}'` }, { status: 400 });
    }

    const application = await ApplicationService.createOrGetApplication({
      userId,
      jobId,
      status,
      appliedAt,
      notes,
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error: any) {
    console.error("[Create Application Error]:", error?.message || "Internal server error");
    const status = error.message?.startsWith("Not Found") ? 404 : error.message?.startsWith("Bad Request") ? 400 : 500;
    return NextResponse.json({ error: error.message || "Failed to create application" }, { status });
  }
}

/**
 * PATCH /api/jobs/[id]/application
 *
 * Updates status, notes, or appliedAt date for the specified Job.
 *
 * Security:
 * 1. Requires active session.
 * 2. Scoped strictly to authenticated user's Job (IDOR protection).
 * 3. Zero AI invocations.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await context.params;
    if (!jobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { status, appliedAt, notes } = body;

    if (status !== undefined && !isValidApplicationStatus(status)) {
      return NextResponse.json({ error: `Invalid application status '${status}'` }, { status: 400 });
    }

    const application = await ApplicationService.updateApplication({
      userId,
      jobId,
      status,
      appliedAt,
      notes,
    });

    return NextResponse.json({ application });
  } catch (error: any) {
    console.error("[Update Application Error]:", error?.message || "Internal server error");
    const status = error.message?.startsWith("Not Found") ? 404 : error.message?.startsWith("Bad Request") ? 400 : 500;
    return NextResponse.json({ error: error.message || "Failed to update application" }, { status });
  }
}

/**
 * DELETE /api/jobs/[id]/application
 *
 * Deletes the application tracking record.
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await context.params;
    if (!jobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    const success = await ApplicationService.deleteApplication(userId, jobId);

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error("[Delete Application Error]:", error?.message || "Internal server error");
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
