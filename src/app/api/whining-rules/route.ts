import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/whining-rules
 * List all whining rules.
 */
export async function GET() {
  try {
    const rules = await prisma.whiningRule.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rules);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/whining-rules
 * Create a new whining rule.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, statuses, staleDays, severities, isActive } = body;

    if (!name || !statuses) {
      return NextResponse.json(
        { error: "name and statuses are required." },
        { status: 400 }
      );
    }

    const rule = await prisma.whiningRule.create({
      data: {
        name,
        description: description || null,
        statuses, // Comma-separated string e.g. "NEW,UNCONFIRMED"
        staleDays: staleDays || 3,
        severities: severities || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
