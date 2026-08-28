import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
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