import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, X, Check, RefreshCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatPrice, isSubscriptionActive, levelLabel } from "@/lib/payments";
import { useAuth } from "@/hooks/useAuth";

interface Row {
  id: string;
  candidate_id: string;
  level: string;
  billing_type: "monthly" | "one_time";
  price_paid: number;
  currency: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  payment_reference: string | null;
  candidate?: { full_name: string | null; email: string | null };
}

export const AdminSubscriptions = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data: subs } = await supabase
      .from("candidate_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    const ids = Array.from(new Set((subs ?? []).map((s) => s.candidate_id)));
    let profilesById = new Map<string, { full_name: string | null; email: string | null }>();
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", ids);
      profilesById = new Map((profiles ?? []).map((p: any) => [p.user_id, { full_name: p.full_name, email: p.email }]));
    }

    const merged: Row[] = (subs ?? []).map((s: any) => ({
      ...s,
      candidate: profilesById.get(s.candidate_id),
    }));
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: "active" | "cancelled") => {
    const { error } = await supabase
      .from("candidate_subscriptions")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "active" ? "Plan activated" : "Plan deactivated" });
      load();
    }
  };

  const grantManual = async (candidateId: string, level: "basic" | "intermediate" | "senior", billing: "monthly" | "one_time") => {
    if (!user) return;
    const startsAt = new Date();
    const expiresAt = billing === "monthly" ? new Date(startsAt.getTime() + 30 * 24 * 3600 * 1000) : null;
    const { error } = await supabase.from("candidate_subscriptions").insert({
      candidate_id: candidateId,
      level,
      billing_type: billing,
      price_paid: 0,
      currency: "INR",
      status: "active",
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      payment_reference: `ADMIN-${Date.now()}`,
      notes: `Manually granted by admin ${user.id}`,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Plan granted manually" }); load(); }
  };

  const filtered = rows.filter((r) => {
    if (levelFilter !== "all" && r.level !== levelFilter) return false;
    if (statusFilter === "active" && !isSubscriptionActive(r)) return false;
    if (statusFilter === "expired" && isSubscriptionActive(r)) return false;
    if (statusFilter === "cancelled" && r.status !== "cancelled") return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.candidate?.full_name?.toLowerCase().includes(q) ||
      r.candidate?.email?.toLowerCase().includes(q) ||
      r.payment_reference?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl gold-text mb-1">Subscriptions</h2>
          <p className="text-sm text-muted-foreground">All candidate purchases — monitor activity, expiry, and grant access manually.</p>
        </div>
        <Button variant="glass" size="sm" onClick={load}><RefreshCcw className="w-4 h-4" /> Refresh</Button>
      </div>

      <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or reference…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">No subscriptions found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const active = isSubscriptionActive(r);
            const realStatus = r.status === "cancelled" ? "cancelled" : active ? "active" : "expired";
            const statusColor =
              realStatus === "active" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
              : realStatus === "expired" ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
              : "bg-rose-500/15 text-rose-500 border-rose-500/30";
            return (
              <div key={r.id} className="glass-strong rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-3">
                  <div className="font-medium">{r.candidate?.full_name || "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{r.candidate?.email}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">Level</div>
                  <div className="font-serif gold-text">{levelLabel(r.level as any)}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">Type</div>
                  <div className="capitalize text-sm">{r.billing_type.replace("_", " ")}</div>
                </div>
                <div className="md:col-span-1">
                  <div className="text-xs text-muted-foreground">Paid</div>
                  <div className="text-sm">{formatPrice(Number(r.price_paid), r.currency)}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">Expires</div>
                  <div className="text-sm">
                    {r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "Lifetime"}
                  </div>
                </div>
                <div className="md:col-span-1">
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${statusColor}`}>{realStatus}</span>
                </div>
                <div className="md:col-span-1 flex gap-1 justify-end">
                  {realStatus !== "active" ? (
                    <Button size="icon" variant="ghost" onClick={() => setStatus(r.id, "active")} title="Activate">
                      <Check className="w-4 h-4 text-emerald-500" />
                    </Button>
                  ) : (
                    <Button size="icon" variant="ghost" onClick={() => setStatus(r.id, "cancelled")} title="Cancel">
                      <X className="w-4 h-4 text-rose-500" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
