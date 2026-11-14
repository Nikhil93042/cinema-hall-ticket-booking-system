"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Film, Lock, Mail, AlertCircle, RefreshCw, Shield, User } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      // Check role; if admin and no explicit returnUrl, route to /admin
      if (data.user.role === "ADMIN" && returnUrl === "/") {
        router.push("/admin");
      } else {
        router.push(returnUrl);
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type: "admin" | "customer") => {
    if (type === "admin") {
      setEmail("admin@cinemahall.com");
      setPassword("Admin@123");
    } else {
      setEmail("customer@cinemahall.com");
      setPassword("Customer@123");
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 mb-2">
          <Film className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
        <p className="text-xs text-slate-400">
          Sign in to access your cinema bookings, seats, and tickets.
        </p>
      </div>

      {/* Demo Fast-Login Pills for Assessment */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-purple-400 text-center">
          Demo Credentials (1-Click Fill)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillCredentials("customer")}
            className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 p-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span>Customer Demo</span>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials("admin")}
            className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 p-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin Demo</span>
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
        {errorMsg && (
          <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 flex items-center gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-purple-400 font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <Suspense fallback={<div className="text-slate-400 text-xs">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
