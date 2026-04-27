"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, CheckCircle2, AlertCircle, Clock, Trash2,
  Terminal, RefreshCw, Loader2, ExternalLink, Lock, Zap
} from "lucide-react";
import { cn } from "@/utils/helpers";

interface PlatformSession {
  platform: string;
  isValid: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const PLATFORMS = [
  { id: "naukri", name: "Naukri.com", icon: "📋", color: "from-blue-500 to-blue-700", loginUrl: "https://www.naukri.com/nlogin/login" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "from-sky-500 to-sky-700", loginUrl: "https://www.linkedin.com/login" },
  { id: "indeed", name: "Indeed", icon: "✅", color: "from-purple-500 to-purple-700", loginUrl: "https://secure.indeed.com/auth" },
  { id: "apna", name: "Apna", icon: "🚀", color: "from-orange-500 to-orange-700", loginUrl: "https://www.apna.co/login" },
  { id: "shine", name: "Shine.com", icon: "✨", color: "from-emerald-500 to-emerald-700", loginUrl: "https://www.shine.com/login" },
];

export default function SettingsPage() {
  const [sessions, setSessions] = useState<PlatformSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "instructions">("sessions");

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (data.success) setSessions(data.sessions || []);
    } catch (e) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const deleteSession = async (platform: string) => {
    setDeleting(platform);
    try {
      await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      setSessions(prev => prev.filter(s => s.platform !== platform));
    } finally {
      setDeleting(null);
    }
  };

  const getSessionStatus = (platform: string) => {
    const session = sessions.find(s => s.platform === platform);
    if (!session) return "not-connected";
    if (!session.isValid) return "expired";
    return "connected";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected": return (
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Connected
        </span>
      );
      case "expired": return (
        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
          <Clock className="w-3 h-3" /> Expired
        </span>
      );
      default: return (
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
          <AlertCircle className="w-3 h-3" /> Not Connected
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Platform Settings</h1>
              <p className="text-xs text-slate-500">Manage your platform sessions</p>
            </div>
          </div>
          <a href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            ← Back to Dashboard
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/5 pb-4">
          {(["sessions", "instructions"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize",
                activeTab === tab
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {tab === "sessions" ? "🔐 Platform Sessions" : "📖 How to Login"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "sessions" && (
            <motion.div key="sessions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Platform Connections</h2>
                  <p className="text-sm text-slate-400 mt-1">Login once locally → agent handles the rest automatically</p>
                </div>
                <button onClick={loadSessions} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {PLATFORMS.map(platform => {
                    const status = getSessionStatus(platform.id);
                    const session = sessions.find(s => s.platform === platform.id);
                    return (
                      <motion.div
                        key={platform.id}
                        layout
                        className="flex items-center gap-6 p-6 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all"
                      >
                        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-2xl shadow-lg`}>
                          {platform.icon}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-white text-lg">{platform.name}</h3>
                            {getStatusBadge(status)}
                          </div>
                          {session && (
                            <p className="text-xs text-slate-500">
                              {status === "connected" && session.expiresAt
                                ? `Expires: ${new Date(session.expiresAt).toLocaleDateString()}`
                                : "Session expired — please login again"}
                            </p>
                          )}
                          {!session && (
                            <p className="text-xs text-slate-600">Run the login script to connect this platform</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <a
                            href={platform.loginUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open Platform
                          </a>
                          {session && (
                            <button
                              onClick={() => deleteSession(platform.id)}
                              disabled={deleting === platform.id}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              {deleting === platform.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "instructions" && (
            <motion.div key="instructions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white text-lg">One-Time Login Setup</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Login ek baar karo apne computer pe. Agent baaki sab handle kar lega.
                  Sessions encrypted hokar Supabase mein save honge aur automatically reuse honge.
                </p>

                <div className="space-y-4">
                  {["Step 1: Install Dependencies", "Step 2: Run Login Script", "Step 3: Agent Auto-Uses Session"].map((step, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
                      <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white mb-2">{step}</p>
                        {i === 0 && (
                          <div className="bg-black/40 rounded-lg p-3 font-mono text-sm text-emerald-400">
                            npm install playwright<br />
                            npx playwright install chromium
                          </div>
                        )}
                        {i === 1 && (
                          <div className="space-y-2">
                            {PLATFORMS.map(p => (
                              <div key={p.id} className="bg-black/40 rounded-lg p-3 font-mono text-sm text-emerald-400 flex items-center gap-2">
                                <Terminal className="w-4 h-4 flex-shrink-0" />
                                npx ts-node src/scripts/login.ts {p.id}
                              </div>
                            ))}
                          </div>
                        )}
                        {i === 2 && (
                          <p className="text-slate-400 text-sm">
                            Session Supabase mein save ho jayega. Dashboard par search karo — 
                            agent automatically logged-in session use karega bina dobara login ke.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
