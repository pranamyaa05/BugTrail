import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog, verifyAuditChain } from "@/lib/audit";
import { bugTrailEvents } from "@/lib/events";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bug = await prisma.bug.findFirst({
      where: {
        OR: [{ id }, { key: id.toUpperCase() }],
      },
      include: {
        product: true,
        component: true,
        reporter: true,
        assignee: true,
        ccList: {
          include: { user: true }
        },
        flags: {
          include: { setter: true, requestee: true }
        },
        attachments: {
          include: { uploader: true }
        },
        comments: {
          include: {
            author: true,
          },
          orderBy: { createdAt: "asc" },
        },
        auditLogs: {
          include: {
            actor: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const auditVerification = await verifyAuditChain(bug.id);

    return NextResponse.json({
      ...bug,
      auditVerification,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { actorId, assigneeId, severity, priority, title, description, customFields } = body;

    const existingBug = await prisma.bug.findFirst({
      where: { OR: [{ id }, { key: id.toUpperCase() }] },
    });

    if (!existingBug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const updates: any = {};
    const auditEntries: Array<{ field: string; oldVal: string | null; newVal: string | null; action: "UPDATE" | "ASSIGN" }> = [];

    if (assigneeId !== undefined && assigneeId !== existingBug.assigneeId) {
      updates.assigneeId = assigneeId || null;
      auditEntries.push({
        field: "assigneeId",
        oldVal: existingBug.assigneeId,
        newVal: assigneeId || null,
        action: "ASSIGN",
      });
    }

    if (severity && severity !== existingBug.severity) {
      updates.severity = severity;
      auditEntries.push({
        field: "severity",
        oldVal: existingBug.severity,
        newVal: severity,
        action: "UPDATE",
      });
    }

    if (priority && priority !== existingBug.priority) {
      updates.priority = priority;
      auditEntries.push({
        field: "priority",
        oldVal: existingBug.priority,
        newVal: priority,
        action: "UPDATE",
      });
    }

    if (title && title !== existingBug.title) {
      updates.title = title;
      auditEntries.push({
        field: "title",
        oldVal: existingBug.title,
        newVal: title,
        action: "UPDATE",
      });
    }

    if (description && description !== existingBug.description) {
      updates.description = description;
      auditEntries.push({
        field: "description",
        oldVal: (existingBug.description || "").slice(0, 200),
        newVal: (description || "").slice(0, 200),
        action: "UPDATE",
      });
    }

    if (customFields) {
      updates.customFields = JSON.stringify(customFields);
    }

    const updatedBug = await prisma.bug.update({
      where: { id: existingBug.id },
      data: updates,
      include: {
        product: true,
        component: true,
        reporter: true,
        assignee: true,
      },
    });

    // Record audit entries if actorId provided
    if (actorId) {
      for (const entry of auditEntries) {
        await recordAuditLog({
          bugId: updatedBug.id,
          actorId,
          action: entry.action,
          fieldChanged: entry.field,
          oldValue: entry.oldVal,
          newValue: entry.newVal,
        });
      }
    }

    bugTrailEvents.emit("event", { type: "BUG_UPDATED", payload: updatedBug });

    return NextResponse.json(updatedBug);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}