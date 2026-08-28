import React from "react";
import { STATUS_META, BugStatus, BugResolution } from "@/lib/workflow";

interface StatusBadgeProps {
  status: string;
  resolution?: string | null;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, resolution, className = "", size = "md" }: StatusBadgeProps) {
  const meta = STATUS_META[status as BugStatus] || {
    label: status,
    bg: "bg-zinc-800",
    text: "text-zinc-300",
    border: "border-zinc-700",
  };

  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1 font-medium";

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border} ${sizeClasses} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{meta.label}</span>
      {status === "RESOLVED" && resolution && (
        <span className="font-semibold text-emerald-400 opacity-90">({resolution})</span>
      )}
    </div>
  );
}