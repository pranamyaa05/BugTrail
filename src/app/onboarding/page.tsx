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
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-btpurple-500 to-btpurple-700 text-white border border-btpurple-600 shadow-corp-card mb-1">
          <Users className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-ochre-950 tracking-tight">Setup Your BugTrail Workspace</h1>
        <p className="text-xs text-ochre-700">
          Welcome {currentUser?.name || "Developer"}! Create a new team or join an existing workspace.
        </p>
      </div>

      {/* Tabs toggle */}
      <div className="flex border-b border-ochre-300 justify-center gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab("create")}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === "create"
              ? "border-btpurple-600 text-btpurple-700"
              : "border-transparent text-ochre-400 hover:text-ochre-800"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Workspace</span>
        </button>

        <button
          onClick={() => setActiveTab("join")}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === "join"
              ? "border-btpurple-600 text-btpurple-700"
              : "border-transparent text-ochre-400 hover:text-ochre-800"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Join Existing Workspace</span>
        </button>
      </div>

      {/* Card 1: Create Team */}
      {activeTab === "create" && (
        <div className="thickblue-surface rounded-2xl p-6 shadow-thickblue-surface space-y-5 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-ochre-950">Create a New Engineering Workspace</h3>
            <p className="text-xs text-ochre-700 mt-0.5">
              You will automatically become the <strong className="text-btpurple-700">ADMIN</strong> of this workspace and receive a unique shareable join code.
            </p>
          </div>

          {createError && (
            <div className="p-3 bg-red-50 border border-red-300 text-ladybug-600 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-ochre-800 mb-1">Workspace / Team Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Core Engineering, Mobile Frontend Team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-thickblue-200 rounded-xl text-ochre-950 focus:outline-none focus:border-btpurple-500 focus:ring-2 focus:ring-btpurple-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !teamName.trim()}
              className="w-full py-2.5 rounded-xl bg-btpurple-600 hover:bg-btpurple-700 text-white font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{isCreating ? "Creating Workspace..." : "Create Workspace & Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Card 2: Join Team */}
      {activeTab === "join" && (
        <div className="thickblue-surface rounded-2xl p-6 shadow-thickblue-surface space-y-5 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-ochre-950">Join an Existing Team</h3>
            <p className="text-xs text-ochre-700 mt-0.5">
              Enter the join code provided by your workspace admin and select your team role.
            </p>
          </div>

          {joinError && (
            <div className="p-3 bg-red-50 border border-red-300 text-ladybug-600 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{joinError}</span>
            </div>
          )}

          <form onSubmit={handleJoinTeam} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-ochre-800 mb-1">Workspace Join Code</label>
              <input
                type="text"
                required
                placeholder="e.g. BT-8X9K2L or DEMO-BUGTRAIL"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-thickblue-200 rounded-xl text-ochre-950 font-mono uppercase focus:outline-none focus:border-btpurple-500 focus:ring-2 focus:ring-btpurple-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-ochre-800 mb-1">Select Your Workspace Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-thickblue-200 rounded-xl text-ochre-950 focus:outline-none focus:border-btpurple-500 focus:ring-2 focus:ring-btpurple-500/20 font-medium"
              >
                <option value="DEVELOPER">DEVELOPER — State transitions, code patches, bug fixes</option>
                <option value="TRIAGER">TRIAGER — Priority/Severity triage & bug assignment</option>
                <option value="QA/TESTER">QA/TESTER — Bug reporting, resolution verification & testing</option>
                <option value="REPORTER">REPORTER — Defect filing & status watching</option>
              </select>
              <p className="text-[11px] text-ochre-400 mt-1 italic">
                Note: ADMIN role is reserved for workspace creators and cannot be selected when joining.
              </p>
            </div>

            <button
              type="submit"
              disabled={isJoining || !joinCode.trim()}
              className="w-full py-2.5 rounded-xl bg-btpurple-600 hover:bg-btpurple-700 text-white font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
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