import React from 'react';
import { cn } from '../../utils/helpers';

export function GlassCard({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
