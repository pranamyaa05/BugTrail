import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/whining-rules/[id]
 * Update a whining rule (toggle active, change thresholds, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, statuses, staleDays, severities, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (statuses !== undefined) updateData.statuses = statuses;
    if (staleDays !== undefined) updateData.staleDays = staleDays;
    if (severities !== undefined) updateData.severities = severities;
    if (isActive !== undefined) updateData.isActive = isActive;

    const rule = await prisma.whiningRule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(rule);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/whining-rules/[id]
 * Delete a whining rule.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.whiningRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
