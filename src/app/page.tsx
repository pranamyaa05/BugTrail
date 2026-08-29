"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { SeverityBadge, PriorityBadge } from "@/components/severity-badge";
import { BUG_STATUSES, BUG_SEVERITIES } from "@/lib/workflow";
import { SavedQueries } from "@/components/saved-queries";
import { Search, Bug, CheckCircle2, AlertTriangle, Flame, MessageSquare, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [bugs, setBugs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [bugsRes, productsRes] = await Promise.all([
        fetch("/api/bugs"),
        fetch("/api/products"),
      ]);
      if (bugsRes.ok) {
        const bugsData = await bugsRes.json();
        setBugs(Array.isArray(bugsData) ? bugsData : []);
      }
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const eventSource = new EventSource("/api/events");
    eventSource.onmessage = () => {
      fetchDashboardData();
    };
    return () => eventSource.close();
  }, []);

  const filteredBugs = bugs.filter((bug) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      bug.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bug.key?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProduct = selectedProduct ? bug.productId === selectedProduct : true;
    const matchesStatus = selectedStatus ? bug.status === selectedStatus : true;
    const matchesSeverity = selectedSeverity ? bug.severity === selectedSeverity : true;

    return matchesSearch && matchesProduct && matchesStatus && matchesSeverity;
  });

  // Calculate metrics
  const totalTracked = bugs.length;
  const activeBugs = bugs.filter((b) => ["NEW", "ASSIGNED", "UNCONFIRMED"].includes(b.status)).length;
  const blockers = bugs.filter((b) => ["BLOCKER", "CRITICAL"].includes(b.severity)).length;
  const resolved = bugs.filter((b) => ["RESOLVED", "VERIFIED", "CLOSED"].includes(b.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-center space-x-4">
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Tracked</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalTracked}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active / In-Flight</p>
            <h3 className="text-2xl font-bold text-indigo-600">{activeBugs}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-center space-x-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Blockers & Critical</p>
            <h3 className="text-2xl font-bold text-rose-600">{blockers}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Resolved / Closed</p>
            <h3 className="text-2xl font-bold text-emerald-600">{resolved}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search defects by key, summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <SavedQueries 
            currentFilters={{
              searchQuery, selectedProduct, selectedStatus, selectedSeverity
            }}
            onLoadQuery={(filters) => {
              setSearchQuery(filters.searchQuery || "");
              setSelectedProduct(filters.selectedProduct || "");
              setSelectedStatus(filters.selectedStatus || "");
              setSelectedSeverity(filters.selectedSeverity || "");
            }}
          />
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
          >
            <option value="">All Statuses</option>
            {BUG_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
          >
            <option value="">All Severities</option>
            {BUG_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={fetchDashboardData}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Bug Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-3.5">Issue</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Severity / Priority</th>
                <th className="px-6 py-3.5">Assignee</th>
                <th className="px-6 py-3.5 text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-violet-600 mx-auto" />
                    <p className="mt-2 text-xs text-slate-500">Loading defects...</p>
                  </td>
                </tr>
              ) : filteredBugs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <AlertTriangle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 font-medium">No defects found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredBugs.map((bug) => (
                  <tr key={bug.id} className="hover:bg-violet-50/50 transition group">
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <Link
                          href={`/bugs/${bug.key}`}
                          className="font-mono text-xs text-violet-600 hover:underline font-bold"
                        >
                          {bug.key}
                        </Link>
                        <Link
                          href={`/bugs/${bug.key}`}
                          className="text-slate-800 font-medium text-xs mt-0.5 hover:text-violet-700 transition"
                        >
                          {bug.title}
                        </Link>
                        <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {bug.product?.name} / {bug.component?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={bug.status} resolution={bug.resolution} size="sm" />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <SeverityBadge severity={bug.severity} />
                        {bug.priority && <PriorityBadge priority={bug.priority} />}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      {bug.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                            {bug.assignee.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-slate-700 font-medium">{bug.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 text-slate-400 group-hover:text-violet-600 transition">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono">{bug._count?.comments ?? bug.commentsCount ?? 0}</span>
                      </div>
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