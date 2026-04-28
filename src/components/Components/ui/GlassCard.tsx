import React from 'react';
import { cn } from '@/utils/helpers';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden transition-all duration-300",
        onClick && "hover:bg-white/[0.05] cursor-pointer hover:border-white/20 active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  );
};
