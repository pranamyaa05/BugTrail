"use client";

import React, { useState } from "react";
import { useUser } from "./user-context";
import { Flag as FlagIcon } from "lucide-react";

interface FlagMatrixProps {
  bugId: string;
  flags: any[];
  onFlagUpdate: () => void;
}

export function FlagMatrix({ bugId, flags, onFlagUpdate }: FlagMatrixProps) {
  const { currentUser, users } = useUser();
  const [flagName, setFlagName] = useState("review");
  const [flagStatus, setFlagStatus] = useState("?");
  const [requesteeId, setRequesteeId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/bugs/${bugId}/flags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setterId: currentUser.id,
          requesteeId: flagStatus === "?" ? requesteeId : null,
          name: flagName,
          status: flagStatus,
        }),
      });
      setFlagName("review");
      setFlagStatus("?");
      setRequesteeId("");
      onFlagUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {flags.length === 0 ? (
          <span className="text-ochre-400 text-[11px] italic">No flags set.</span>
        ) : (
          flags.map((flag) => (
            <div key={flag.id} className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold text-ochre-800">{flag.name}{flag.status}</span>
              <span className="text-ochre-700">by {flag.setter.name}</span>
              {flag.requestee && (
                <span className="text-ochre-700">requested of {flag.requestee.name}</span>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3 bg-white border border-thickblue-200 rounded-lg">
        <div className="flex gap-2">
          <select 
            value={flagName} 
            onChange={e => setFlagName(e.target.value)}
            className="text-xs p-1.5 border border-thickblue-200 rounded focus:outline-none focus:border-btpurple-500"
          >
            <option value="review">review</option>
            <option value="needinfo">needinfo</option>
            <option value="approval">approval</option>
          </select>
          <select 
            value={flagStatus} 
            onChange={e => setFlagStatus(e.target.value)}
            className="text-xs p-1.5 border border-thickblue-200 rounded focus:outline-none focus:border-btpurple-500"
          >
            <option value="?">?</option>
            <option value="+">+</option>
            <option value="-">-</option>
          </select>
        </div>
        
        {flagStatus === "?" && (
          <select 
            value={requesteeId} 
            onChange={e => setRequesteeId(e.target.value)}
            className="text-xs p-1.5 border border-thickblue-200 rounded focus:outline-none focus:border-btpurple-500"
          >
            <option value="">(Select Requestee)</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
        
        <button 
          type="submit" 
          disabled={isSubmitting || !currentUser || (flagStatus === "?" && !requesteeId)}
          className="px-2 py-1.5 bg-btpurple-600 text-white text-xs font-semibold rounded hover:bg-btpurple-700 disabled:opacity-50"
        >
          Set Flag
        </button>
      </form>
    </div>
  );
}
