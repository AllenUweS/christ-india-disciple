import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export const StatCard = ({ label, value, icon: Icon, trend, className }: Props) => (
  <div className={cn("glass rounded-2xl p-5 hover:divine-glow-soft transition-all group", className)}>
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      {trend && <span className="text-xs text-primary/80">{trend}</span>}
    </div>
    <div className="text-3xl font-serif gold-text mb-1">{value}</div>
    <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
  </div>
);
