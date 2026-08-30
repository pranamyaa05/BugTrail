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
  UNCONFIRMED: { header: "text-amber-700", dot: "bg-amber-400", dropzone: "border-amber-200 bg-amber-50/30", count: "bg-amber-100 text-amber-700" },
  NEW: { header: "text-blue-700", dot: "bg-blue-400", dropzone: "border-blue-200 bg-blue-50/30", count: "bg-blue-100 text-blue-700" },
  ASSIGNED: { header: "text-indigo-700", dot: "bg-indigo-400", dropzone: "border-indigo-200 bg-indigo-50/30", count: "bg-indigo-100 text-indigo-700" },
  RESOLVED: { header: "text-emerald-700", dot: "bg-emerald-400", dropzone: "border-emerald-200 bg-emerald-50/30", count: "bg-emerald-100 text-emerald-700" },
  VERIFIED: { header: "text-teal-700", dot: "bg-teal-400", dropzone: "border-teal-200 bg-teal-50/30", count: "bg-teal-100 text-teal-700" },
  CLOSED: { header: "text-slate-500", dot: "bg-slate-400", dropzone: "border-slate-200 bg-slate-50/30", count: "bg-slate-200 text-slate-600" },
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
        <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
        <p className="text-xs text-slate-500 font-medium">Redirecting to Sign In...</p>
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
            <h1 className="text-xl font-bold text-slate-800">Kanban Workflow Board</h1>
            <p className="text-xs text-slate-500">Drag and drop defects across Bugzilla state transitions</p>
          </div>
        </div>

        <button
          onClick={fetchBugs}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition"
          title="Refresh board"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
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
              className={`flex flex-col rounded-xl border p-3 min-h-[500px] transition ${
                isOver
                  ? colors.dropzone + " ring-2 ring-violet-400"
                  : "bg-slate-50/50 border-slate-200"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className={`text-xs font-bold ${colors.header}`}>{colStatus}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${colors.count}`}>
                  {colBugs.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {colBugs.length === 0 ? (
                  <div className="h-24 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[11px] text-slate-400">
                    No defects
                  </div>
                ) : (
                  colBugs.map((bug) => (
                    <div
                      key={bug.id}
                      draggable={userRole !== "REPORTER"}
                      onDragStart={(e) => handleDragStart(e, bug)}
                      onDragEnd={handleDragEnd}
                      className="group p-3 rounded-lg bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-violet-300 transition cursor-grab active:cursor-grabbing space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/bugs/${bug.key}`}
                          className="font-mono text-xs font-bold text-violet-600 hover:underline"
                        >
                          {bug.key}
                        </Link>
                        <SeverityBadge severity={bug.severity} />
                      </div>

                      <Link
                        href={`/bugs/${bug.key}`}
                        className="block text-xs font-medium text-slate-800 group-hover:text-violet-700 transition leading-snug line-clamp-2"
                      >
                        {bug.title}
                      </Link>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
                        <span>{bug.product?.name}</span>
                        {bug.assignee ? (
                          <span className="text-slate-700 font-semibold">{bug.assignee.name.split(" ")[0]}</span>
                        ) : (
                          <span className="italic text-slate-300">Unassigned</span>
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
  );
}