"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { Bug, ArrowRight, Lock, Mail, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { refreshAuth } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      await refreshAuth();
      if (data.hasTeam) {
        router.push("/");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      {/* Top Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 mb-2">
          <Bug className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Sign In to BugTrail</h1>
        <p className="text-xs text-slate-500">Access your engineering workspace and defect pipeline</p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>{isSubmitting ? "Signing In..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Ask about sign up below main login form */}
      <p className="text-center text-xs text-slate-500">
        Don't have an account yet?{" "}
        <Link href="/signup" className="text-violet-600 font-semibold hover:underline">
          Sign up here
        </Link>
      </p>

      {/* Demo Accounts section below both form and sign up link */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          <span>Evaluation Demo Accounts (Password: password123)</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Click any account to pre-fill credentials for testing:
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <button
            type="button"
            onClick={() => fillDemoAccount("alice.admin@bugtrail.org")}
            className="p-2 rounded bg-white hover:bg-violet-50 text-slate-700 text-left border border-slate-200 font-medium transition"
          >
            Alice (ADMIN)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("bob.triager@bugtrail.org")}
            className="p-2 rounded bg-white hover:bg-violet-50 text-slate-700 text-left border border-slate-200 font-medium transition"
          >
            Bob (TRIAGER)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("chaitanya.dev@bugtrail.org")}
            className="p-2 rounded bg-white hover:bg-violet-50 text-slate-700 text-left border border-slate-200 font-medium transition"
          >
            Chaitanya (DEV)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("community.reporter@external.io")}
            className="p-2 rounded bg-white hover:bg-violet-50 text-slate-700 text-left border border-slate-200 font-medium transition"
          >
            Reporter (REPORTER)
          </button>
        </div>
      </div>
    </div>
  );
}