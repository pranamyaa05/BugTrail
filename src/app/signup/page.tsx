"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { Bug, ArrowRight, Lock, Mail, User, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { refreshAuth } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sign up failed.");
      }

      await refreshAuth();
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-btpurple-500 to-btpurple-700 text-white border border-btpurple-600 shadow-corp-card mb-2 relative">
          <Bug className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-ladybug-500 border-2 border-ochre-100 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-ochre-950 tracking-tight">Create BugTrail Account</h1>
        <p className="text-xs text-ochre-700">Sign up to manage defects and join workspaces</p>
      </div>

      <div className="thickblue-surface rounded-2xl p-6 shadow-thickblue-surface space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-300 text-ladybug-600 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-ochre-800 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-ochre-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-thickblue-200 rounded-xl text-ochre-950 focus:outline-none focus:border-btpurple-500 focus:ring-2 focus:ring-btpurple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ochre-800 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ochre-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="sarah@cyberdyne.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-thickblue-200 rounded-xl text-ochre-950 focus:outline-none focus:border-btpurple-500 focus:ring-2 focus:ring-btpurple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ochre-800 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ochre-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="•••••••• (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-thickblue-200 rounded-xl text-ochre-950 focus:outline-none focus:border-btpurple-500 focus:ring-2 focus:ring-btpurple-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-btpurple-600 hover:bg-btpurple-700 text-white font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>{isSubmitting ? "Creating Account..." : "Create Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-ochre-700">
        Already have an account?{" "}
        <Link href="/login" className="text-btpurple-700 font-bold hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  );
}