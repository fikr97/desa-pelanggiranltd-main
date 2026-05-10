import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

const colorMap = {
  blue:   { grad: 'from-blue-500 to-indigo-600',       text: 'text-blue-600',    bg: 'bg-blue-500/10',    ring: 'shadow-blue-500/20' },
  green:  { grad: 'from-emerald-500 to-teal-600',      text: 'text-emerald-600', bg: 'bg-emerald-500/10', ring: 'shadow-emerald-500/20' },
  yellow: { grad: 'from-amber-500 to-orange-600',      text: 'text-amber-600',   bg: 'bg-amber-500/10',   ring: 'shadow-amber-500/20' },
  red:    { grad: 'from-rose-500 to-pink-600',         text: 'text-rose-600',    bg: 'bg-rose-500/10',    ring: 'shadow-rose-500/20' },
  purple: { grad: 'from-fuchsia-500 to-purple-600',    text: 'text-fuchsia-600', bg: 'bg-fuchsia-500/10', ring: 'shadow-fuchsia-500/20' },
  cyan:   { grad: 'from-cyan-500 to-sky-600',          text: 'text-cyan-600',    bg: 'bg-cyan-500/10',    ring: 'shadow-cyan-500/20' },
};

const StatCard = ({ title, value, icon: Icon, color = 'blue', trend, subtitle }: StatCardProps) => {
  const c = colorMap[color];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
      {/* Decorative gradient blob */}
      <div className={cn("absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-br", c.grad)} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
          <p className="font-display font-bold text-3xl md:text-4xl mt-2 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 mt-3 text-xs font-semibold px-2 py-0.5 rounded-full",
              trend.isPositive
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
            )}>
              {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.isPositive ? '+' : ''}{trend.value}% bulan ini
            </div>
          )}
        </div>
        <div className={cn(
          "h-14 w-14 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500",
          c.grad, c.ring
        )}>
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
