import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { uploaderId, filename, fileUrl, fileSize, isPatch } = await req.json();

    const bug = await prisma.bug.findFirst({ where: { OR: [{ id }, { key: id.toUpperCase() }] } });
    if (!bug) return NextResponse.json({ error: "Bug not found" }, { status: 404 });

    const attachment = await prisma.attachment.create({
      data: {
        bugId: bug.id,
        uploaderId,
        filename,
        fileUrl,
        fileSize,
        isPatch: isPatch || false,
      },
      include: { uploader: true }
    });

    await recordAuditLog({
      bugId: bug.id,
      actorId: uploaderId,
      action: "UPDATE",
      fieldChanged: "attachment",
      newValue: `Attached file ${filename}`,
    });

    const { bugTrailEvents } = await import("@/lib/events");
    bugTrailEvents.emit("event", { type: "ATTACHMENT_ADDED", payload: attachment });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
