"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { SeverityBadge, PriorityBadge } from "@/components/severity-badge";
import { BUG_STATUSES, BUG_SEVERITIES, BUG_PRIORITIES } from "@/lib/workflow";
import {
  Search,
  Filter,
  Bug,
  CheckCircle2,
  AlertTriangle,
  Flame,
  MessageSquare,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const [bugs, setBugs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");

  const fetchBugs = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedProduct !== "ALL") params.append("productId", selectedProduct);
    if (selectedStatus !== "ALL") params.append("status", selectedStatus);
    if (selectedSeverity !== "ALL") params.append("severity", selectedSeverity);

    fetch(`/api/bugs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setBugs(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to fetch bugs", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to fetch products", err));
  }, []);

  useEffect(() => {
    fetchBugs();
  }, [search, selectedProduct, selectedStatus, selectedSeverity]);

  // Metric computations
  const totalBugs = bugs.length;
  const activeBugs = bugs.filter((b) => ["NEW", "ASSIGNED", "UNCONFIRMED"].includes(b.status)).length;
  const blockerBugs = bugs.filter((b) => ["BLOCKER", "CRITICAL"].includes(b.severity)).length;
  const resolvedBugs = bugs.filter((b) => ["RESOLVED", "VERIFIED", "CLOSED"].includes(b.status)).length;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400">Total Tracked</p>
            <p className="text-2xl font-bold text-zinc-100 mt-1">{totalBugs}</p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-800 text-zinc-300">
            <Bug className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400">Active / In-Flight</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{activeBugs}</p>
          </div>
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400">Blockers & Critical</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">{blockerBugs}</p>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400">Resolved / Closed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{resolvedBugs}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search defects by key, summary, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 shrink-0"
          >
            <option value="ALL">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 shrink-0"
          >
            <option value="ALL">All Statuses</option>
            {BUG_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 shrink-0"
          >
            <option value="ALL">All Severities</option>
            {BUG_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={fetchBugs}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition shrink-0"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Bugs Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 font-medium">
              <tr>
                <th className="px-4 py-3.5 w-24">Key</th>
                <th className="px-4 py-3.5">Defect Summary & Hierarchy</th>
                <th className="px-4 py-3.5 w-36">Status / Resolution</th>
                <th className="px-4 py-3.5 w-28">Severity</th>
                <th className="px-4 py-3.5 w-20">Priority</th>
                <th className="px-4 py-3.5 w-40">Assignee</th>
                <th className="px-4 py-3.5 w-16 text-center">Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading defects repository...
                  </td>
                </tr>
              ) : bugs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    No defects match the selected filters.
                  </td>
                </tr>
              ) : (
                bugs.map((bug) => (
                  <tr
                    key={bug.id}
                    className="hover:bg-zinc-900/60 transition group cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-amber-500 group-hover:underline">
                      <Link href={`/bugs/${bug.key}`}>{bug.key}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/bugs/${bug.key}`}
                          className="font-medium text-zinc-200 group-hover:text-amber-400 transition leading-snug line-clamp-1"
                        >
                          {bug.title}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                          <span className="text-zinc-400">{bug.product?.name}</span>
                          <span>/</span>
                          <span className="text-zinc-300 font-medium">{bug.component?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={bug.status} resolution={bug.resolution} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={bug.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={bug.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 overflow-hidden">
                          {bug.assignee?.name ? (
                            bug.assignee.name.charAt(0)
                          ) : (
                            <span className="text-zinc-600">?</span>
                          )}
                        </div>
                        <span className="text-zinc-300 truncate max-w-[120px]">
                          {bug.assignee?.name || <span className="text-zinc-600 italic">Unassigned</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-zinc-400 font-mono">
                        <MessageSquare className="w-3 h-3 text-zinc-500" />
                        {bug._count?.comments ?? 0}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}