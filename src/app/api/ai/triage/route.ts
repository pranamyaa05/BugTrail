import { NextRequest, NextResponse } from "next/server";
import { suggestTriage } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();

    if (!title && !description) {
      return NextResponse.json({ error: "Missing title or description" }, { status: 400 });
    }

    const suggestion = await suggestTriage(title || "", description || "");

    return NextResponse.json({
      severity: suggestion.severity,
      priority: suggestion.priority,
      componentId: null, // Gemini can't easily guess componentId without the database taxonomy context
      rationale: suggestion.explanation,
    });
  } catch (error: any) {
    console.error("Auto-Triage API error:", error);
    return NextResponse.json({ error: "Failed to run auto-triage" }, { status: 500 });
  }
}
