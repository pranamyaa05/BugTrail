import crypto from "crypto";
import { prisma } from "./prisma";

export interface CreateAuditLogParams {
  bugId: string;
  actorId: string;
  action: "CREATE" | "STATUS_CHANGE" | "RESOLUTION_CHANGE" | "ASSIGN" | "COMMENT" | "UPDATE";
  fieldChanged?: string;
  oldValue?: string | null;
  newValue?: string | null;
}

export function computeAuditHash(
  bugId: string,
  actorId: string,
  action: string,
  fieldChanged: string,
  oldValue: string,
  newValue: string,
  prevHash: string,
  timestamp: string
): string {
  const payload = [
    bugId,
    actorId,
    action,
    fieldChanged,
    oldValue,
    newValue,
    prevHash,
    timestamp,
  ].join("|");

  return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function recordAuditLog(params: CreateAuditLogParams) {
  // Fetch latest audit log for this bug to get prevHash
  const latestLog = await prisma.auditLog.findFirst({
    where: { bugId: params.bugId },
    orderBy: { createdAt: "desc" },
  });

  const prevHash = latestLog?.hash || "GENESIS_ROOT_HASH_0000000000000000000000000000000000000000000000000000000000000000";
  const now = new Date();

  const currentHash = computeAuditHash(
    params.bugId,
    params.actorId,
    params.action,
    params.fieldChanged || "NONE",
    params.oldValue || "NULL",
    params.newValue || "NULL",
    prevHash,
    now.toISOString()
  );

  return await prisma.auditLog.create({
    data: {
      bugId: params.bugId,
      actorId: params.actorId,
      action: params.action,
      fieldChanged: params.fieldChanged,
      oldValue: params.oldValue,
      newValue: params.newValue,
      prevHash,
      hash: currentHash,
      createdAt: now,
    },
    include: {
      actor: true,
    },
  });
}

export async function verifyAuditChain(bugId: string): Promise<{
  isValid: boolean;
  totalEntries: number;
  tamperedIndex?: number;
  tamperedEntryId?: string;
  error?: string;
}> {
  const entries = await prisma.auditLog.findMany({
    where: { bugId },
    orderBy: { createdAt: "asc" },
  });

  if (entries.length === 0) {
    return { isValid: true, totalEntries: 0 };
  }

  let expectedPrevHash = "GENESIS_ROOT_HASH_0000000000000000000000000000000000000000000000000000000000000000";

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (entry.prevHash !== expectedPrevHash) {
      return {
        isValid: false,
        totalEntries: entries.length,
        tamperedIndex: i,
        tamperedEntryId: entry.id,
        error: `Broken link at index ${i}: stored prevHash does not match previous entry's hash.`,
      };
    }

    const recomputedHash = computeAuditHash(
      entry.bugId,
      entry.actorId,
      entry.action,
      entry.fieldChanged || "NONE",
      entry.oldValue || "NULL",
      entry.newValue || "NULL",
      entry.prevHash || "",
      entry.createdAt.toISOString()
    );

    if (entry.hash !== recomputedHash) {
      return {
        isValid: false,
        totalEntries: entries.length,
        tamperedIndex: i,
        tamperedEntryId: entry.id,
        error: `Tampered content at index ${i}: hash mismatch (${entry.hash} vs computed ${recomputedHash}).`,
      };
    }

    expectedPrevHash = entry.hash || "";
  }

  return { isValid: true, totalEntries: entries.length };
}