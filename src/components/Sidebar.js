"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, User, FileText, Briefcase, 
  BarChart3, Settings, LogOut, Zap, 
  ChevronRight, Sparkles, History, Menu, X
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'profile', label: 'Profile', icon: User, href: '/dashboard/profile' },
  { id: 'resume', label: 'Resume', icon: FileText, href: '/dashboard/resume' },
  { id: 'applications', label: 'Applications', icon: Briefcase, href: '/dashboard/history' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen bg-slate-950 border-r border-white/10 flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        w-64 lg:w-72
      `}>
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 lg:mb-12 px-6 pt-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="h-6 w-6 text-white fill-current" />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tight text-white">Agent Pro</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Career Pilot</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.id}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center justify-between p-3 rounded-2xl transition-all duration-300 group
                  ${isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "group-hover:text-blue-400"}`} />
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Pro Badge */}
        <div className="mb-8 mx-6 p-4 rounded-3xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 relative overflow-hidden group cursor-pointer">
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
        <div className="pt-6 border-t border-white/5 space-y-4 px-6 pb-6">
          <button className="flex items-center gap-3 p-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all w-full text-left">
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm">Settings</span>
          </button>
          <button className="flex items-center gap-3 p-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all w-full text-left">
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
