import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Sparkles, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { Button } from "@/components/ui/button";

const LEVELS: Array<{ key: "basic" | "intermediate" | "senior"; title: string; desc: string; glow?: boolean }> = [
  { key: "basic", title: "Basic", desc: "Foundation of faith. Open to all who begin the journey.", glow: true },
  { key: "intermediate", title: "Intermediate", desc: "Deepen your understanding." },
  { key: "senior", title: "Senior", desc: "The sacred summit. Mastery of the divine path." },
];

export const CandidateLevels = () => {
  const { user } = useAuth();
  const { hasLevel, hasAnyActive, activeOverrides, loading } = usePlanAccess();
  const [progressUnlocked, setProgressUnlocked] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("candidate_levels").select("level").eq("candidate_id", user.id).eq("unlocked", true);
      setProgressUnlocked(data?.map((d) => d.level) ?? []);
    })();
  }, [user]);

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground max-w-2xl">
        Three sacred tiers stand before you. Purchase a plan to unlock its content.
      </p>

      {!loading && !hasAnyActive && (
        <div className="glass-strong rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4 divine-glow-soft">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="font-serif text-xl mb-1">Upgrade or renew your plan to access this content</div>
            <div className="text-sm text-muted-foreground">All content is locked until you have an active plan.</div>
          </div>
          <Button asChild variant="divine"><Link to="/candidate/plans"><Sparkles className="w-4 h-4" /> View Plans</Link></Button>
        </div>
      )}

      {activeOverrides.length > 0 && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-primary/30">
          <KeyRound className="w-5 h-5 text-primary shrink-0" />
          <div className="text-sm">
            <span className="font-medium">Free access granted by admin:</span>{" "}
            <span className="text-muted-foreground">
              {activeOverrides.length} active grant{activeOverrides.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {LEVELS.map((l, i) => {
          const accessible = hasLevel(l.key);
          const progressed = progressUnlocked.includes(l.key);
          return (
            <div
              key={l.key}
              className={cn(
                "glass-strong rounded-2xl p-6 relative overflow-hidden transition-all",
                accessible ? "hover:divine-glow-soft" : "",
              )}
            >
              {l.glow && <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/15 blur-3xl" />}
              <div className={cn("relative", !accessible && "opacity-60 blur-[1px] pointer-events-none select-none")}>
                <div className="text-xs uppercase tracking-widest text-primary mb-2">Tier {i + 1}</div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-serif text-2xl gold-text">{l.title}</h3>
                  {accessible ? (
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-6">{l.desc}</p>
                {accessible ? (
                  <Link to={`/candidate/learn/${l.key}`} className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all">
                    Enter <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">Locked</span>
                )}
                {progressed && !accessible && (
                  <div className="text-[10px] mt-3 text-muted-foreground italic">Purchase a plan to access this content.</div>
                )}
              </div>

              {!accessible && (
                <div className="absolute inset-0 flex items-end p-6 z-10">
                  <Link
                    to="/candidate/plans"
                    className="w-full glass-strong rounded-xl p-3 text-center text-sm font-medium hover:divine-glow-soft transition-all"
                  >
                    <Sparkles className="w-4 h-4 inline mr-1.5 text-primary" />
                    Upgrade or renew your plan to access this content
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
