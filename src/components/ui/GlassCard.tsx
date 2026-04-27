import React from 'react';
import { cn } from '@/utils/helpers';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  gradient = false,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/20",
        gradient && "bg-gradient-to-br from-white/10 to-transparent",
        className
      )}
      {...props}
    >
      {/* Subtle Inner Glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
