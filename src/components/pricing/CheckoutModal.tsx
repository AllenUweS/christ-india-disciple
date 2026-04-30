import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Sparkles, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { processPayment, formatPrice, levelLabel } from "@/lib/payments";
import type { PlanRow } from "./PricingPlans";

interface Props {
  plan: PlanRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal = ({ plan, onClose, onSuccess }: Props) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  if (!plan) return null;

  const handlePay = async () => {
    if (!user) return;
    setProcessing(true);
    const result = await processPayment({
      candidateId: user.id,
      level: plan.level,
      billingType: plan.billing_type,
      price: Number(plan.price),
      currency: plan.currency,
    });
    setProcessing(false);

    if (result.status === "success") {
      setDone(true);
      toast({ title: "Payment successful ✨", description: `Your ${levelLabel(plan.level)} plan is now active.` });
      setTimeout(() => {
        setDone(false);
        onSuccess();
      }, 1400);
    } else {
      toast({ title: "Payment failed", description: result.error ?? "Please try again.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={!!plan} onOpenChange={(o) => !o && !processing && onClose()}>
      <DialogContent className="glass-strong border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl gold-text">Checkout</DialogTitle>
          <DialogDescription>Review your order and complete the mock payment.</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="font-serif text-xl mb-1">Payment Complete</p>
            <p className="text-sm text-muted-foreground">Unlocking your content…</p>
          </div>
        ) : (
          <>
            <div className="glass rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs uppercase tracking-widest text-primary">Plan</div>
                  <div className="font-serif text-xl">{levelLabel(plan.level)}</div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-2xl gold-text">{formatPrice(Number(plan.price), plan.currency)}</div>
                  <div className="text-xs text-muted-foreground">
                    {plan.billing_type === "monthly" ? "per month" : "one-time"}
                  </div>
                </div>
              </div>
              <div className="hairline" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{plan.billing_type.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Validity</span>
                <span>{plan.billing_type === "monthly" ? "30 days" : "Lifetime"}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Total</span>
                <span className="gold-text">{formatPrice(Number(plan.price), plan.currency)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground glass rounded-lg p-3">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>This is a demo checkout. No real card is charged. Click "Complete Payment" to simulate a successful purchase.</span>
            </div>

            <div className="flex gap-2">
              <Button variant="glass" className="flex-1" onClick={onClose} disabled={processing}>Cancel</Button>
              <Button variant="divine" className="flex-1" onClick={handlePay} disabled={processing}>
                {processing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Complete Payment</>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
