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
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-btpurple-500 to-btpurple-700 text-white border border-btpurple-600 shadow-corp-card mb-2 relative">
          <Bug className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-ladybug-500 border-2 border-ochre-100 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-ochre-950 tracking-tight">Sign In to BugTrail</h1>
        <p className="text-xs text-ochre-700">Access your engineering workspace and defect pipeline</p>
      </div>

      {/* Main Login Card */}
      <div className="thickblue-surface rounded-2xl p-6 shadow-thickblue-surface space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-300 text-ladybug-600 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-ochre-800 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ochre-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@company.com"
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
                placeholder="••••••••"
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
            <span>{isSubmitting ? "Signing In..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Ask about sign up below main login form */}
      <p className="text-center text-xs text-ochre-700">
        Don't have an account yet?{" "}
        <Link href="/signup" className="text-btpurple-700 font-bold hover:underline">
          Sign up here
        </Link>
      </p>

      {/* Demo Accounts section below both form and sign up link */}
      <div className="bg-ochre-100 border border-ochre-300 rounded-2xl p-4 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-ochre-800 font-bold text-[11px] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-btpurple-600" />
          <span>Evaluation Demo Accounts (Password: password123)</span>
        </div>
        <p className="text-[11px] text-ochre-700">
          Click any account to pre-fill credentials for testing:
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <button
            type="button"
            onClick={() => fillDemoAccount("alice.admin@bugtrail.org")}
            className="p-2 rounded-xl bg-white hover:bg-btpurple-50 text-ochre-900 text-left border border-ochre-300 font-semibold transition"
          >
            Alice (ADMIN)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("bob.triager@bugtrail.org")}
            className="p-2 rounded-xl bg-white hover:bg-btpurple-50 text-ochre-900 text-left border border-ochre-300 font-semibold transition"
          >
            Bob (TRIAGER)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("chaitanya.dev@bugtrail.org")}
            className="p-2 rounded-xl bg-white hover:bg-btpurple-50 text-ochre-900 text-left border border-ochre-300 font-semibold transition"
          >
            Chaitanya (DEV)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("community.reporter@external.io")}
            className="p-2 rounded-xl bg-white hover:bg-btpurple-50 text-ochre-900 text-left border border-ochre-300 font-semibold transition"
          >
            Reporter (REPORTER)
          </button>
        </div>
      </div>
    </div>
  );
}