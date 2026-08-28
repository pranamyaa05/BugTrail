import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { BUG_STATUSES, BUG_SEVERITIES, BUG_PRIORITIES } from "@/lib/workflow";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const priority = searchParams.get("priority");
    const productId = searchParams.get("productId");
    const componentId = searchParams.get("componentId");
    const assigneeId = searchParams.get("assigneeId");

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { key: { contains: search } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (severity && severity !== "ALL") {
      where.severity = severity;
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (productId && productId !== "ALL") {
      where.productId = productId;
    }

    if (componentId && componentId !== "ALL") {
      where.componentId = componentId;
    }

    if (assigneeId && assigneeId !== "ALL") {
      where.assigneeId = assigneeId;
    }

    const bugs = await prisma.bug.findMany({
      where,
      include: {
        product: { select: { id: true, name: true } },
        component: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { bugNumber: "desc" },
    });

    return NextResponse.json(bugs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      productId,
      componentId,
      reporterId,
      assigneeId,
      severity = "NORMAL",
      priority = "P3",
      status = "UNCONFIRMED",
      customFields = {},
    } = body;

    if (!title || !description || !productId || !componentId || !reporterId) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, productId, componentId, reporterId are required." },
        { status: 400 }
      );
    }

    // Get the next sequential bug number
    const maxBug = await prisma.bug.findFirst({
      orderBy: { bugNumber: "desc" },
      select: { bugNumber: true },
    });

    const nextNumber = (maxBug?.bugNumber ?? 100) + 1;
    const key = `BUG-${nextNumber}`;

    const newBug = await prisma.bug.create({
      data: {
        bugNumber: nextNumber,
        key,
        title,
        description,
        productId,
        componentId,
        reporterId,
        assigneeId: assigneeId || null,
        severity: BUG_SEVERITIES.includes(severity) ? severity : "NORMAL",
        priority: BUG_PRIORITIES.includes(priority) ? priority : "P3",
        status: BUG_STATUSES.includes(status) ? status : "UNCONFIRMED",
        customFields: JSON.stringify(customFields),
      },
      include: {
        product: true,
        component: true,
        reporter: true,
        assignee: true,
      },
    });

    // Record genesis audit log
    await recordAuditLog({
      bugId: newBug.id,
      actorId: reporterId,
      action: "CREATE",
      newValue: `Bug filed with status ${newBug.status}, priority ${newBug.priority}, severity ${newBug.severity}`,
    });

    return NextResponse.json(newBug, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}