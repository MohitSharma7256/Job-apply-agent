"use client";

import { useState } from "react";
import { Settings, Shield, Globe, Bell, Key, Save, Loader2, Link2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", connected: true, lastSync: "2 hours ago" },
  { id: "naukri", name: "Naukri.com", connected: true, lastSync: "1 day ago" },
  { id: "indeed", name: "Indeed", connected: false, lastSync: null },
  { id: "glassdoor", name: "Glassdoor", connected: false, lastSync: null },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    autoReferral: true,
    sessionPersistence: true,
    emailNotifications: true,
    browserAutomation: "headless",
  });

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Settings saved successfully!");
    }, 1500);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-white">Settings</h1>
        <p className="text-slate-500 mt-2">Configure your AI agent and manage platform connections.</p>
      </header>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          {/* Platform Connections */}
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
              <Link2 className="w-5 h-5 text-blue-400" /> Platform Connections
            </h2>
            <div className="space-y-4">
              {PLATFORMS.map(p => (
                <div key={p.id} className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center border transition-all",
                      p.connected ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/10 text-slate-500"
                    )}>
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{p.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {p.connected ? `Connected • ${p.lastSync}` : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <button className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    p.connected ? "bg-white/10 text-white hover:bg-white/20" : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                  )}>
                    {p.connected ? "Re-sync" : "Connect Now"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Automation Config */}
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-400" /> Automation Config
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                <div>
                  <h3 className="font-bold text-white">Auto-Referral Hunting</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Automatically find and reach out to recruiters on LinkedIn.</p>
                </div>
                <button 
                  onClick={() => setConfig({...config, autoReferral: !config.autoReferral})}
                  className={cn("w-12 h-6 rounded-full transition-all relative", config.autoReferral ? "bg-blue-600" : "bg-slate-700")}
                >
                  <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", config.autoReferral ? "left-7" : "left-1")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                <div>
                  <h3 className="font-bold text-white">Session Persistence</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Keep browser sessions active to bypass platform login checks.</p>
                </div>
                <button 
                  onClick={() => setConfig({...config, sessionPersistence: !config.sessionPersistence})}
                  className={cn("w-12 h-6 rounded-full transition-all relative", config.sessionPersistence ? "bg-blue-600" : "bg-slate-700")}
                >
                  <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", config.sessionPersistence ? "left-7" : "left-1")} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Key className="w-5 h-5 text-orange-400" /> Security
            </h2>
            <div className="space-y-4">
              <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-sm transition-all flex items-center justify-center gap-2">
                Update Password
              </button>
              <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-sm transition-all flex items-center justify-center gap-2">
                Manage API Keys
              </button>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black text-white shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
