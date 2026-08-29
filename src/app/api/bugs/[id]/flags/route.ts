import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { bugTrailEvents } from "@/lib/events";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { setterId, requesteeId, name, status } = await req.json();

    const bug = await prisma.bug.findFirst({ where: { OR: [{ id }, { key: id.toUpperCase() }] } });
    if (!bug) return NextResponse.json({ error: "Bug not found" }, { status: 404 });

    const flag = await prisma.flag.create({
      data: {
        bugId: bug.id,
        setterId,
        requesteeId: requesteeId || null,
        name,
        status,
      },
      include: { setter: true, requestee: true }
    });

    await recordAuditLog({
      bugId: bug.id,
      actorId: setterId,
      action: "UPDATE",
      fieldChanged: "flag",
      newValue: `${name}${status}`,
    });

    bugTrailEvents.emit("event", { type: "FLAG_ADDED", payload: flag });

    return NextResponse.json(flag, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
