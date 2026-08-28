import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuditChain } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bug = await prisma.bug.findFirst({
      where: { OR: [{ id }, { key: id.toUpperCase() }] },
      select: { id: true, key: true },
    });

    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const result = await verifyAuditChain(bug.id);
    return NextResponse.json({
      bugKey: bug.key,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}