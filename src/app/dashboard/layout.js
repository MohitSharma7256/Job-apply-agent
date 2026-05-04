"use client";

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Menu, Zap } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Desktop Sidebar - Always visible, pushes content */}
      <div className="hidden lg:block w-72 min-w-[288px] flex-shrink-0 border-r border-white/10 h-screen sticky top-0 bg-slate-950">
        <Sidebar isOpen={false} setIsOpen={() => {}} />
      </div>

      {/* Mobile Sidebar - Hidden by default, slides over content */}
      <div className="lg:hidden">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header - Only on small screens */}
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

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
