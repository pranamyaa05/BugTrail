"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const KANBAN_COLUMNS: BugStatus[] = [
  "UNCONFIRMED",
  "NEW",
  "ASSIGNED",
  "RESOLVED",
  "VERIFIED",
  "CLOSED",
];

const COLUMN_COLORS: Record<BugStatus, { header: string; dot: string; dropzone: string; count: string }> = {
  UNCONFIRMED: { header: "text-amber-800", dot: "bg-amber-500", dropzone: "border-amber-400 bg-amber-50/60", count: "bg-amber-100 text-amber-900 border-amber-300" },
  NEW: { header: "text-thickblue-800", dot: "bg-thickblue-500", dropzone: "border-thickblue-400 bg-thickblue-50/80", count: "bg-thickblue-100 text-thickblue-900 border-thickblue-300" },
  ASSIGNED: { header: "text-btpurple-800", dot: "bg-btpurple-500", dropzone: "border-btpurple-300 bg-btpurple-50/70", count: "bg-btpurple-100 text-btpurple-900 border-btpurple-200" },
  RESOLVED: { header: "text-forest-700", dot: "bg-forest-600", dropzone: "border-forest-600/50 bg-forest-600/10", count: "bg-forest-600/15 text-forest-750 border-forest-600/40" },
  VERIFIED: { header: "text-forest-750", dot: "bg-forest-750", dropzone: "border-forest-700/50 bg-forest-700/10", count: "bg-forest-700/15 text-forest-800 border-forest-700/40" },
  CLOSED: { header: "text-ochre-700", dot: "bg-ochre-400", dropzone: "border-ochre-300 bg-ochre-100/70", count: "bg-ochre-200 text-ochre-800 border-ochre-300" },
};

export default function KanbanPage() {
  const router = useRouter();
  const { currentUser, userRole, isLoading: authLoading } = useUser();
  const [bugs, setBugs] = useState<BugCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedBug, setDraggedBug] = useState<BugCard | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    }
  }, [authLoading, currentUser, router]);

  const fetchBugs = useCallback(() => {
    setIsLoading(true);
    fetch("/api/bugs")
      .then((res) => res.json())
      .then((data) => setBugs(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to fetch bugs", err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchBugs();

      const eventSource = new EventSource("/api/events");
      eventSource.onmessage = () => {
        fetchBugs();
      };
      return () => eventSource.close();
    }
  }, [fetchBugs, currentUser]);

  const handleDragStart = (e: React.DragEvent, bug: BugCard) => {
    if (userRole === "REPORTER") {
      alert("Role Restriction: REPORTER role cannot drag and drop workflow transitions.");
      return;
    }
    setDraggedBug(bug);
    e.dataTransfer.effectAllowed = "move";
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

  const handleDrop = async (e: React.DragEvent, targetStatus: BugStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedBug || !currentUser) return;
    if (userRole === "REPORTER") return;
    if (draggedBug.status === targetStatus) return;

    const allowed = ALLOWED_TRANSITIONS[draggedBug.status as BugStatus] || [];
    if (!allowed.includes(targetStatus)) {
      alert(
        `Invalid workflow transition: Cannot move from ${draggedBug.status} to ${targetStatus}.\n\nAllowed destinations: ${allowed.join(", ")}`
      );
      return;
    }

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

  if (authLoading || !currentUser) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-btpurple-600" />
        <p className="text-xs text-ochre-700 font-medium">Redirecting to Sign In...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-btpurple-100 border border-btpurple-200 flex items-center justify-center text-btpurple-700 shadow-sm">
            <Columns3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ochre-950 tracking-tight">Kanban Workflow Board</h1>
            <p className="text-xs text-ochre-700 font-medium">
              Drag and drop defects across Bugzilla state transitions
            </p>
          </div>
        </div>

        <button
          onClick={fetchBugs}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-ochre-100 border border-ochre-300 text-xs font-bold text-ochre-950 flex items-center gap-1.5 transition shadow-sm w-fit"
          title="Refresh board"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Board Columns — forest frame enclosing aqua slices */}
      <div className="forest-gradient-frame rounded-3xl shadow-forest-frame p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-stretch pb-2">
        {KANBAN_COLUMNS.map((colStatus) => {
          const colBugs = bugs.filter((b) => b.status === colStatus);
          const isOver = dragOverColumn === colStatus;
          const colors = COLUMN_COLORS[colStatus];

          return (
            <div
              key={colStatus}
              onDragOver={(e) => handleDragOver(e, colStatus)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, colStatus)}
              className={`kanban-slice flex flex-col rounded-2xl thickblue-surface p-3 min-h-[500px] transition ${
                isOver
                  ? colors.dropzone + " ring-2 ring-btpurple-500"
                  : "shadow-thickblue-surface"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-thickblue-300 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${colors.header}`}>{colStatus}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${colors.count}`}>
                  {colBugs.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {colBugs.length === 0 ? (
                  <div className="h-24 border border-dashed border-thickblue-300 rounded-xl flex items-center justify-center text-[11px] text-ochre-400 bg-white/40">
                    No defects
                  </div>
                ) : (
                  colBugs.map((bug) => (
                    <div
                      key={bug.id}
                      draggable={userRole !== "REPORTER"}
                      onDragStart={(e) => handleDragStart(e, bug)}
                      onDragEnd={handleDragEnd}
                      className={`group p-3 rounded-xl bg-white border shadow-xs hover:shadow-md hover:border-btpurple-300 transition cursor-grab active:cursor-grabbing space-y-2 ${
                        transitioning === bug.id ? "opacity-50 border-btpurple-400" : "border-thickblue-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/bugs/${bug.key}`}
                          className="font-mono text-xs font-bold text-btpurple-700 hover:underline"
                        >
                          {bug.key}
                        </Link>
                        <SeverityBadge severity={bug.severity} />
                      </div>

                      <Link
                        href={`/bugs/${bug.key}`}
                        className="block text-xs font-semibold text-ochre-950 group-hover:text-btpurple-800 transition leading-snug line-clamp-2"
                      >
                        {bug.title}
                      </Link>

                      <div className="flex items-center justify-between text-[10px] text-ochre-700 pt-1 border-t border-thickblue-200 font-mono">
                        <span>{bug.product?.name}</span>
                        {bug.assignee ? (
                          <span className="text-ochre-950 font-bold">{bug.assignee.name.split(" ")[0]}</span>
                        ) : (
                          <span className="italic text-ochre-400">Unassigned</span>
                        )}
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
    </div>
  );
}