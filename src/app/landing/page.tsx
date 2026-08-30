"use client";

import React from "react";
import Link from "next/link";
import { Bug, ArrowRight, ShieldCheck, Sparkles, Activity, Users, CheckCircle2, Lock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-[85vh] flex flex-col justify-between space-y-12 py-6">
      {/* Hero Header */}
      <div className="max-w-4xl mx-auto text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Bugzilla Modernization Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Enterprise Defect Tracking for Modern <span className="text-violet-600">Engineering Teams</span>
        </h1>

        <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          BugTrail replaces legacy page-reload trackers with real-time SSE sync, Google Gemini AI auto-triage, SHA-256 cryptographic audit logs, and multi-tenant workspace onboarding.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition flex items-center gap-2 shadow-sm"
          >
            <span>Get Started / Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
          >
            Sign In to Workspace
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full pt-8">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 w-fit">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Bugzilla Workflow FSM</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Strict Bugzilla lifecycle state machine (UNCONFIRMED → NEW → ASSIGNED → RESOLVED → VERIFIED → CLOSED) with drag-and-drop Kanban enforcement.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 w-fit">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-800">SHA-256 Cryptographic Audit</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tamper-evident ledger chaining every defect update with SHA-256 digests. Direct database tampering breaks chain verification automatically.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 w-fit">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Multi-Tenant RBAC & Teams</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Isolated workspaces with role-based permissions (ADMIN, TRIAGER, DEVELOPER, QA/TESTER, REPORTER) enforced server-side.
          </p>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-6">
        BugTrail v2.0 • Secure Authentication & Workspace Platform
      </div>
    </div>
  );
}