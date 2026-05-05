"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, clearAuthToken } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, User, FileText, Briefcase,
  BarChart3, Settings, LogOut, Zap,
  History, Menu, X, Search, Bell, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  const router = useRouter();

  const handleLogout = () => {
    clearAuthToken();
    router.push('/login');
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed md:sticky top-0 left-0 h-screen flex flex-col z-50 transition-transform duration-300 ease-in-out w-72",
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Sidebar background */}
        <div className="absolute inset-0 bg-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">Job Agent</h2>
                <p className="text-[10px] text-slate-500 font-medium">AI Career Pilot</p>
              </div>
            </div>
            <button className="md:hidden p-2 text-slate-400" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 text-sm">
              <Search className="w-4 h-4" />
              <span className="flex-1">Search...</span>
              <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded">⌘K</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Menu</p>
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm",
                    isActive
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-slate-500")} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="px-3 py-3 border-t border-white/5">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">User</p>
                <p className="text-xs text-slate-500 truncate">user@email.com</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>

            <div className="mt-2 space-y-0.5">
              <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-all text-sm">
                <Settings className="w-4 h-4" />
                <span className="font-medium">Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all w-full text-left text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
