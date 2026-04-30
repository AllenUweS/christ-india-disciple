import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, IndianRupee } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatPrice, levelLabel, type Level, type BillingType } from "@/lib/payments";

interface Plan {
  id: string;
  level: Level;
  price: number;
  currency: string;
  billing_type: BillingType;
  features: string[];
  is_active: boolean;
}

const LEVELS: Level[] = ["basic", "intermediate", "senior"];

export const AdminPricing = () => {
  const [plans, setPlans] = useState<Record<Level, Plan | null>>({
    basic: null,
    intermediate: null,
    senior: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Level | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("plan_pricing").select("*");
    const map: Record<Level, Plan | null> = { basic: null, intermediate: null, senior: null };
    (data ?? []).forEach((p: any) => {
      map[p.level as Level] = {
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      };
    });
    setPlans(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (lvl: Level, patch: Partial<Plan>) => {
    setPlans((p) => ({
      ...p,
      [lvl]: { ...(p[lvl] as Plan), ...patch },
    }));
  };

  const save = async (lvl: Level) => {
    const plan = plans[lvl];
    if (!plan) return;
    setSaving(lvl);
    const payload = {
      level: lvl,
      price: Number(plan.price),
      currency: plan.currency || "INR",
      billing_type: plan.billing_type,
      features: plan.features,
      is_active: plan.is_active,
    };
    const { error } = await supabase
      .from("plan_pricing")
      .upsert(payload, { onConflict: "level" });
    setSaving(null);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${levelLabel(lvl)} pricing updated.` });
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl gold-text mb-1">Pricing & Plans</h2>
        <p className="text-sm text-muted-foreground">Set the price, billing cycle, and features candidates see for each tier.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {LEVELS.map((lvl) => {
          const plan = plans[lvl];
          if (!plan) {
            return (
              <div key={lvl} className="glass rounded-2xl p-6">
                <div className="font-serif text-xl mb-2">{levelLabel(lvl)}</div>
                <Button variant="divine" size="sm" onClick={() => update(lvl, { id: "", level: lvl, price: 0, currency: "INR", billing_type: "one_time", features: [], is_active: true })}>
                  Create plan
                </Button>
              </div>
            );
          }
          const featuresText = plan.features.join("\n");
          return (
            <div key={lvl} className="glass-strong rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl gold-text">{levelLabel(lvl)}</h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${lvl}`} className="text-xs">Visible</Label>
                  <Switch
                    id={`active-${lvl}`}
                    checked={plan.is_active}
                    onCheckedChange={(v) => update(lvl, { is_active: v })}
                  />
                </div>
              </div>

              <div className="text-center py-2">
                <div className="font-serif text-3xl gold-text">
                  {formatPrice(Number(plan.price), plan.currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {plan.billing_type === "monthly" ? "per month" : "one-time"}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-widest">Price</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={plan.price}
                    onChange={(e) => update(lvl, { price: Number(e.target.value) })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-widest">Billing Type</Label>
                <Select value={plan.billing_type} onValueChange={(v) => update(lvl, { billing_type: v as BillingType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Subscription</SelectItem>
                    <SelectItem value="one_time">One-Time Purchase</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-widest">Currency</Label>
                <Input
                  value={plan.currency}
                  onChange={(e) => update(lvl, { currency: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-widest">Features (one per line)</Label>
                <Textarea
                  rows={5}
                  value={featuresText}
                  onChange={(e) =>
                    update(lvl, { features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })
                  }
                />
              </div>

              <Button variant="divine" className="w-full" onClick={() => save(lvl)} disabled={saving === lvl}>
                {saving === lvl ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save</>}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
