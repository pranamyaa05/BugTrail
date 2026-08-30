import React from "react";
import Link from "next/link";
import {
  Bug,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Users,
  Zap,
  Search,
  Bell,
  MessageSquare,
} from "lucide-react";

const FEATURES = [
  {
    icon: Activity,
    title: "Bugzilla Workflow FSM",
    desc: "Strict lifecycle state machine (UNCONFIRMED → NEW → ASSIGNED → RESOLVED → VERIFIED → CLOSED) enforced across lists and a drag-and-drop Kanban board.",
    iconClasses: "bg-btpurple-100 text-btpurple-800 border-btpurple-200",
  },
  {
    icon: Sparkles,
    title: "AI Triage & Dedup",
    desc: "Google Gemini suggests severity and priority as you file, and flags potential duplicate defects before they clutter your pipeline.",
    iconClasses: "bg-thickblue-100 text-thickblue-900 border-thickblue-300",
  },
  {
    icon: ShieldCheck,
    title: "SHA-256 Audit Trail",
    desc: "Every update is chained into a tamper-evident cryptographic ledger. Direct database tampering breaks verification automatically.",
    iconClasses: "bg-forest-600/15 text-forest-700 border-forest-600/40",
  },
  {
    icon: Users,
    title: "Real-Time Multi-Tenant Teams",
    desc: "Isolated workspaces with role-based permissions (ADMIN, TRIAGER, DEVELOPER, QA/TESTER, REPORTER) and live SSE sync on every board.",
    iconClasses: "bg-amber-100 text-amber-800 border-amber-300",
  },
];

const MOCK_ROWS = [
  { key: "BT-1042", title: "Session token refresh fails on mobile", status: "New", chip: "bg-thickblue-100 text-thickblue-800 border-thickblue-300", who: "AM" },
  { key: "BT-1039", title: "Pagination jumps on dashboard grid", status: "Assigned", chip: "bg-btpurple-100 text-btpurple-800 border-btpurple-200", who: "RK" },
  { key: "BT-1035", title: "Null pointer in CSV import parser", status: "Resolved", chip: "bg-forest-600/10 text-forest-700 border-forest-600/40", who: "JD" },
  { key: "BT-1031", title: "Low contrast on status badges (dark)", status: "Unconfirmed", chip: "bg-amber-50 text-amber-800 border-amber-300", who: "—", unassigned: true },
];

export function LandingView() {
  return (
    <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
      {/* Decorative background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-thickblue-300/30 blur-3xl" />
        <div className="absolute top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-btpurple-300/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-forest-600/10 blur-3xl" />
      </div>

      <div className="relative">
        {/* HERO */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Copy */}
            <div className="text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-btpurple-100 border border-btpurple-200 text-btpurple-800 text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Generation Bugzilla Modernization Engine</span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-ochre-950 tracking-tight leading-[1.05]">
                Ship cleaner code with{" "}
                <span className="text-btpurple-700">BugTrail</span>
              </h1>

              <p className="text-base sm:text-lg text-ochre-800 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                BugTrail is a fast, modern defect tracker for engineering teams — a Bugzilla-style
                workflow engine with real-time sync, AI triage, and tamper-evident audit trails.
                File, triage, and close bugs without the page-reload pain.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl bg-btpurple-600 hover:bg-btpurple-700 text-white font-bold text-sm transition flex items-center gap-2 shadow-corp-card hover:-translate-y-0.5"
                >
                  <Zap className="w-4 h-4" />
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl bg-white border border-ochre-300 hover:bg-ochre-100 text-ochre-950 font-bold text-sm transition shadow-sm"
                >
                  Sign In
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 pt-2 text-xs text-ochre-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-forest-600" /> SHA-256 verified
                </span>
                <span className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-btpurple-600" /> Live SSE updates
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-thickblue-700" /> Role-based workspaces
                </span>
              </div>
            </div>

            {/* Illustration / UI preview */}
            <div className="relative">
              <div className="absolute -top-5 -left-4 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-thickblue-300 shadow-corp-card text-[11px] font-bold text-ochre-950">
                <Sparkles className="w-3.5 h-3.5 text-btpurple-600" />
                AI triage applied
              </div>
              <div className="absolute -bottom-5 -right-3 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-forest-600/40 shadow-corp-card text-[11px] font-bold text-forest-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                Audit chain intact
              </div>
              <div className="absolute -top-3 right-8 w-4 h-4 rounded-full bg-ladybug-500 border-2 border-ochre-100 animate-ping hidden sm:block" />

              <div className="forest-gradient-frame rounded-3xl shadow-forest-frame p-3 sm:p-4">
                <div className="rounded-2xl bg-ochre-50 overflow-hidden border border-white/10">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-ochre-100 border-b border-ochre-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-ladybug-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-forest-600" />
                    <span className="ml-3 text-[10px] font-mono text-ochre-700 bg-white border border-ochre-300 rounded-md px-2 py-0.5">
                      bugtrail — defect pipeline
                    </span>
                    <div className="ml-auto flex items-center gap-2 text-ochre-400">
                      <Search className="w-3.5 h-3.5" />
                      <Bell className="w-3.5 h-3.5" />
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-btpurple-500 to-btpurple-700 text-white text-[9px] font-bold flex items-center justify-center">
                        BT
                      </span>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="hidden sm:flex w-36 shrink-0 flex-col gap-1 p-3 bg-white border-r border-ochre-200 text-[11px] font-semibold">
                      <span className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-btpurple-600 text-white">
                        <Bug className="w-3 h-3" /> Defects
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-ochre-700">
                        <Activity className="w-3 h-3" /> Kanban
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-ochre-700">
                        <Bell className="w-3 h-3" /> Whining
                      </span>
                    </div>

                    <div className="flex-1 p-3 sm:p-4 space-y-3 bg-ochre-50">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="thickblue-card rounded-xl p-2.5">
                          <p className="text-[9px] font-bold text-ochre-700 uppercase tracking-wide">Total</p>
                          <p className="text-lg font-extrabold text-ochre-950">128</p>
                        </div>
                        <div className="thickblue-card rounded-xl p-2.5">
                          <p className="text-[9px] font-bold text-ochre-700 uppercase tracking-wide">In-Flight</p>
                          <p className="text-lg font-extrabold text-btpurple-700">42</p>
                        </div>
                        <div className="thickblue-card rounded-xl p-2.5">
                          <p className="text-[9px] font-bold text-ochre-700 uppercase tracking-wide">Resolved</p>
                          <p className="text-lg font-extrabold text-forest-700">86</p>
                        </div>
                      </div>

                      <div className="thickblue-surface rounded-xl overflow-hidden shadow-thickblue-surface">
                        {MOCK_ROWS.map((row, i) => (
                          <div
                            key={row.key}
                            className={`flex items-center gap-2.5 px-3 py-2.5 text-[11px] ${
                              i !== MOCK_ROWS.length - 1 ? "border-b border-thickblue-200" : ""
                            }`}
                          >
                            <span className="font-mono font-bold text-btpurple-700 shrink-0">{row.key}</span>
                            <span className="flex-1 truncate font-semibold text-ochre-950">{row.title}</span>
                            <MessageSquare className="w-3 h-3 text-ochre-400 shrink-0" />
                            <span className={`hidden sm:inline-flex px-1.5 py-0.5 rounded-full border text-[9px] font-bold shrink-0 ${row.chip}`}>
                              {row.status}
                            </span>
                            <span className="w-5 h-5 rounded-full bg-white border border-thickblue-300 text-btpurple-700 text-[8px] font-bold flex items-center justify-center shrink-0">
                              {row.who}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between px-1 text-[10px] font-mono text-ochre-700">
                        <span>UNCONFIRMED → NEW → ASSIGNED → RESOLVED</span>
                        <span className="hidden sm:inline text-btpurple-700 font-bold">live ●</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ochre-950 tracking-tight">
              Everything a modern bug tracker needs
            </h2>
            <p className="text-sm text-ochre-700 max-w-xl mx-auto">
              Built for engineering teams that outgrew spreadsheets and legacy page-reload trackers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="thickblue-card rounded-2xl shadow-thickblue-surface p-5 space-y-3 hover:-translate-y-1 transition"
              >
                <div className={`p-2.5 rounded-xl border w-fit ${f.iconClasses}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-ochre-950">{f.title}</h3>
                <p className="text-xs text-ochre-800 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA STRIP */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <div className="forest-gradient-frame rounded-3xl shadow-forest-frame p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="hidden sm:flex p-3 rounded-2xl bg-white/10 border border-white/20 text-thickblue-300">
                <Bug className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Ready to trail your bugs down?
                </h3>
                <p className="text-sm text-white/70 mt-1">
                  Create an account or sign in to your workspace in seconds.
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="shrink-0 px-6 py-3 rounded-xl bg-btpurple-600 hover:bg-btpurple-700 text-white font-bold text-sm transition flex items-center gap-2 shadow-corp-card"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-ochre-300 bg-ochre-100/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-btpurple-500 to-btpurple-700 text-white">
                <Bug className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-ladybug-500" />
              </div>
              <span className="font-bold text-sm text-ochre-950">BugTrail</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-btpurple-100 text-btpurple-800 border border-btpurple-200 font-mono font-bold">
                v2.0
              </span>
            </div>
            <p className="text-xs text-ochre-700 font-medium">
              Defect Tracking &amp; Agile Pipeline • Secure Authentication &amp; Workspaces
            </p>
            <div className="flex items-center gap-4 text-xs font-bold">
              <Link href="/login" className="text-ochre-800 hover:text-btpurple-700 transition">
                Sign In
              </Link>
              <Link href="/login" className="text-btpurple-700 hover:text-btpurple-800 transition">
                Get Started →
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}