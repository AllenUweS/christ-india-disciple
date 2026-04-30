import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { levelLabel, type Level } from "@/lib/payments";

interface Props {
  level?: Level;
  message?: string;
  compact?: boolean;
}

export const PlanLocked = ({ level, message, compact }: Props) => {
  if (compact) {
    return (
      <div className="glass rounded-2xl p-6 text-center border border-amber-500/20">
        <Lock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <p className="text-sm font-medium mb-1">Upgrade or renew your plan to access this content</p>
        <p className="text-xs text-muted-foreground mb-4">
          {level ? `${levelLabel(level)} tier required` : "Active plan required"}
        </p>
        <Button asChild variant="divine" size="sm">
          <Link to="/candidate/plans"><Sparkles className="w-3.5 h-3.5" /> View Plans</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="glass-strong rounded-3xl p-10 md:p-14 text-center max-w-2xl mx-auto divine-glow-soft">
      <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
        <Lock className="w-10 h-10 text-primary" />
      </div>
      <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3">Locked</p>
      <h2 className="font-serif text-3xl md:text-4xl mb-3">
        {level ? `Unlock the ${levelLabel(level)} tier` : "Upgrade or renew your plan to access this content"}
      </h2>
      <p className="text-muted-foreground mb-8">
        {message ??
          (level
            ? `You don't have an active ${levelLabel(level)} plan. Purchase or renew to unlock its courses, lessons, and tests.`
            : "Your plan has expired or is missing. Renew to continue your journey.")}
      </p>
      <Button asChild variant="divine" size="lg">
        <Link to="/candidate/plans">
          <Sparkles className="w-4 h-4" /> View Plans
        </Link>
      </Button>
    </div>
  );
};
