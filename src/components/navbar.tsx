"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "./user-context";
import { CreateBugModal } from "./create-bug-modal";
import { CommandPalette } from "./command-palette";
import { NotificationsPopover } from "./notifications-popover";
import { Bug, Plus, LayoutGrid, ListFilter, Search, Command, AlarmClock } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, users, setCurrentUser } = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);

  useEffect(() => {
    const handleOpenCmdK = () => setIsCmdKOpen(true);
    window.addEventListener("open-command-palette", handleOpenCmdK);
    return () => window.removeEventListener("open-command-palette", handleOpenCmdK);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white font-black shadow-sm group-hover:scale-105 transition transform">
                <Bug className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-slate-800">BugTrail</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-mono font-medium">
                    v2.0
                  </span>
                </div>
              </div>
            </Link>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  pathname === "/"
                    ? "bg-violet-50 text-violet-700 border border-violet-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Defects List</span>
              </Link>
              <Link
                href="/kanban"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  pathname === "/kanban"
                    ? "bg-violet-50 text-violet-700 border border-violet-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </Link>
              <Link
                href="/whining"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  pathname === "/whining"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <AlarmClock className="w-3.5 h-3.5" />
                <span>Whining</span>
              </Link>
            </nav>
          </div>

          {/* Right actions: Cmd+K search button + File Bug + Persona switcher */}
          <div className="flex items-center gap-3">
            {/* Cmd+K trigger button */}
            <button
              onClick={() => setIsCmdKOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs transition"
              title="Search or type command (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search defects...</span>
              <kbd className="font-mono text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 flex items-center gap-0.5">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>File Bug</span>
            </button>

            {/* Notifications */}
            <NotificationsPopover />

            {/* Persona Switcher for Quick Demo */}
            <div className="relative flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[11px] font-medium text-slate-800 leading-tight">
                  {currentUser?.name || "Loading..."}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentUser?.role || "ROLE"}
                </span>
              </div>

              <select
                value={currentUser?.id || ""}
                onChange={(e) => {
                  const u = users.find((item) => item.id === e.target.value);
                  if (u) setCurrentUser(u);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
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
          window.location.reload();
        }}
      />

      <CommandPalette
        isOpen={isCmdKOpen}
        onClose={() => setIsCmdKOpen(false)}
      />
    </>
  );
}