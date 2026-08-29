import { NextRequest, NextResponse } from "next/server";
import { runWhiningEngine } from "@/lib/whining";

/**
 * GET /api/cron/whining
 * Runs all active whining rules and returns their digest results.
 * In production this would be triggered by a cron scheduler (e.g. Vercel Cron, GitHub Actions).
 */
export async function GET(req: NextRequest) {
  try {
    const results = await runWhiningEngine();
    const totalStale = results.reduce((sum, r) => sum + r.staleBugs.length, 0);

    return NextResponse.json({
      success: true,
      rulesExecuted: results.length,
      totalStaleBugs: totalStale,
      digests: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
