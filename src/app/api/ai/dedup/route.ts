import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Fetch some recent bugs to compare
    const bugs = await prisma.bug.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const lowerTitle = title.toLowerCase();
    const words = lowerTitle.split(/\s+/).filter((w: string) => w.length > 3);

    const duplicates = bugs
      .map((b) => {
        const bTitle = b.title.toLowerCase();
        let matchCount = 0;
        for (const w of words) {
          if (bTitle.includes(w)) matchCount++;
        }
        const score = words.length > 0 ? matchCount / words.length : 0;
        return { bug: b, score };
      })
      .filter((d) => d.score > 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return NextResponse.json({
      duplicates: duplicates.map((d) => ({
        ...d.bug,
        similarity: Math.round(d.score * 100),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
