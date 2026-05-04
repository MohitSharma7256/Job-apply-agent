"use client";

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Menu, Zap } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="grid lg:grid-cols-[288px_1fr] min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Sidebar - Desktop (Static) */}
      <div className="hidden lg:block h-screen sticky top-0 border-r border-white/10 bg-slate-950 overflow-hidden">
        <Sidebar isOpen={false} setIsOpen={() => {}} />
      </div>

      {/* Sidebar - Mobile (Overlay Drawer) */}
      <div className="lg:hidden">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>
      
      <div className="flex flex-col min-h-screen min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-white/10 bg-slate-950 flex items-center justify-between px-6 sticky top-0 z-[50]">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-500" />
            <span className="font-black text-white">Agent Pro</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
