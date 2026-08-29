import { prisma } from "./prisma";

export interface WhiningDigestResult {
  ruleId: string;
  ruleName: string;
  staleBugs: any[];
  staleDays: number;
  statuses: string[];
  severities: string[] | null;
}

/**
 * Run all active whining rules and return their digests.
 * Each rule defines which statuses to monitor and how many days of inactivity
 * constitutes a "stale" bug.
 */
export async function runWhiningEngine(): Promise<WhiningDigestResult[]> {
  const rules = await prisma.whiningRule.findMany({
    where: { isActive: true },
  });

  // If no custom rules exist, fall back to the default "NEW for >3 days" behaviour
  if (rules.length === 0) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const staleBugs = await prisma.bug.findMany({
      where: {
        status: "NEW",
        updatedAt: { lt: threeDaysAgo },
      },
      include: {
        product: true,
        component: true,
        reporter: true,
        assignee: true,
      },
    });

    return [
      {
        ruleId: "default",
        ruleName: "Default — Stale NEW bugs (>3 days)",
        staleBugs,
        staleDays: 3,
        statuses: ["NEW"],
        severities: null,
      },
    ];
  }

  const results: WhiningDigestResult[] = [];

  for (const rule of rules) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rule.staleDays);

    const statuses = rule.statuses.split(",").map((s) => s.trim()).filter(Boolean);
    const severities = rule.severities
      ? rule.severities.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

    const whereClause: any = {
      status: { in: statuses },
      updatedAt: { lt: cutoff },
    };

    if (severities && severities.length > 0) {
      whereClause.severity = { in: severities };
    }

    const staleBugs = await prisma.bug.findMany({
      where: whereClause,
      include: {
        product: true,
        component: true,
        reporter: true,
        assignee: true,
      },
      orderBy: { updatedAt: "asc" },
    });

    // Update rule's last-run metadata
    await prisma.whiningRule.update({
      where: { id: rule.id },
      data: {
        lastRunAt: new Date(),
        lastRunCount: staleBugs.length,
      },
    });

    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      staleBugs,
      staleDays: rule.staleDays,
      statuses,
      severities,
    });
  }

  return results;
}
