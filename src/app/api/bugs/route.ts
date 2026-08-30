import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { BUG_STATUSES, BUG_SEVERITIES, BUG_PRIORITIES } from "@/lib/workflow";
import { bugTrailEvents } from "@/lib/events";
import { getSession } from "@/lib/auth";

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
    const teamId = searchParams.get("teamId");

    const session = await getSession(req);
    const activeTeamId = teamId || session.activeTeam?.id;

    const where: any = {};

    if (activeTeamId) {
      where.OR = [
        { teamId: activeTeamId },
        { teamId: null }, // Include legacy demo bugs
      ];
    }

    if (search) {
      const searchCondition = [
        { title: { contains: search } },
        { description: { contains: search } },
        { key: { contains: search } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
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
    const session = await getSession(req);
    const body = await req.json();
    const {
      title,
      description,
      productId,
      productName,
      componentId,
      componentName,
      reporterId,
      assigneeId,
      severity = "NORMAL",
      priority = "P3",
      status = "UNCONFIRMED",
      customFields = {},
    } = body;

    const effectiveReporterId = reporterId || session.user?.id;
    const effectiveTeamId = session.activeTeam?.id;

    if (!title || !description || (!productId && !productName) || (!componentId && !componentName) || !effectiveReporterId) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, Product, Component, and reporterId are required." },
        { status: 400 }
      );
    }

    // Resolve or auto-create Product if custom name typed
    let targetProductId = productId;
    if (!targetProductId || targetProductId === "CUSTOM") {
      const pName = (productName || "Custom Product").trim();
      let prod = await prisma.product.findFirst({ where: { name: pName } });
      if (!prod) {
        prod = await prisma.product.create({
          data: {
            name: pName,
            description: `Custom Product created via File Bug`,
            teamId: effectiveTeamId,
          },
        });
      }
      targetProductId = prod.id;
    }

    // Resolve or auto-create Component if custom name typed
    let targetComponentId = componentId;
    if (!targetComponentId || targetComponentId === "CUSTOM") {
      const cName = (componentName || "General Component").trim();
      let comp = await prisma.component.findFirst({
        where: { productId: targetProductId, name: cName },
      });
      if (!comp) {
        comp = await prisma.component.create({
          data: {
            productId: targetProductId,
            name: cName,
            description: "Custom Component created via File Bug",
          },
        });
      }
      targetComponentId = comp.id;
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
        title: title.trim(),
        description: description.trim(),
        teamId: effectiveTeamId,
        productId: targetProductId,
        componentId: targetComponentId,
        reporterId: effectiveReporterId,
        assigneeId: assigneeId || null,
        severity: severity || "NORMAL",
        priority: priority || "P3",
        status: status || "UNCONFIRMED",
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
      actorId: effectiveReporterId,
      action: "CREATE",
      newValue: `Bug filed with status ${newBug.status}, priority ${newBug.priority}, severity ${newBug.severity}`,
    });

    bugTrailEvents.emit("event", { type: "BUG_CREATED", payload: newBug });

    return NextResponse.json(newBug, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}