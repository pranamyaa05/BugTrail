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

  if (["/landing", "/login", "/signup"].includes(pathname) || (pathname === "/" && !currentUser)) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-ochre-300 bg-ochre-100/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-btpurple-500 to-btpurple-700 text-white shadow-sm group-hover:scale-105 transition transform">
                <Bug className="w-5 h-5" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-ladybug-500 border border-ochre-100 animate-pulse" />
            </div>
            <span className="font-bold text-base tracking-tight text-ochre-950">BugTrail</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-ochre-800 hover:text-ochre-950 hover:bg-ochre-200 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-3.5 py-1.5 rounded-xl bg-btpurple-600 hover:bg-btpurple-700 text-white font-semibold text-xs transition shadow-sm"
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
      <header className="sticky top-0 z-40 w-full border-b border-ochre-300 bg-ochre-100/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="p-2 rounded-xl bg-gradient-to-br from-btpurple-500 to-btpurple-700 text-white shadow-sm group-hover:scale-105 transition transform">
                  <Bug className="w-5 h-5" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-ladybug-500 border border-ochre-100 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-ochre-950">BugTrail</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-btpurple-100 text-btpurple-800 border border-btpurple-200 font-mono font-bold">
                    v2.0
                  </span>
                </div>
              </div>
            </Link>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-ochre-200/90 p-1 rounded-xl border border-ochre-300">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  pathname === "/"
                    ? "bg-btpurple-600 text-white shadow-sm"
                    : "text-ochre-700 hover:text-ochre-950 hover:bg-ochre-100"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Defects List</span>
              </Link>
              <Link
                href="/kanban"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  pathname === "/kanban"
                    ? "bg-btpurple-600 text-white shadow-sm"
                    : "text-ochre-700 hover:text-ochre-950 hover:bg-ochre-100"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </Link>
              <Link
                href="/whining"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  pathname === "/whining"
                    ? "bg-btpurple-600 text-white shadow-sm"
                    : "text-ochre-700 hover:text-ochre-950 hover:bg-ochre-100"
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
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-ochre-300 hover:bg-ochre-50 text-ochre-400 hover:text-ochre-700 text-xs font-medium transition shadow-sm"
              title="Search or type command (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search defects...</span>
              <kbd className="font-mono text-[10px] bg-ochre-100 border border-ochre-300 rounded px-1.5 py-0.5 text-ochre-700 flex items-center gap-0.5">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-btpurple-600 hover:bg-btpurple-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>File Bug</span>
            </button>

            {/* Notifications */}
            <NotificationsPopover />

            {/* User Profile & Team Switcher */}
            <div className="relative pl-2 border-l border-ochre-300">
              <button
                onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-ochre-50 bg-white border border-ochre-300 text-left transition shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-btpurple-500 to-btpurple-700 text-white font-bold flex items-center justify-center text-xs">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[11px] font-bold text-ochre-950 leading-tight">
                    {currentUser?.name || "User"}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-ochre-700 font-mono">
                    <span className="text-btpurple-700 font-bold">{userRole}</span>
                    {activeTeam && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[90px]">{activeTeam.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-ochre-400" />
              </button>

              {/* Workspace / Profile Menu */}
              {isWorkspaceMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-ochre-300 rounded-2xl shadow-xl z-50 p-2 text-xs space-y-2 animate-in fade-in duration-150">
                  {/* Account Header */}
                  <div className="p-2.5 rounded-xl bg-ochre-100 border border-ochre-200 space-y-1">
                    <div className="font-bold text-ochre-950">{currentUser?.name}</div>
                    <div className="text-ochre-700 font-mono text-[10px]">{currentUser?.email}</div>
                    <div className="inline-block mt-1 px-2 py-0.5 rounded bg-btpurple-100 text-btpurple-800 border border-btpurple-200 font-mono text-[10px] font-bold">
                      ROLE: {userRole}
                    </div>
                  </div>

                  {/* Active Workspace Info */}
                  {activeTeam && (
                    <div className="px-2 py-1">
                      <span className="text-[10px] font-bold uppercase text-ochre-400 tracking-wider block mb-1">
                        Active Workspace
                      </span>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-thickblue-50 border border-thickblue-200 text-thickblue-950">
                        <div className="font-medium text-thickblue-950 truncate">
                          {activeTeam.name}
                        </div>
                        {activeTeam.joinCode && (
                          <span
                            className="font-mono text-[10px] text-btpurple-800 bg-white border border-btpurple-200 px-1.5 py-0.5 rounded"
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
                    <div className="px-2 py-1 space-y-1 border-t border-ochre-200 pt-2">
                      <span className="text-[10px] font-bold uppercase text-ochre-400 tracking-wider block">
                        My Workspaces
                      </span>
                      {memberships.map((m) => (
                        <button
                          key={m.teamId}
                          onClick={() => {
                            switchTeam(m.teamId);
                            setIsWorkspaceMenuOpen(false);
                          }}
                          className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between transition ${
                            m.teamId === activeTeam?.id
                              ? "bg-btpurple-100 text-btpurple-900 font-bold"
                              : "hover:bg-ochre-100 text-ochre-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {m.teamId === activeTeam?.id && <Check className="w-3 h-3 text-btpurple-700 shrink-0" />}
                            <span className="truncate">{m.teamName}</span>
                          </div>
                          <span className="text-[10px] font-mono text-ochre-700 shrink-0">{m.role}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Team & Logout Actions */}
                  <div className="border-t border-ochre-200 pt-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsWorkspaceMenuOpen(false);
                        router.push("/onboarding");
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-btpurple-50 text-btpurple-800 font-semibold flex items-center gap-2"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Create or Join Team...</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsWorkspaceMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-ladybug-600 font-semibold flex items-center gap-2"
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