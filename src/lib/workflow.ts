/**
 * Bugzilla Workflow Lifecycle Engine
 * Implements the standard Bugzilla bug lifecycle state machine:
 * UNCONFIRMED -> NEW -> ASSIGNED -> RESOLVED -> VERIFIED -> CLOSED
 */

export const BUG_STATUSES = [
  "UNCONFIRMED",
  "NEW",
  "ASSIGNED",
  "RESOLVED",
  "VERIFIED",
  "CLOSED",
] as const;

export type BugStatus = (typeof BUG_STATUSES)[number];

export const BUG_RESOLUTIONS = [
  "FIXED",
  "INVALID",
  "WONTFIX",
  "DUPLICATE",
  "WORKSFORME",
  "INCOMPLETE",
] as const;

export type BugResolution = (typeof BUG_RESOLUTIONS)[number];

export const BUG_SEVERITIES = [
  "BLOCKER",
  "CRITICAL",
  "MAJOR",
  "NORMAL",
  "MINOR",
  "TRIVIAL",
] as const;

export type BugSeverity = (typeof BUG_SEVERITIES)[number];

export const BUG_PRIORITIES = ["P1", "P2", "P3", "P4", "P5"] as const;

export type BugPriority = (typeof BUG_PRIORITIES)[number];

// State transition graph defined by standard Bugzilla rules
export const ALLOWED_TRANSITIONS: Record<BugStatus, BugStatus[]> = {
  UNCONFIRMED: ["NEW", "ASSIGNED", "RESOLVED"],
  NEW: ["ASSIGNED", "RESOLVED"],
  ASSIGNED: ["NEW", "RESOLVED"],
  RESOLVED: ["UNCONFIRMED", "ASSIGNED", "VERIFIED", "CLOSED"],
  VERIFIED: ["UNCONFIRMED", "ASSIGNED", "CLOSED"],
  CLOSED: ["UNCONFIRMED", "ASSIGNED"],
};

export interface TransitionValidationResult {
  isValid: boolean;
  error?: string;
  requiresResolution?: boolean;
  clearsResolution?: boolean;
}

export function validateStatusTransition(
  currentStatus: BugStatus,
  nextStatus: BugStatus,
  resolution?: BugResolution | null
): TransitionValidationResult {
  if (currentStatus === nextStatus) {
    // If staying in RESOLVED or changing resolution
    if (nextStatus === "RESOLVED" && !resolution) {
      return {
        isValid: false,
        error: "A resolution (e.g. FIXED, INVALID, DUPLICATE) must be provided when in RESOLVED status.",
      };
    }
    return { isValid: true };
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedNext || !allowedNext.includes(nextStatus)) {
    return {
      isValid: false,
      error: `Invalid transition: Cannot move bug directly from ${currentStatus} to ${nextStatus}. Allowed destinations: ${allowedNext?.join(", ") || "None"}.`,
    };
  }

  // If moving to RESOLVED, a resolution is mandatory
  if (nextStatus === "RESOLVED") {
    if (!resolution || !BUG_RESOLUTIONS.includes(resolution)) {
      return {
        isValid: false,
        requiresResolution: true,
        error: `Moving to RESOLVED requires a valid resolution: ${BUG_RESOLUTIONS.join(", ")}.`,
      };
    }
    return { isValid: true, requiresResolution: true };
  }

  // If reopening (moving from RESOLVED/VERIFIED/CLOSED back to UNCONFIRMED/NEW/ASSIGNED)
  const isReopening =
    ["RESOLVED", "VERIFIED", "CLOSED"].includes(currentStatus) &&
    ["UNCONFIRMED", "NEW", "ASSIGNED"].includes(nextStatus);

  return {
    isValid: true,
    clearsResolution: isReopening,
  };
}

export const STATUS_META: Record<
  BugStatus,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  UNCONFIRMED: {
    label: "Unconfirmed",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    desc: "Newly reported bug awaiting confirmation or triage",
  },
  NEW: {
    label: "New",
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
    desc: "Confirmed bug ready for assignment or prioritization",
  },
  ASSIGNED: {
    label: "Assigned",
    bg: "bg-indigo-500/10",
    text: "text-indigo-500",
    border: "border-indigo-500/20",
    desc: "Assigned to a developer; work is in progress",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    desc: "Fix has been committed or resolution identified",
  },
  VERIFIED: {
    label: "Verified",
    bg: "bg-teal-500/10",
    text: "text-teal-500",
    border: "border-teal-500/20",
    desc: "QA/Reporter has tested and confirmed the resolution",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    border: "border-zinc-500/20",
    desc: "Completed lifecycle; bug is formally closed",
  },
};

export const SEVERITY_META: Record<
  BugSeverity,
  { label: string; color: string; badge: string }
> = {
  BLOCKER: { label: "Blocker", color: "text-rose-600", badge: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  CRITICAL: { label: "Critical", color: "text-red-500", badge: "bg-red-500/15 text-red-400 border-red-500/30" },
  MAJOR: { label: "Major", color: "text-orange-500", badge: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  NORMAL: { label: "Normal", color: "text-sky-500", badge: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  MINOR: { label: "Minor", color: "text-emerald-500", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  TRIVIAL: { label: "Trivial", color: "text-zinc-400", badge: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};

export const PRIORITY_META: Record<
  BugPriority,
  { label: string; badge: string }
> = {
  P1: { label: "P1 (Highest)", badge: "bg-red-500/20 text-red-300 border-red-500/40" },
  P2: { label: "P2 (High)", badge: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  P3: { label: "P3 (Normal)", badge: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  P4: { label: "P4 (Low)", badge: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
  P5: { label: "P5 (Lowest)", badge: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40" },
};