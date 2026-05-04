"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, User, FileText,
  BarChart3, Settings, LogOut, Zap,
  ChevronRight, Sparkles, Layers, Table, History, Menu, X as CloseIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { phasedFeatures, phasedFeaturesIntro } from '@/config/phasedFeatures';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'profile', label: 'Profile', icon: User, href: '/dashboard/profile' },
  { id: 'resume', label: 'Resume', icon: FileText, href: '/dashboard/resume' },
  { id: 'apply-log', label: 'Apply log', icon: Table, href: '/dashboard/applications' },
  { id: 'activity', label: 'Activity', icon: History, href: '/dashboard/history' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 w-72 h-screen bg-slate-950 border-r border-white/10 flex flex-col p-6 z-[60] transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-6 right-6 p-2 text-slate-400 hover:text-white"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      {/* Brand */}
      <div className="flex items-center gap-3 mb-6 px-2 shrink-0">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Zap className="h-6 w-6 text-white fill-current" />
        </div>
        <div>
          <h2 className="font-black text-xl tracking-tight text-white">Agent Pro</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Career Pilot</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 shrink-0 mb-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center justify-between p-3 rounded-2xl transition-all duration-300 group",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-blue-400")} />
                <span className="font-bold text-sm">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      {/* Phased features (docs-aligned); scrollable */}
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden mb-4">
        <div className="shrink-0 px-4 py-3 border-b border-white/10 flex items-start gap-2">
          <Layers className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-blue-400">Phased features</p>
            <p className="text-[10px] text-slate-500 leading-snug mt-1">{phasedFeaturesIntro}</p>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto py-3 px-3 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,.12)_transparent]">
          {phasedFeatures.map((phase) => (
            <div key={phase.id}>
              <p className="text-[11px] font-bold text-white leading-tight">{phase.labelEn}</p>
              <p className="text-[10px] text-slate-500 mb-1.5">{phase.labelHi}</p>
              <ul className="space-y-1 pl-0 list-none border-l border-white/10 ml-1">
                {phase.items.map((line) => (
                  <li
                    key={line}
                    className="text-[11px] text-slate-400 leading-snug pl-3 border-l border-transparent hover:border-blue-500/40 hover:text-slate-300 transition-colors"
                  >
                    <span className="text-blue-400/70 mr-1 select-none">·</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Badge */}
      <div className="mb-6 p-4 rounded-3xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 relative overflow-hidden group cursor-pointer shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-tighter text-blue-400">Pro Features</span>
          </div>
          <p className="text-xs text-slate-400 leading-tight">Unlock AI resume tailoring & Glassdoor automation.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-white/5 space-y-4">
        <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all w-full text-left">
          <Settings className="w-5 h-5" />
          <span className="font-bold text-sm">Settings</span>
        </Link>
        <button className="flex items-center gap-3 p-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all w-full text-left">
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm">Sign Out</span>
        </button>
      </div>
      </div>
    </aside>
    </>
  );
}
