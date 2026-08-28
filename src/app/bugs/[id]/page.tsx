"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { StatusBadge } from "@/components/status-badge";
import { SeverityBadge, PriorityBadge } from "@/components/severity-badge";
import {
  ALLOWED_TRANSITIONS,
  BUG_RESOLUTIONS,
  BugStatus,
  BugResolution,
} from "@/lib/workflow";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Send,
  User,
  Layers,
  FileCode,
  Activity,
  Hash,
  RefreshCw,
} from "lucide-react";

export default function BugDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bugId = resolvedParams.id;
  const router = useRouter();
  const { currentUser, users } = useUser();

  const [bug, setBug] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status transition state
  const [nextStatus, setNextStatus] = useState<string>("");
  const [resolution, setResolution] = useState<string>("FIXED");
  const [transitionComment, setTransitionComment] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // New comment state
  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Active tab: comments vs audit logs
  const [activeTab, setActiveTab] = useState<"comments" | "audit">("comments");

  const loadBug = () => {
    fetch(`/api/bugs/${bugId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load defect details");
        return res.json();
      })
      .then((data) => {
        setBug(data);
        const allowed = ALLOWED_TRANSITIONS[data.status as BugStatus] || [];
        setNextStatus(allowed.length > 0 ? allowed[0] : "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadBug();
  }, [bugId]);

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please select a user persona in the top navigation first.");
      return;
    }
    if (!nextStatus) return;

    setIsTransitioning(true);
    try {
      const res = await fetch(`/api/bugs/${bug.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextStatus,
          resolution: nextStatus === "RESOLVED" ? resolution : null,
          actorId: currentUser.id,
          comment: transitionComment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to transition status");
      }

      setTransitionComment("");
      loadBug();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please select a user persona first.");
      return;
    }
    if (!commentText.trim()) return;

    setIsPostingComment(true);
    try {
      const res = await fetch(`/api/bugs/${bug.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: currentUser.id,
          body: commentText.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post comment");
      }

      setCommentText("");
      loadBug();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleQuickAssign = async (newAssigneeId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/bugs/${bug.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneeId: newAssigneeId || null,
          actorId: currentUser.id,
        }),
      });
      loadBug();
    } catch (err) {
      console.error("Assign error", err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex items-center justify-center text-slate-400 text-sm gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-violet-600" />
        <span>Loading defect report {bugId}...</span>
      </div>
    );
  }

  if (error || !bug) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-4">
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
          {error || "Defect not found"}
        </div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-violet-600 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Defects List
        </Link>
      </div>
    );
  }

  const allowedNextStatuses = ALLOWED_TRANSITIONS[bug.status as BugStatus] || [];
  let customFieldsObj: Record<string, any> = {};
  try {
    if (bug.customFields) customFieldsObj = JSON.parse(bug.customFields);
  } catch (e) {}

  return (
    <div className="space-y-6">
      {/* Top breadcrumb & back */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Defects List
        </Link>

        {/* Audit status badge */}
        <div className="flex items-center gap-2">
          {bug.auditVerification?.isValid ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SHA-256 Audit Chain Verified ({bug.auditVerification?.totalEntries} blocks)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              <span>Audit Chain Integrity Warning</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Defect Information, Status Controls, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-violet-700 px-2 py-0.5 rounded bg-violet-50 border border-violet-200">
                {bug.key}
              </span>
              <StatusBadge status={bug.status} resolution={bug.resolution} />
              <SeverityBadge severity={bug.severity} />
              <PriorityBadge priority={bug.priority} />
            </div>

            <h1 className="text-xl font-bold text-slate-900 leading-snug">{bug.title}</h1>

            <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1">
                <span>Reported by</span>
                <span className="text-slate-800 font-semibold">{bug.reporter?.name}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(bug.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Bugzilla Workflow Transition Panel */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bugzilla Workflow Transition Engine
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Current: {bug.status}</span>
            </div>

            {allowedNextStatuses.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                This bug is in a final closed state with no further direct transitions allowed.
              </p>
            ) : (
              <form onSubmit={handleStatusTransition} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Transition Destination
                    </label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    >
                      {allowedNextStatuses.map((st) => (
                        <option key={st} value={st}>
                          Move to {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {nextStatus === "RESOLVED" && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Bugzilla Resolution <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-emerald-700 font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        {BUG_RESOLUTIONS.map((res) => (
                          <option key={res} value={res}>
                            {res}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Optional transition reason / commit hash / notes..."
                    value={transitionComment}
                    onChange={(e) => setTransitionComment(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isTransitioning}
                    className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {isTransitioning ? "Applying..." : `Execute Transition -> ${nextStatus}`}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Description Section */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Description & Reproduction Steps
            </h3>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {bug.description}
            </div>
          </div>

          {/* Tabbed Activity / Comments & Cryptographic Audit Trail */}
          <div className="space-y-4">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("comments")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTab === "comments"
                      ? "bg-violet-50 text-violet-700 border border-violet-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Discussion & Comments ({bug.comments?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab("audit")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTab === "audit"
                      ? "bg-violet-50 text-violet-700 border border-violet-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 text-violet-600" />
                  <span>Cryptographic Audit Log ({bug.auditLogs?.length || 0})</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Comments */}
            {activeTab === "comments" && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {bug.comments?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No comments posted yet.
                    </div>
                  ) : (
                    bug.comments.map((c: any, idx: number) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{c.author?.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                              Comment #{idx + 1}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {c.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handlePostComment} className="space-y-2 pt-2">
                  <textarea
                    rows={3}
                    placeholder="Add a comment or triage note..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-500">
                      Posting as: <strong className="text-slate-800">{currentUser?.name}</strong>
                    </span>
                    <button
                      type="submit"
                      disabled={isPostingComment || !commentText.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isPostingComment ? "Posting..." : "Post Comment"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: SHA-256 Tamper-Evident Audit Trail */}
            {activeTab === "audit" && (
              <div className="space-y-3">
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg text-xs text-violet-800">
                  <strong>Tamper-Evident Hash Chaining:</strong> Each mutation creates a block linked to
                  the previous block's SHA-256 digest. Any direct database tampering breaks the cryptographic hash chain.
                </div>

                <div className="space-y-2">
                  {bug.auditLogs?.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 font-mono text-[11px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-violet-700">
                          [{log.action}] {log.fieldChanged ? `${log.fieldChanged} modified` : ""}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(log.createdAt).toISOString()}
                        </span>
                      </div>

                      <div className="text-slate-700">
                        Actor: <span className="text-slate-900 font-semibold">{log.actor?.name}</span>
                        {log.oldValue && (
                          <span className="text-slate-500"> | Old: "{log.oldValue}"</span>
                        )}
                        {log.newValue && (
                          <span className="text-emerald-600 font-semibold"> | New: "{log.newValue}"</span>
                        )}
                      </div>

                      <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5 overflow-x-auto">
                        <div>
                          prev_hash: <span className="text-slate-600">{log.prevHash?.slice(0, 32)}...</span>
                        </div>
                        <div>
                          block_hash: <span className="text-violet-700 font-semibold">{log.hash}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Metadata Sidebar */}
        <div className="space-y-5">
          {/* Defect Hierarchy */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Hierarchy</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Product</span>
                <span className="font-semibold text-slate-800">{bug.product?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Component</span>
                <span className="font-semibold text-slate-800">{bug.component?.name}</span>
              </div>
            </div>
          </div>

          {/* People & Assignment */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Assignment</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] mb-1">Assignee</span>
                <select
                  value={bug.assigneeId || ""}
                  onChange={(e) => handleQuickAssign(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                >
                  <option value="">(Unassigned)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Reporter</span>
                <span className="text-slate-800 font-semibold">{bug.reporter?.name}</span>
              </div>
            </div>
          </div>

          {/* Custom Fields (JSONB) */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              <span>Custom Fields (JSONB)</span>
            </h3>

            <div className="space-y-2 text-xs">
              {Object.keys(customFieldsObj).length === 0 ? (
                <span className="text-slate-400 text-[11px] italic">No custom fields attached.</span>
              ) : (
                Object.entries(customFieldsObj).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-mono uppercase">{k}</span>
                    <span className="text-slate-800 font-mono text-[11px] font-medium">{String(v)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}