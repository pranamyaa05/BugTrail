import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const activeTeamId = session.activeTeam?.id;

    const where: any = {};
    if (activeTeamId) {
      where.OR = [{ teamId: activeTeamId }, { teamId: null }];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        components: {
          include: {
            _count: {
              select: { bugs: true },
            },
          },
        },
        _count: {
          select: { bugs: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}