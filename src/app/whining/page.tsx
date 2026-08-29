"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { SeverityBadge, PriorityBadge } from "@/components/severity-badge";
import { BUG_STATUSES, BUG_SEVERITIES } from "@/lib/workflow";
import {
  AlarmClock,
  Plus,
  Trash2,
  Play,
  Power,
  PowerOff,
  ChevronDown,
  ChevronRight,
  Clock,
  Bug,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

interface WhiningRule {
  id: string;
  name: string;
  description: string | null;
  statuses: string;
  staleDays: number;
  severities: string | null;
  isActive: boolean;
  lastRunAt: string | null;
  lastRunCount: number;
  createdAt: string;
}

interface DigestResult {
  ruleId: string;
  ruleName: string;
  staleBugs: any[];
  staleDays: number;
  statuses: string[];
  severities: string[] | null;
}

export default function WhiningPage() {
  const [rules, setRules] = useState<WhiningRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [digests, setDigests] = useState<DigestResult[]>([]);
  const [expandedDigest, setExpandedDigest] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatuses, setNewStatuses] = useState<string[]>(["NEW"]);
  const [newStaleDays, setNewStaleDays] = useState(3);
  const [newSeverities, setNewSeverities] = useState<string[]>([]);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/whining-rules");
      const data = await res.json();
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch whining rules:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newStatuses.length === 0) return;

    try {
      await fetch("/api/whining-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          statuses: newStatuses.join(","),
          staleDays: newStaleDays,
          severities: newSeverities.length > 0 ? newSeverities.join(",") : null,
        }),
      });
      setNewName("");
      setNewDescription("");
      setNewStatuses(["NEW"]);
      setNewStaleDays(3);
      setNewSeverities([]);
      setShowCreateForm(false);
      fetchRules();
    } catch (err) {
      console.error("Failed to create rule:", err);
    }
  };

  const toggleRule = async (rule: WhiningRule) => {
    try {
      await fetch(`/api/whining-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      fetchRules();
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this whining rule?")) return;
    try {
      await fetch(`/api/whining-rules/${id}`, { method: "DELETE" });
      fetchRules();
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const runWhiningEngine = async () => {
    setIsRunning(true);
    setDigests([]);
    try {
      const res = await fetch("/api/cron/whining");
      const data = await res.json();
      if (data.digests) {
        setDigests(data.digests);
        if (data.digests.length > 0) {
          setExpandedDigest(data.digests[0].ruleId);
        }
      }
      // Refresh rules to update lastRunAt / lastRunCount
      fetchRules();
    } catch (err) {
      console.error("Failed to run whining engine:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleStatus = (status: string) => {
    setNewStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const toggleSeverity = (severity: string) => {
    setNewSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  };

  const totalStale = digests.reduce((sum, d) => sum + d.staleBugs.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
            <AlarmClock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              Whining Engine
            </h1>
            <p className="text-xs text-slate-500">
              Scheduled bug inactivity alerts &amp; triage digest reports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Rule</span>
          </button>
          <button
            onClick={runWhiningEngine}
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{isRunning ? "Running..." : "Run Now"}</span>
          </button>
        </div>
      </div>

      {/* Create Rule Form */}
      {showCreateForm && (
        <div className="bg-white border border-violet-200 rounded-xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-600" />
            Create New Whining Rule
          </h3>

          <form onSubmit={handleCreateRule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rule Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Stale Blockers Alert"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                  required
                />
              </div>

              {/* Stale Days */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Stale After (days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={newStaleDays}
                  onChange={(e) => setNewStaleDays(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Description
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional description of what this rule monitors..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
              />
            </div>

            {/* Status Filters */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Watch Statuses *
              </label>
              <div className="flex flex-wrap gap-2">
                {BUG_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleStatus(status)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                      newStatuses.includes(status)
                        ? "bg-violet-100 text-violet-700 border-violet-300"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Filters */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Severity Filter{" "}
                <span className="text-slate-400 normal-case">(optional — leave empty for all)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {BUG_SEVERITIES.map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => toggleSeverity(sev)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                      newSeverities.includes(sev)
                        ? "bg-orange-100 text-orange-700 border-orange-300"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newName.trim() || newStatuses.length === 0}
                className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition disabled:opacity-50 shadow-sm"
              >
                Create Rule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Active Rules ({rules.filter((r) => r.isActive).length} of {rules.length})
        </h2>

        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
            <AlarmClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 mb-1">No whining rules configured.</p>
            <p className="text-[11px] text-slate-400">
              Click &quot;New Rule&quot; to set up automated stale bug alerts, or &quot;Run Now&quot; to use the default rule.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`rounded-xl border bg-white p-4 transition shadow-xs ${
                  rule.isActive
                    ? "border-slate-200"
                    : "border-slate-100 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          rule.isActive ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <h3 className="text-sm font-semibold text-slate-800 truncate">
                        {rule.name}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono flex-shrink-0">
                        {rule.staleDays}d threshold
                      </span>
                    </div>

                    {rule.description && (
                      <p className="text-[11px] text-slate-500 mb-2 ml-4">
                        {rule.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 ml-4">
                      <span className="text-[10px] text-slate-400 uppercase font-medium mr-1">
                        Watching:
                      </span>
                      {rule.statuses.split(",").map((s) => (
                        <StatusBadge key={s} status={s.trim()} />
                      ))}
                      {rule.severities && (
                        <>
                          <span className="text-[10px] text-slate-300 mx-1">|</span>
                          {rule.severities.split(",").map((s) => (
                            <SeverityBadge key={s} severity={s.trim()} />
                          ))}
                        </>
                      )}
                    </div>

                    {rule.lastRunAt && (
                      <div className="flex items-center gap-1.5 mt-2 ml-4 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          Last run: {new Date(rule.lastRunAt).toLocaleString()} —{" "}
                          <strong className={rule.lastRunCount > 0 ? "text-amber-600" : "text-emerald-600"}>
                            {rule.lastRunCount} stale bug{rule.lastRunCount !== 1 ? "s" : ""}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleRule(rule)}
                      className={`p-1.5 rounded-lg transition ${
                        rule.isActive
                          ? "text-emerald-600 hover:bg-emerald-50"
                          : "text-slate-400 hover:bg-slate-100"
                      }`}
                      title={rule.isActive ? "Disable rule" : "Enable rule"}
                    >
                      {rule.isActive ? (
                        <Power className="w-4 h-4" />
                      ) : (
                        <PowerOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Digest Results */}
      {digests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Latest Digest Results
            </h2>
            <div className="flex items-center gap-2">
              {totalStale > 0 ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {totalStale} stale bug{totalStale !== 1 ? "s" : ""} found
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  ✓ All clear — no stale bugs
                </span>
              )}
            </div>
          </div>

          {digests.map((digest) => (
            <div
              key={digest.ruleId}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
            >
              {/* Digest Header */}
              <button
                onClick={() =>
                  setExpandedDigest(
                    expandedDigest === digest.ruleId ? null : digest.ruleId
                  )
                }
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
              >
                <div className="flex items-center gap-2">
                  {expandedDigest === digest.ruleId ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm font-semibold text-slate-800">
                    {digest.ruleName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                    &gt;{digest.staleDays} days
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    digest.staleBugs.length > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {digest.staleBugs.length} bug{digest.staleBugs.length !== 1 ? "s" : ""}
                </span>
              </button>

              {/* Expanded Bug List */}
              {expandedDigest === digest.ruleId && (
                <div className="border-t border-slate-100">
                  {digest.staleBugs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No stale bugs matching this rule. 🎉
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {digest.staleBugs.map((bug: any) => {
                        const daysSinceUpdate = Math.floor(
                          (Date.now() - new Date(bug.updatedAt).getTime()) /
                            (1000 * 60 * 60 * 24)
                        );

                        return (
                          <Link
                            key={bug.id}
                            href={`/bugs/${bug.id}`}
                            className="flex items-center justify-between p-3 hover:bg-amber-50/50 transition group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Bug className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-mono font-semibold text-violet-600">
                                    {bug.key}
                                  </span>
                                  <span className="text-xs text-slate-700 truncate">
                                    {bug.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400">
                                    {bug.product?.name} / {bug.component?.name}
                                  </span>
                                  {bug.assignee && (
                                    <span className="text-[10px] text-slate-400">
                                      → {bug.assignee.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <StatusBadge status={bug.status} />
                              <SeverityBadge severity={bug.severity} />
                              <PriorityBadge priority={bug.priority} />
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-mono font-semibold">
                                {daysSinceUpdate}d stale
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 space-y-1">
        <p>
          <strong className="text-slate-700">How the Whining Engine works:</strong> Each rule monitors bugs in specified
          statuses that haven&apos;t been updated within the configured threshold. Click &quot;Run Now&quot; to generate an
          instant digest, or in production, connect to a cron scheduler (Vercel Cron, GitHub Actions) to
          hit <code className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">GET /api/cron/whining</code> on
          a recurring schedule.
        </p>
      </div>
    </div>
  );
}
