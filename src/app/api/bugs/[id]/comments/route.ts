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

    bugTrailEvents.emit("event", { type: "COMMENT_ADDED", payload: comment });

    // Check for @mentions
    const mentions = commentBody.match(/@(\w+)/g);
    if (mentions) {
      const uniqueMentions = Array.from(new Set(mentions.map((m: string) => m.substring(1))));
      uniqueMentions.forEach((username) => {
        bugTrailEvents.emit("event", { type: "MENTION", payload: { bugId: bug.key, username, authorName: comment.author?.name || "Someone" } });
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}