import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { bugTrailEvents } from "@/lib/events";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const eventName = req.headers.get("x-github-event");
    
    // 1. Handle Pull Requests
    if (eventName === "pull_request" && payload.action === "closed" && payload.pull_request.merged) {
      const pr = payload.pull_request;
      const titleAndBody = `${pr.title} ${pr.body}`.toUpperCase();
      
      const match = titleAndBody.match(/(?:FIXES|RESOLVES|CLOSES|REF)\s+(BUG-\d+)/);
      if (match) {
        const bugKey = match[1];
        const isFix = /(?:FIXES|RESOLVES|CLOSES)/.test(match[0]);
        await processGitHubLink(bugKey, isFix, `Merged PR [${pr.title}](${pr.html_url}) which fixes this issue.`, `GitHub webhook attached PR #${pr.number}`);
      }
    }

    // 2. Handle Pushes (Commits)
    if (eventName === "push" && payload.commits && payload.commits.length > 0) {
      for (const commit of payload.commits) {
        const message = (commit.message || "").toUpperCase();
        const match = message.match(/(?:FIXES|RESOLVES|CLOSES|REF)\s+(BUG-\d+)/);
        if (match) {
          const bugKey = match[1];
          const isFix = /(?:FIXES|RESOLVES|CLOSES)/.test(match[0]);
          await processGitHubLink(
            bugKey, 
            isFix, 
            `Commit pushed: [${commit.id.substring(0, 7)}](${commit.url})\n\n> ${commit.message}`, 
            `GitHub webhook attached commit ${commit.id.substring(0, 7)}`
          );
        }
      }
    }

    async function processGitHubLink(bugKey: string, isFix: boolean, commentBody: string, auditLogValue: string) {
      const bug = await prisma.bug.findFirst({ where: { key: bugKey } });
      if (!bug) return;

      const systemUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const actorId = systemUser?.id || bug.reporterId;

      // Add a comment
      const comment = await prisma.comment.create({
        data: {
          bugId: bug.id,
          authorId: actorId,
          body: commentBody,
        },
        include: { author: true }
      });

      await recordAuditLog({
        bugId: bug.id,
        actorId,
        action: "COMMENT",
        newValue: auditLogValue,
      });

      bugTrailEvents.emit("event", { type: "COMMENT_ADDED", payload: comment });

      // Auto-resolve if needed
      if (isFix && bug.status !== "RESOLVED" && bug.status !== "CLOSED" && bug.status !== "VERIFIED") {
        const updatedBug = await prisma.bug.update({
          where: { id: bug.id },
          data: {
            status: "RESOLVED",
            resolution: "FIXED",
            resolvedAt: new Date(),
          },
          include: {
            product: true,
            component: true,
            reporter: true,
            assignee: true,
          }
        });

        await recordAuditLog({
          bugId: bug.id,
          actorId,
          action: "STATUS_CHANGE",
          fieldChanged: "status",
          oldValue: bug.status,
          newValue: "RESOLVED",
        });

        bugTrailEvents.emit("event", { type: "STATUS_CHANGED", payload: updatedBug });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
