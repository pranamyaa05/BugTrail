"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { Users, Plus, KeyRound, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, refreshAuth } = useUser();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Create Team state
  const [teamName, setTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join Team state
  const [joinCode, setJoinCode] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("DEVELOPER");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create team");

      await refreshAuth();
      router.push("/");
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    // Enforce role restriction on client side as well
    if (selectedRole === "ADMIN") {
      setJoinError("Joining members cannot assign themselves as ADMIN.");
      return;
    }

    setIsJoining(true);

    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode, role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join team");

      await refreshAuth();
      router.push("/");
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 mb-1">
          <Users className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Setup Your BugTrail Workspace</h1>
        <p className="text-xs text-slate-500">
          Welcome {currentUser?.name || "Developer"}! Create a new team or join an existing workspace.
        </p>
      </div>

      {/* Tabs toggle */}
      <div className="flex border-b border-slate-200 justify-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("create")}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === "create"
              ? "border-violet-600 text-violet-700"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Workspace</span>
        </button>

        <button
          onClick={() => setActiveTab("join")}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === "join"
              ? "border-violet-600 text-violet-700"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Join Existing Workspace</span>
        </button>
      </div>

      {/* Card 1: Create Team */}
      {activeTab === "create" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Create a New Engineering Workspace</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              You will automatically become the <strong className="text-violet-700">ADMIN</strong> of this workspace and receive a unique shareable join code.
            </p>
          </div>

          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Workspace / Team Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Core Engineering, Mobile Frontend Team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !teamName.trim()}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{isCreating ? "Creating Workspace..." : "Create Workspace & Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Card 2: Join Team */}
      {activeTab === "join" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Join an Existing Team</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the join code provided by your workspace admin and select your team role.
            </p>
          </div>

          {joinError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{joinError}</span>
            </div>
          )}

          <form onSubmit={handleJoinTeam} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Workspace Join Code</label>
              <input
                type="text"
                required
                placeholder="e.g. BT-8X9K2L or DEMO-BUGTRAIL"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono uppercase focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Select Your Workspace Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
              >
                <option value="DEVELOPER">DEVELOPER — State transitions, code patches, bug fixes</option>
                <option value="TRIAGER">TRIAGER — Priority/Severity triage & bug assignment</option>
                <option value="QA/TESTER">QA/TESTER — Bug reporting, resolution verification & testing</option>
                <option value="REPORTER">REPORTER — Defect filing & status watching</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1 italic">
                Note: ADMIN role is reserved for workspace creators and cannot be selected when joining.
              </p>
            </div>

            <button
              type="submit"
              disabled={isJoining || !joinCode.trim()}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{isJoining ? "Joining Workspace..." : "Join Workspace & Enter"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}