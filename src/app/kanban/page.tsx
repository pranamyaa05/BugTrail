"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/components/user-context";
import { StatusBadge } from "@/components/status-badge";
import { SeverityBadge, PriorityBadge } from "@/components/severity-badge";
import {
  BUG_STATUSES,
  STATUS_META,
  ALLOWED_TRANSITIONS,
  BugStatus,
} from "@/lib/workflow";
import {
  GripVertical,
  MessageSquare,
  RefreshCw,
  Columns3,
  ArrowRight,
} from "lucide-react";

interface BugCard {
  id: string;
  key: string;
  bugNumber: number;
  title: string;
  status: string;
  resolution: string | null;
  severity: string;
  priority: string;
  product: { id: string; name: string };
  component: { id: string; name: string };
  reporter: { id: string; name: string; avatarUrl?: string | null };
  assignee: { id: string; name: string; avatarUrl?: string | null } | null;
  _count: { comments: number };
  createdAt: string;
}

// Only show active workflow columns on the board (not VERIFIED/CLOSED for cleanliness)
const KANBAN_COLUMNS: BugStatus[] = [
  "UNCONFIRMED",
  "NEW",
  "ASSIGNED",
  "RESOLVED",
  "VERIFIED",
  "CLOSED",
];

const COLUMN_COLORS: Record<BugStatus, { header: string; dot: string; dropzone: string; count: string }> = {
  UNCONFIRMED: { header: "text-amber-700", dot: "bg-amber-400", dropzone: "border-amber-200 bg-amber-50/30", count: "bg-amber-100 text-amber-700" },
  NEW: { header: "text-blue-700", dot: "bg-blue-400", dropzone: "border-blue-200 bg-blue-50/30", count: "bg-blue-100 text-blue-700" },
  ASSIGNED: { header: "text-indigo-700", dot: "bg-indigo-400", dropzone: "border-indigo-200 bg-indigo-50/30", count: "bg-indigo-100 text-indigo-700" },
  RESOLVED: { header: "text-emerald-700", dot: "bg-emerald-400", dropzone: "border-emerald-200 bg-emerald-50/30", count: "bg-emerald-100 text-emerald-700" },
  VERIFIED: { header: "text-teal-700", dot: "bg-teal-400", dropzone: "border-teal-200 bg-teal-50/30", count: "bg-teal-100 text-teal-700" },
  CLOSED: { header: "text-slate-500", dot: "bg-slate-400", dropzone: "border-slate-200 bg-slate-50/30", count: "bg-slate-200 text-slate-600" },
};

export default function KanbanPage() {
  const { currentUser } = useUser();
  const [bugs, setBugs] = useState<BugCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedBug, setDraggedBug] = useState<BugCard | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<string | null>(null);

  const fetchBugs = useCallback(() => {
    setIsLoading(true);
    fetch("/api/bugs")
      .then((res) => res.json())
      .then((data) => setBugs(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to fetch bugs", err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchBugs();

    const eventSource = new EventSource("/api/events");
    eventSource.onmessage = () => {
      fetchBugs(); // Refresh bugs when an event occurs
    };
    return () => eventSource.close();
  }, [fetchBugs]);

  const getBugsForColumn = (status: BugStatus) =>
    bugs.filter((b) => b.status === status);

  const handleDragStart = (e: React.DragEvent, bug: BugCard) => {
    setDraggedBug(bug);
    e.dataTransfer.effectAllowed = "move";
    // Add a tiny delay so the card visually "lifts"
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => target.classList.add("opacity-40"), 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove("opacity-40");
    setDraggedBug(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: BugStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedBug || !currentUser) return;
    if (draggedBug.status === targetStatus) return;

    // Check if transition is allowed
    const allowed = ALLOWED_TRANSITIONS[draggedBug.status as BugStatus] || [];
    if (!allowed.includes(targetStatus)) {
      alert(
        `Invalid workflow transition: Cannot move from ${draggedBug.status} to ${targetStatus}.\n\nAllowed destinations: ${allowed.join(", ")}`
      );
      return;
    }

    // If moving to RESOLVED, use a simple prompt for resolution
    let resolution: string | null = null;
    if (targetStatus === "RESOLVED") {
      const res = prompt(
        "Select resolution (type one):\nFIXED, INVALID, WONTFIX, DUPLICATE, WORKSFORME, INCOMPLETE",
        "FIXED"
      );
      if (!res) return;
      resolution = res.toUpperCase();
    }

    setTransitioning(draggedBug.id);

    try {
      const res = await fetch(`/api/bugs/${draggedBug.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextStatus: targetStatus,
          resolution,
          actorId: currentUser.id,
          comment: `Status changed via Kanban board drag-and-drop: ${draggedBug.status} → ${targetStatus}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to transition");
      }

      // Optimistic update
      setBugs((prev) =>
        prev.map((b) =>
          b.id === draggedBug.id
            ? {
                ...b,
                status: targetStatus,
                resolution: resolution || (targetStatus !== "RESOLVED" ? null : b.resolution),
              }
            : b
        )
      );
    } catch (err: any) {
      alert(`Transition failed: ${err.message}`);
      fetchBugs();
    } finally {
      setTransitioning(null);
      setDraggedBug(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-violet-500" />
          <span className="text-sm">Loading Kanban board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-50 text-violet-600 border border-violet-100">
            <Columns3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Kanban Board</h1>
            <p className="text-xs text-slate-500">
              Drag and drop bugs between columns to execute Bugzilla workflow transitions
            </p>
          </div>
        </div>
        <button
          onClick={fetchBugs}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition text-xs font-medium flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Transition hint */}
      {draggedBug && (
        <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg text-xs text-violet-700 flex items-center gap-2 animate-in fade-in duration-200">
          <ArrowRight className="w-4 h-4" />
          <span>
            Dragging <strong>{draggedBug.key}</strong> — drop on a valid destination column.
            Allowed: <strong>{(ALLOWED_TRANSITIONS[draggedBug.status as BugStatus] || []).join(", ")}</strong>
          </span>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 260px)" }}>
        {KANBAN_COLUMNS.map((status) => {
          const columnBugs = getBugsForColumn(status);
          const colors = COLUMN_COLORS[status];
          const meta = STATUS_META[status];
          const isDropTarget = dragOverColumn === status;
          const isValidDrop =
            draggedBug &&
            draggedBug.status !== status &&
            (ALLOWED_TRANSITIONS[draggedBug.status as BugStatus] || []).includes(status);

          return (
            <div
              key={status}
              className="flex-shrink-0 flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden"
              style={{ width: "280px" }}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column Header */}
              <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${colors.header}`}>
                    {meta.label}
                  </span>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors.count}`}>
                  {columnBugs.length}
                </span>
              </div>

              {/* Drop zone / card list */}
              <div
                className={`flex-1 p-2 space-y-2 overflow-y-auto transition-colors duration-200 ${
                  isDropTarget && isValidDrop
                    ? colors.dropzone + " border-2 border-dashed"
                    : isDropTarget && !isValidDrop && draggedBug
                    ? "bg-red-50/50 border-2 border-dashed border-red-200"
                    : ""
                }`}
              >
                {columnBugs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    No bugs
                  </div>
                ) : (
                  columnBugs.map((bug) => (
                    <div
                      key={bug.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, bug)}
                      onDragEnd={handleDragEnd}
                      className={`group bg-white border border-slate-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-violet-200 transition-all duration-150 ${
                        transitioning === bug.id ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {/* Card top: key + priority */}
                      <div className="flex items-center justify-between mb-2">
                        <Link
                          href={`/bugs/${bug.key}`}
                          className="font-mono text-xs font-bold text-violet-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {bug.key}
                        </Link>
                        <PriorityBadge priority={bug.priority} />
                      </div>

                      {/* Title */}
                      <Link href={`/bugs/${bug.key}`} onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2 mb-2 hover:text-violet-700 transition">
                          {bug.title}
                        </p>
                      </Link>

                      {/* Component */}
                      <p className="text-[11px] text-slate-400 font-mono mb-3 truncate">
                        {bug.component?.name}
                      </p>

                      {/* Card footer: severity + assignee + comments */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <SeverityBadge severity={bug.severity} />

                        <div className="flex items-center gap-2">
                          {bug._count?.comments > 0 && (
                            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                              <MessageSquare className="w-3 h-3" />
                              {bug._count.comments}
                            </span>
                          )}

                          {bug.assignee ? (
                            <div
                              className="w-6 h-6 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-[10px] font-bold text-violet-700"
                              title={bug.assignee.name}
                            >
                              {bug.assignee.name.charAt(0)}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                              ?
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}