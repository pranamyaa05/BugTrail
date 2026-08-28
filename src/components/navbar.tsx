"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "./user-context";
import { CreateBugModal } from "./create-bug-modal";
import { Bug, Plus, LayoutGrid, ListFilter, UserCheck, ShieldCheck } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, users, setCurrentUser } = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-zinc-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition transform">
                <Bug className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-zinc-100">BugTrail</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-medium">
                    v2.0
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Modernized Defect Tracker</span>
              </div>
            </Link>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  pathname === "/"
                    ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/60"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Defects List</span>
              </Link>
              <Link
                href="/kanban"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  pathname === "/kanban"
                    ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/60"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </Link>
            </nav>
          </div>

          {/* Right actions: Create bug + Persona switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>File Bug</span>
            </button>

            {/* Persona Switcher for Quick Demo */}
            <div className="relative flex items-center gap-2 pl-3 border-l border-zinc-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[11px] font-medium text-zinc-200 leading-tight">
                  {currentUser?.name || "Loading..."}
                </span>
                <span className="text-[10px] text-amber-400/90 font-mono">
                  {currentUser?.role || "ROLE"}
                </span>
              </div>

              <select
                value={currentUser?.id || ""}
                onChange={(e) => {
                  const u = users.find((item) => item.id === e.target.value);
                  if (u) setCurrentUser(u);
                }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                title="Switch User Persona (Demo)"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <CreateBugModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          // Trigger page reload / state refresh
          window.location.reload();
        }}
      />
    </>
  );
}