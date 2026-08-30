"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "./user-context";
import { CreateBugModal } from "./create-bug-modal";
import { CommandPalette } from "./command-palette";
import { NotificationsPopover } from "./notifications-popover";
import {
  Bug,
  Plus,
  LayoutGrid,
  ListFilter,
  Search,
  Command,
  AlarmClock,
  LogOut,
  ChevronDown,
  Building2,
  Check,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, activeTeam, userRole, memberships, switchTeam, logout } = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  useEffect(() => {
    const handleOpenCmdK = () => setIsCmdKOpen(true);
    window.addEventListener("open-command-palette", handleOpenCmdK);
    return () => window.removeEventListener("open-command-palette", handleOpenCmdK);
  }, []);

  if (["/landing", "/login", "/signup"].includes(pathname)) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white font-black shadow-sm">
              <Bug className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-800">BugTrail</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
    );
  }

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

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Cmd+K trigger button */}
            <button
              onClick={() => setIsCmdKOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs transition"
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

            {/* User Profile & Team Switcher */}
            <div className="relative pl-2 border-l border-slate-200">
              <button
                onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 text-left transition"
              >
                <div className="w-7 h-7 rounded-full bg-violet-100 border border-violet-200 text-violet-700 font-bold flex items-center justify-center text-xs">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[11px] font-bold text-slate-800 leading-tight">
                    {currentUser?.name || "User"}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <span className="text-violet-600 font-semibold">{userRole}</span>
                    {activeTeam && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[90px]">{activeTeam.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Workspace / Profile Menu */}
              {isWorkspaceMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 text-xs space-y-2 animate-in fade-in duration-150">
                  {/* Account Header */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">{currentUser?.name}</div>
                    <div className="text-slate-500 font-mono text-[10px]">{currentUser?.email}</div>
                    <div className="inline-block mt-1 px-2 py-0.5 rounded bg-violet-100 text-violet-700 font-mono text-[10px] font-bold">
                      ROLE: {userRole}
                    </div>
                  </div>

                  {/* Active Workspace Info */}
                  {activeTeam && (
                    <div className="px-2 py-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                        Active Workspace
                      </span>
                      <div className="flex items-center justify-between p-2 rounded bg-violet-50/50 border border-violet-100 text-slate-800">
                        <div className="font-medium text-slate-800 truncate">
                          {activeTeam.name}
                        </div>
                        {activeTeam.joinCode && (
                          <span
                            className="font-mono text-[10px] text-violet-700 bg-white border border-violet-200 px-1.5 py-0.5 rounded"
                            title="Shareable Join Code"
                          >
                            {activeTeam.joinCode}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Switch Workspace (Lists ONLY teams the user is actually a member of!) */}
                  {memberships.length > 0 && (
                    <div className="px-2 py-1 space-y-1 border-t border-slate-100 pt-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                        My Workspaces
                      </span>
                      {memberships.map((m) => (
                        <button
                          key={m.teamId}
                          onClick={() => {
                            switchTeam(m.teamId);
                            setIsWorkspaceMenuOpen(false);
                          }}
                          className={`w-full text-left p-1.5 rounded flex items-center justify-between transition ${
                            m.teamId === activeTeam?.id
                              ? "bg-violet-100 text-violet-800 font-bold"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {m.teamId === activeTeam?.id && <Check className="w-3 h-3 text-violet-600 shrink-0" />}
                            <span className="truncate">{m.teamName}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">{m.role}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Team & Logout Actions */}
                  <div className="border-t border-slate-100 pt-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsWorkspaceMenuOpen(false);
                        router.push("/onboarding");
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-50 text-violet-700 font-medium flex items-center gap-2"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Create or Join Team...</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsWorkspaceMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-red-50 text-red-600 font-medium flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
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