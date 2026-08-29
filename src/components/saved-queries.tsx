"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "./user-context";
import { BookmarkPlus, Bookmark, Trash2 } from "lucide-react";

interface SavedQueriesProps {
  currentFilters: any;
  onLoadQuery: (filters: any) => void;
}

export function SavedQueries({ currentFilters, onLoadQuery }: SavedQueriesProps) {
  const { currentUser } = useUser();
  const [queries, setQueries] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newQueryName, setNewQueryName] = useState("");

  const fetchQueries = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/saved-queries?userId=${currentUser.id}`);
      const data = await res.json();
      setQueries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchQueries();
    }
  }, [currentUser, fetchQueries]);

  const saveCurrentQuery = async () => {
    if (!currentUser || !newQueryName.trim()) return;
    
    try {
      await fetch("/api/saved-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          name: newQueryName.trim(),
          queryJson: currentFilters,
        }),
      });
      setNewQueryName("");
      setIsOpen(false);
      fetchQueries();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteQuery = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/saved-queries/${id}`, { method: "DELETE" });
      fetchQueries();
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition"
      >
        <Bookmark className="w-3.5 h-3.5 text-violet-600" />
        Saved Queries
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-xl z-50 p-3">
          <div className="space-y-2 mb-3">
            <h4 className="text-[10px] uppercase font-bold text-slate-400">Save Current Filter</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Query Name..."
                value={newQueryName}
                onChange={(e) => setNewQueryName(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={saveCurrentQuery}
                disabled={!newQueryName.trim()}
                className="px-2 py-1 bg-violet-100 text-violet-700 rounded hover:bg-violet-200 disabled:opacity-50"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-1 max-h-40 overflow-y-auto">
            <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-1">Your Queries</h4>
            {queries.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No saved queries.</div>
            ) : (
              queries.map(q => (
                <div key={q.id} className="flex items-center justify-between group">
                  <button
                    onClick={() => {
                      onLoadQuery(JSON.parse(q.queryJson));
                      setIsOpen(false);
                    }}
                    className="flex-1 text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded truncate text-slate-700"
                  >
                    {q.name}
                  </button>
                  <button onClick={(e) => deleteQuery(q.id, e)} className="p-1 text-slate-300 hover:text-red-500 hidden group-hover:block">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
