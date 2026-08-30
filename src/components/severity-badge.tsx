import React from "react";
import { SEVERITY_META, PRIORITY_META, BugSeverity, BugPriority } from "@/lib/workflow";

export function SeverityBadge({ severity }: { severity: string }) {
  const meta = SEVERITY_META[severity as BugSeverity] || {
    label: severity,
    badge: "bg-ochre-100 text-ochre-700 border-thickblue-200",
  };

  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border ${meta.badge}`}>
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority as BugPriority] || {
    label: priority,
    badge: "bg-ochre-100 text-ochre-700 border-thickblue-200",
  };

  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded border ${meta.badge}`}>
      {meta.label}
    </span>
  );
}