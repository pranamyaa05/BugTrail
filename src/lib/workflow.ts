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
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
    desc: "Newly reported bug awaiting confirmation or triage",
  },
  NEW: {
    label: "New",
    bg: "bg-thickblue-100",
    text: "text-thickblue-800",
    border: "border-thickblue-300",
    desc: "Confirmed bug ready for assignment or prioritization",
  },
  ASSIGNED: {
    label: "Assigned",
    bg: "bg-btpurple-100",
    text: "text-btpurple-800",
    border: "border-btpurple-300",
    desc: "Assigned to a developer; work is in progress",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-forest-600/10",
    text: "text-forest-700",
    border: "border-forest-600/40",
    desc: "Fix has been committed or resolution identified",
  },
  VERIFIED: {
    label: "Verified",
    bg: "bg-forest-600/15",
    text: "text-forest-750",
    border: "border-forest-600/50",
    desc: "QA/Reporter has tested and confirmed the resolution",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-ochre-200",
    text: "text-ochre-700",
    border: "border-ochre-300",
    desc: "Completed lifecycle; bug is formally closed",
  },
};

export const SEVERITY_META: Record<
  BugSeverity,
  { label: string; color: string; badge: string }
> = {
  BLOCKER: { label: "Blocker", color: "text-ladybug-600", badge: "bg-red-50 text-ladybug-600 border-red-300" },
  CRITICAL: { label: "Critical", color: "text-ladybug-600", badge: "bg-red-50 text-ladybug-600 border-red-300" },
  MAJOR: { label: "Major", color: "text-amber-800", badge: "bg-amber-50 text-amber-800 border-amber-300" },
  NORMAL: { label: "Normal", color: "text-thickblue-800", badge: "bg-thickblue-100 text-thickblue-800 border-thickblue-300" },
  MINOR: { label: "Minor", color: "text-forest-700", badge: "bg-forest-600/10 text-forest-700 border-forest-600/40" },
  TRIVIAL: { label: "Trivial", color: "text-ochre-700", badge: "bg-ochre-100 text-ochre-700 border-ochre-300" },
};

export const PRIORITY_META: Record<
  BugPriority,
  { label: string; badge: string }
> = {
  P1: { label: "P1 (Highest)", badge: "bg-ladybug-500 text-white border-ladybug-600" },
  P2: { label: "P2 (High)", badge: "bg-amber-100 text-amber-900 border-amber-300" },
  P3: { label: "P3 (Normal)", badge: "bg-btpurple-100 text-btpurple-800 border-btpurple-200" },
  P4: { label: "P4 (Low)", badge: "bg-thickblue-100 text-thickblue-800 border-thickblue-300" },
  P5: { label: "P5 (Lowest)", badge: "bg-ochre-200 text-ochre-700 border-ochre-300" },
};