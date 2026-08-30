"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./user-context";
import {
  Search,
  Plus,
  ListFilter,
  LayoutGrid,
  Bug,
  UserCheck,
  X,
  ArrowRight,
  Command,
} from "lucide-react";

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { users, setCurrentUser } = useUser();
  const [query, setQuery] = useState("");
  const [bugs, setBugs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open trigger via custom event or props
          window.dispatchEvent(new CustomEvent("open-command-palette"));
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setBugs([]);
      return;
    }

    if (query.trim().length > 0) {
      setIsLoading(true);
      fetch(`/api/bugs?search=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data) => setBugs(Array.isArray(data) ? data : []))
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    } else {
      setBugs([]);
    }
  }, [query, isOpen]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-forest-950/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border border-thickblue-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search input header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-thickblue-200 bg-white/60">
          <Search className="w-4 h-4 text-btpurple-700 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, bug key (e.g. BUG-101), or search defects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-ochre-950 placeholder:text-ochre-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-ochre-400 hover:text-ochre-800 hover:bg-ochre-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results / Navigation Body */}
        <div className="p-2 overflow-y-auto space-y-3 text-xs max-h-[60vh]">
          {/* Direct Search Results */}
          {query.trim().length > 0 && (
            <div>
              <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-ochre-400">
                Search Results ({bugs.length})
              </div>
              {isLoading ? (
                <div className="p-4 text-center text-ochre-400">Searching defects repo...</div>
              ) : bugs.length === 0 ? (
                <div className="p-4 text-center text-ochre-400">No matching defects found</div>
              ) : (
                <div className="space-y-1">
                  {bugs.map((bug) => (
                    <button
                      key={bug.id}
                      onClick={() => navigateTo(`/bugs/${bug.key}`)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-btpurple-50 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bug className="w-4 h-4 text-btpurple-700 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-btpurple-800">{bug.key}</span>
                            <span className="font-medium text-ochre-950 line-clamp-1">{bug.title}</span>
                          </div>
                          <span className="text-[10px] text-ochre-400 font-mono">
                            {bug.product?.name} / {bug.component?.name}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-ochre-300 group-hover:text-btpurple-700 group-hover:translate-x-0.5 transition" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {query.trim().length === 0 && (
            <>
              <div>
                <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-ochre-400">
                  Navigation & Views
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => navigateTo("/")}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-btpurple-50 text-ochre-800 font-medium transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <ListFilter className="w-4 h-4 text-ochre-700" />
                      <span>Go to Defects List</span>
                    </div>
                    <span className="font-mono text-[10px] text-ochre-400 border border-thickblue-200 rounded px-1.5 py-0.5">
                      View
                    </span>
                  </button>

                  <button
                    onClick={() => navigateTo("/kanban")}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-btpurple-50 text-ochre-800 font-medium transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutGrid className="w-4 h-4 text-ochre-700" />
                      <span>Go to Kanban Board</span>
                    </div>
                    <span className="font-mono text-[10px] text-ochre-400 border border-thickblue-200 rounded px-1.5 py-0.5">
                      View
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-ochre-400">
                  Switch User Persona
                </div>
                <div className="space-y-0.5">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-btpurple-50 text-ochre-800 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserCheck className="w-4 h-4 text-ochre-400" />
                        <span className="font-medium">{u.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-btpurple-700 bg-btpurple-50 px-2 py-0.5 rounded border border-btpurple-200">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-thickblue-200 bg-white text-[10px] text-ochre-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="font-mono border border-thickblue-200 rounded bg-white px-1">↑</kbd> <kbd className="font-mono border border-thickblue-200 rounded bg-white px-1">↓</kbd> to navigate</span>
            <span><kbd className="font-mono border border-thickblue-200 rounded bg-white px-1">Esc</kbd> to exit</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-ochre-700">
            <Command className="w-3 h-3 text-ochre-400" /> + K
          </div>
        </div>
      </div>
    </div>
  );
}