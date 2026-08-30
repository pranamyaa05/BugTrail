"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
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
  const router = useRouter();
  const { currentUser, isLoading: authLoading } = useUser();
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

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    }
  }, [authLoading, currentUser, router]);

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
    if (currentUser) {
      fetchRules();
    }
  }, [fetchRules, currentUser]);

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
      console.error("Failed to create whining rule:", err);
    }
  };

  const handleToggleActive = async (ruleId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/whining-rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      fetchRules();
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this whining rule?")) return;
    try {
      await fetch(`/api/whining-rules/${ruleId}`, { method: "DELETE" });
      fetchRules();
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const handleRunEngine = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/cron/whining");
      const data = await res.json();
      if (data.success) {
        setDigests(data.digests || []);
        if (data.digests && data.digests.length > 0) {
          setExpandedDigest(data.digests[0].ruleId);
        }
      }
      fetchRules();
    } catch (err) {
      console.error("Failed to run whining engine:", err);
    } finally {
      setIsRunning(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-btpurple-100 border border-btpurple-200 flex items-center justify-center text-btpurple-700 shadow-sm">
            <AlarmClock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ochre-950 tracking-tight">Automated Whining Engine</h1>
            <p className="text-xs text-ochre-700 font-medium">
              Configure stale defect alerts and automated reminder digests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunEngine}
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
            <span>{isRunning ? "Running Digest..." : "Run Whining Digest"}</span>
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3.5 py-1.5 rounded-xl bg-btpurple-600 hover:bg-btpurple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Whining Rule</span>
          </button>
        </div>
      </div>

      {/* Digest Results Banner */}
      {digests.length > 0 && (
        <div className="p-5 rounded-2xl thickblue-card shadow-thickblue-surface space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ochre-950 flex items-center gap-2">
              <AlarmClock className="w-4 h-4 text-btpurple-700" />
              <span>Whining Digest Output</span>
            </h3>
            <span className="text-xs text-ochre-700 font-mono">
              Total Stale Defects: {digests.reduce((sum, d) => sum + d.staleBugs.length, 0)}
            </span>
          </div>

          <div className="space-y-2">
            {digests.map((d) => (
              <div
                key={d.ruleId}
                className="border border-thickblue-300 rounded-xl overflow-hidden bg-white/60 text-xs"
              >
                <button
                  onClick={() =>
                    setExpandedDigest(expandedDigest === d.ruleId ? null : d.ruleId)
                  }
                  className="w-full px-4 py-2.5 flex items-center justify-between font-semibold text-ochre-950 hover:bg-ochre-100 transition"
                >
                  <div className="flex items-center gap-2">
                    {expandedDigest === d.ruleId ? (
                      <ChevronDown className="w-4 h-4 text-ochre-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-ochre-400" />
                    )}
                    <span>{d.ruleName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[10px] font-bold">
                    {d.staleBugs.length} stale defect(s)
                  </span>
                </button>

                {expandedDigest === d.ruleId && (
                  <div className="p-3 border-t border-thickblue-300 bg-white space-y-2">
                    {d.staleBugs.length === 0 ? (
                      <p className="text-ochre-400 italic text-[11px]">No stale bugs matched this rule.</p>
                    ) : (
                      d.staleBugs.map((bug: any) => (
                        <div
                          key={bug.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-thickblue-200 hover:bg-btpurple-50/50"
                        >
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/bugs/${bug.key}`}
                              className="font-mono text-btpurple-700 font-bold hover:underline"
                            >
                              {bug.key}
                            </Link>
                            <span className="text-ochre-950 font-semibold">{bug.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={bug.status} size="sm" />
                            <span className="text-[10px] text-ochre-400 font-mono">
                              Updated {new Date(bug.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rule Creation Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateRule}
          className="p-5 rounded-2xl thickblue-card shadow-thickblue-surface space-y-4 text-xs animate-in fade-in duration-150"
        >
          <h3 className="text-sm font-bold text-ochre-950">Create New Whining Rule</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ochre-800 mb-1">Rule Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Critical Blockers Stale > 2 days"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 focus:outline-none focus:border-btpurple-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-ochre-800 mb-1">Inactivity Threshold (Days) *</label>
              <input
                type="number"
                min={1}
                max={30}
                value={newStaleDays}
                onChange={(e) => setNewStaleDays(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 focus:outline-none focus:border-btpurple-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ochre-800 mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Alerts lead triager when critical bugs sit without updates"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-white border border-thickblue-200 rounded-xl px-3 py-2 text-ochre-950 focus:outline-none focus:border-btpurple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1.5 rounded-xl bg-white border border-ochre-300 text-ochre-800 hover:bg-ochre-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-btpurple-600 hover:bg-btpurple-700 text-white font-bold shadow-sm"
            >
              Save Whining Rule
            </button>
          </div>
        </form>
      )}

      {/* Rules List */}
      <div className="thickblue-surface rounded-2xl shadow-thickblue-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-thickblue-300 bg-thickblue-200/70 flex items-center justify-between">
          <h3 className="text-xs font-bold text-thickblue-950 uppercase tracking-wider">
            Active Whining Rules ({rules.length})
          </h3>
        </div>

        <div className="divide-y divide-thickblue-200 text-xs">
          {isLoading ? (
            <div className="p-8 text-center text-ochre-700">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-btpurple-600 mb-2" />
              <span>Loading whining rules...</span>
            </div>
          ) : rules.length === 0 ? (
            <div className="p-8 text-center text-ochre-700">
              <AlarmClock className="w-6 h-6 mx-auto text-ochre-300 mb-2" />
              <span>No whining rules configured yet.</span>
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 flex items-center justify-between hover:bg-white/70 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ochre-950">{rule.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        rule.isActive
                          ? "bg-forest-600/10 text-forest-700 border-forest-600/40"
                          : "bg-ochre-100 text-ochre-700 border-ochre-300"
                      }`}
                    >
                      {rule.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  {rule.description && <p className="text-ochre-700">{rule.description}</p>}
                  <div className="flex items-center gap-3 text-[11px] text-ochre-400 font-mono pt-1">
                    <span>Statuses: {rule.statuses}</span>
                    <span>•</span>
                    <span>Stale: &gt;{rule.staleDays} days</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(rule.id, rule.isActive)}
                    className="p-1.5 rounded-lg border border-thickblue-300 bg-white hover:bg-ochre-100 text-ochre-700 transition"
                    title={rule.isActive ? "Deactivate Rule" : "Activate Rule"}
                  >
                    {rule.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded-lg border border-red-300 bg-white hover:bg-red-50 text-ladybug-600 transition"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}