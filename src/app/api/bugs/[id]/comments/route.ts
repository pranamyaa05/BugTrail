import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { authorId, body: commentBody } = body;

    if (!authorId || !commentBody || !commentBody.trim()) {
      return NextResponse.json(
        { error: "authorId and non-empty comment body are required." },
        { status: 400 }
      );
    }

    const bug = await prisma.bug.findFirst({
      where: { OR: [{ id }, { key: id.toUpperCase() }] },
    });

    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        bugId: bug.id,
        authorId,
        body: commentBody.trim(),
      },
      include: {
        author: true,
      },
    });

    await recordAuditLog({
      bugId: bug.id,
      actorId: authorId,
      action: "COMMENT",
      newValue: `Added comment #${comment.id}`,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}