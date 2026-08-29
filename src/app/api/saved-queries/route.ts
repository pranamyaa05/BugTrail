import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const queries = await prisma.savedQuery.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(queries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, queryJson } = await req.json();
    
    if (!userId || !name || !queryJson) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const saved = await prisma.savedQuery.create({
      data: {
        userId,
        name,
        queryJson: JSON.stringify(queryJson),
      },
    });
    
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
