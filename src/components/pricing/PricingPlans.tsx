import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, levelLabel, type Level, type BillingType } from "@/lib/payments";
import { CheckoutModal } from "./CheckoutModal";

export interface PlanRow {
  id: string;
  level: Level;
  price: number;
  currency: string;
  billing_type: BillingType;
  features: string[];
  is_active: boolean;
}

interface Props {
  /** When true, "Purchase" routes anonymous users to /auth. When false, opens checkout directly. */
  publicMode?: boolean;
  /** Levels currently active for the candidate; used to badge "Active". */
  activeLevels?: Level[];
  /** Called after a successful purchase so parents can refresh state. */
  onPurchased?: () => void;
}

const tagline: Record<Level, string> = {
  basic: "The first step on the path",
  intermediate: "Walking deeper in truth",
  senior: "Anointed for ministry",
};

export const PricingPlans = ({ publicMode = false, activeLevels = [], onPurchased }: Props) => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanRow | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("plan_pricing")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      const rows: PlanRow[] = (data ?? []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      }));
      setPlans(rows);
      setLoading(false);
    })();
  }, []);

  const handlePurchase = (plan: PlanRow) => {
    if (publicMode && !user) {
      nav("/auth");
      return;
    }
    setCheckoutPlan(plan);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((p, i) => {
          const featured = p.level === "intermediate";
          const isActive = activeLevels.includes(p.level);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 flex flex-col ${
                featured
                  ? "glass-strong gold-border divine-glow scale-[1.02] md:scale-105"
                  : "glass divine-glow-soft"
              }`}
            >
              {featured && !isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-gold text-primary-foreground text-[10px] tracking-[0.2em] uppercase font-semibold px-4 py-1 rounded-full">
                  Most Chosen
                </div>
              )}
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] tracking-[0.2em] uppercase font-semibold px-4 py-1 rounded-full">
                  ✓ Active
                </div>
              )}
              <h3 className="font-serif text-3xl mb-1">{levelLabel(p.level)}</h3>
              <p className="text-sm text-muted-foreground italic mb-6">{tagline[p.level]}</p>
              <div className="mb-1 flex items-baseline gap-2">
                <span className="font-serif text-5xl gold-text font-medium">
                  {formatPrice(p.price, p.currency)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-8">
                {p.price === 0
                  ? "Always free"
                  : p.billing_type === "monthly"
                  ? "per month • renews automatically"
                  : "one-time • lifetime access"}
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </span>
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={featured ? "divine" : "glass"}
                size="lg"
                className="w-full"
                disabled={isActive}
                onClick={() => handlePurchase(p)}
              >
                {isActive
                  ? "Currently Active"
                  : p.price === 0
                  ? "Start Free"
                  : "Purchase Plan"}
              </Button>
            </motion.div>
          );
        })}
      </div>

      <CheckoutModal
        plan={checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
        onSuccess={() => {
          setCheckoutPlan(null);
          onPurchased?.();
        }}
      />
    </>
  );
};
