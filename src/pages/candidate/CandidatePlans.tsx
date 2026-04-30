import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { formatPrice, levelLabel } from "@/lib/payments";
import { CheckCircle2, Calendar, CreditCard, Lock } from "lucide-react";

export const CandidatePlans = () => {
  const { activeSubs, loading } = usePlanAccess();
  const [reload, setReload] = useState(0);

  // Force a refetch when a purchase happens
  const { user } = useAuth();
  const [subs, setSubs] = useState(activeSubs);
  useEffect(() => { setSubs(activeSubs); }, [activeSubs]);
  useEffect(() => {
    if (!user || reload === 0) return;
    (async () => {
      const { data } = await supabase
        .from("candidate_subscriptions")
        .select("id, level, billing_type, price_paid, currency, status, starts_at, expires_at")
        .eq("candidate_id", user.id);
      const active = (data ?? []).filter((s: any) => s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date()));
      setSubs(active as any);
    })();
  }, [reload, user]);

  const activeLevels = subs.map((s) => s.level as "basic" | "intermediate" | "senior");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl gold-text mb-1">Plans & Subscriptions</h2>
        <p className="text-sm text-muted-foreground">Purchase a plan to unlock the lessons and tests for that tier.</p>
      </div>

      {/* Current status */}
      {loading ? null : subs.length === 0 ? (
        <div className="glass-strong rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="font-serif text-xl">No active plan</div>
            <div className="text-sm text-muted-foreground">Choose a tier below to begin your journey.</div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subs.map((s) => (
            <div key={s.id} className="glass-strong rounded-2xl p-5 divine-glow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
                <span className="text-xs text-muted-foreground capitalize">{s.billing_type.replace("_", " ")}</span>
              </div>
              <div className="font-serif text-2xl gold-text mb-1">{levelLabel(s.level as any)}</div>
              <div className="text-sm text-muted-foreground mb-3">{formatPrice(Number(s.price_paid), s.currency)} paid</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {s.expires_at ? `Renews / Expires ${new Date(s.expires_at).toLocaleDateString()}` : "Lifetime access"}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="hairline" />

      <PricingPlans
        activeLevels={activeLevels}
        onPurchased={() => setReload((r) => r + 1)}
      />
    </div>
  );
};
