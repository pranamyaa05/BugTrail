import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateStatusTransition, BugStatus, BugResolution } from "@/lib/workflow";
import { recordAuditLog } from "@/lib/audit";
import { bugTrailEvents } from "@/lib/events";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nextStatus, resolution, actorId, comment } = body;

    const session = await getSession(req);
    const effectiveActorId = actorId || session.user?.id;
    const effectiveRole = session.role || session.user?.role || "DEVELOPER";

    if (!nextStatus || !effectiveActorId) {
      return NextResponse.json(
        { error: "nextStatus and actorId are required parameters." },
        { status: 400 }
      );
    }

    // SERVER-SIDE RBAC ENFORCEMENT: Check permission
    if (!hasPermission(effectiveRole, "TRANSITION_STATUS")) {
      return NextResponse.json(
        { error: `Server-side Authorization Error: Users with role '${effectiveRole}' are not authorized to execute workflow status transitions.` },
        { status: 403 }
      );
    }

    const bug = await prisma.bug.findFirst({
      where: { OR: [{ id }, { key: id.toUpperCase() }] },
    });

    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    // Run Bugzilla state machine validation
    const validation = validateStatusTransition(
      bug.status as BugStatus,
      nextStatus as BugStatus,
      resolution as BugResolution
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.error,
          requiresResolution: validation.requiresResolution,
        },
        { status: 422 }
      );
    }

    const updateData: any = {
      status: nextStatus,
    };

    if (nextStatus === "RESOLVED") {
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();
    } else if (validation.clearsResolution) {
      updateData.resolution = null;
      updateData.resolvedAt = null;
    }

    const updatedBug = await prisma.bug.update({
      where: { id: bug.id },
      data: updateData,
      include: {
        product: true,
        component: true,
        reporter: true,
        assignee: true,
      },
    });

    // Record status change audit log
    await recordAuditLog({
      bugId: bug.id,
      actorId: effectiveActorId,
      action: "STATUS_CHANGE",
      fieldChanged: "status",
      oldValue: bug.status,
      newValue: nextStatus,
    });

    if (updateData.resolution !== undefined && updateData.resolution !== bug.resolution) {
      await recordAuditLog({
        bugId: bug.id,
        actorId: effectiveActorId,
        action: "RESOLUTION_CHANGE",
        fieldChanged: "resolution",
        oldValue: bug.resolution,
        newValue: updateData.resolution,
      });
    }

    // If an optional comment was attached to the transition
    if (comment && comment.trim().length > 0) {
      await prisma.comment.create({
        data: {
          bugId: bug.id,
          authorId: effectiveActorId,
          body: comment,
        },
      });

      await recordAuditLog({
        bugId: bug.id,
        actorId: effectiveActorId,
        action: "COMMENT",
        newValue: "Added status transition comment",
      });
    }

    bugTrailEvents.emit("event", { type: "STATUS_CHANGED", payload: updatedBug });

    return NextResponse.json({
      success: true,
      bug: updatedBug,
      message: `Status successfully updated to ${nextStatus}${updateData.resolution ? ` (${updateData.resolution})` : ""}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}