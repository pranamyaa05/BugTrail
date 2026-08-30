"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/components/user-context";
import { LandingView } from "@/components/landing-view";
import { StatusBadge } from "@/components/status-badge";
import { SeverityBadge, PriorityBadge } from "@/components/severity-badge";
import { BUG_STATUSES, BUG_SEVERITIES } from "@/lib/workflow";
import { SavedQueries } from "@/components/saved-queries";
import { Search, Bug, CheckCircle2, AlertTriangle, Flame, MessageSquare, RefreshCw, Building2 } from "lucide-react";

export default function DashboardPage() {
  const { currentUser, activeTeam, isLoading: authLoading } = useUser();
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
    if (currentUser) {
      fetchDashboardData();

      const eventSource = new EventSource("/api/events");
      eventSource.onmessage = () => {
        fetchDashboardData();
      };
      return () => eventSource.close();
    }
  }, [currentUser]);

  if (authLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-btpurple-600" />
        <p className="text-xs text-ochre-700 font-medium">Loading workspace...</p>
      </div>
    );
  }

  // Public landing page for signed-out visitors
  if (!currentUser) {
    return <LandingView />;
  }

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
      {/* Workspace Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl forest-gradient-frame shadow-forest-frame">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-thickblue-300 shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">{activeTeam?.name || "My Workspace"}</h2>
              {activeTeam?.joinCode && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 border border-white/20 text-thickblue-200">
                  Join Code: {activeTeam.joinCode}
                </span>
              )}
            </div>
            <p className="text-xs text-white/70">Defect Tracking &amp; Agile Pipeline</p>
          </div>
        </div>

        <Link
          href="/onboarding"
          className="text-xs font-semibold text-white bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl shadow-sm hover:bg-white/20 transition w-fit"
        >
          + Switch / Create Workspace
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="thickblue-card rounded-2xl shadow-thickblue-surface p-4 flex items-center space-x-4">
          <div className="p-3 bg-white rounded-xl text-ochre-700 border border-thickblue-200">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ochre-700 uppercase tracking-wide">Total Tracked</p>
            <h3 className="text-2xl font-bold text-ochre-950">{totalTracked}</h3>
          </div>
        </div>

        <div className="thickblue-card rounded-2xl shadow-thickblue-surface p-4 flex items-center space-x-4">
          <div className="p-3 bg-white rounded-xl text-thickblue-800 border border-thickblue-200">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ochre-700 uppercase tracking-wide">Active / In-Flight</p>
            <h3 className="text-2xl font-bold text-btpurple-700">{activeBugs}</h3>
          </div>
        </div>

        <div className="thickblue-card rounded-2xl shadow-thickblue-surface p-4 flex items-center space-x-4">
          <div className="p-3 bg-white rounded-xl text-ladybug-500 border border-thickblue-200">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ochre-700 uppercase tracking-wide">Blockers &amp; Critical</p>
            <h3 className="text-2xl font-bold text-ladybug-600">{blockers}</h3>
          </div>
        </div>

        <div className="thickblue-card rounded-2xl shadow-thickblue-surface p-4 flex items-center space-x-4">
          <div className="p-3 bg-white rounded-xl text-forest-600 border border-thickblue-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ochre-700 uppercase tracking-wide">Resolved / Closed</p>
            <h3 className="text-2xl font-bold text-forest-700">{resolved}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="thickblue-surface rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-thickblue-surface">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ochre-400" />
          <input
            type="text"
            placeholder="Search defects by key, summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-thickblue-200 rounded-xl text-xs text-ochre-950 placeholder-ochre-400 focus:outline-none focus:border-btpurple-500 focus:ring-2 focus:ring-btpurple-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <SavedQueries
            currentFilters={{
              searchQuery,
              selectedProduct,
              selectedStatus,
              selectedSeverity,
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
            className="bg-white border border-thickblue-300 rounded-xl px-3 py-2 text-xs text-ochre-950 focus:outline-none focus:border-btpurple-500"
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
            className="bg-white border border-thickblue-300 rounded-xl px-3 py-2 text-xs text-ochre-950 focus:outline-none focus:border-btpurple-500"
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
            className="bg-white border border-thickblue-300 rounded-xl px-3 py-2 text-xs text-ochre-950 focus:outline-none focus:border-btpurple-500"
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
            className="p-2 text-ochre-700 hover:text-ochre-950 hover:bg-white rounded-xl border border-thickblue-300 bg-white transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Bug Table */}
      <div className="thickblue-surface rounded-2xl shadow-thickblue-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-thickblue-200/90 border-b border-thickblue-300 text-[11px] uppercase tracking-wider text-thickblue-950 font-bold">
                <th className="px-6 py-3.5">Issue</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Severity / Priority</th>
                <th className="px-6 py-3.5">Assignee</th>
                <th className="px-6 py-3.5 text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-thickblue-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-btpurple-600 mx-auto" />
                    <p className="mt-2 text-xs text-ochre-700">Loading defects...</p>
                  </td>
                </tr>
              ) : filteredBugs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <AlertTriangle className="w-6 h-6 text-ochre-400 mx-auto mb-2" />
                    <p className="text-ochre-900 font-semibold">No defects found</p>
                    <p className="text-xs text-ochre-700 mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredBugs.map((bug) => (
                  <tr key={bug.id} className="hover:bg-white/80 transition group">
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <Link
                          href={`/bugs/${bug.key}`}
                          className="font-mono text-xs text-btpurple-700 hover:underline font-bold"
                        >
                          {bug.key}
                        </Link>
                        <Link
                          href={`/bugs/${bug.key}`}
                          className="text-ochre-950 font-semibold text-xs mt-0.5 hover:text-btpurple-800 transition"
                        >
                          {bug.title}
                        </Link>
                        <span className="text-[11px] font-mono text-ochre-700 mt-0.5">
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
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-btpurple-500 to-btpurple-700 text-white flex items-center justify-center text-[10px] font-bold">
                            {bug.assignee.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-ochre-900 font-medium">{bug.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-ochre-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 text-ochre-400 group-hover:text-btpurple-700 transition">
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