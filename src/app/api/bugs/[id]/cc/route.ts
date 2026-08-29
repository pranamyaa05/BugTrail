import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bugTrailEvents } from "@/lib/events";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await req.json();

    const bug = await prisma.bug.findFirst({ where: { OR: [{ id }, { key: id.toUpperCase() }] } });
    if (!bug) return NextResponse.json({ error: "Bug not found" }, { status: 404 });

    const cc = await prisma.bugCC.create({
      data: {
        bugId: bug.id,
        userId,
      },
      include: { user: true }
    });

    bugTrailEvents.emit("event", { type: "CC_ADDED", payload: { bugId: bug.key, userId, userName: cc.user.name } });

    return NextResponse.json(cc, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Already on CC list" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const bug = await prisma.bug.findFirst({ where: { OR: [{ id }, { key: id.toUpperCase() }] } });
    if (!bug) return NextResponse.json({ error: "Bug not found" }, { status: 404 });

    await prisma.bugCC.delete({
      where: {
        bugId_userId: {
          bugId: bug.id,
          userId,
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
