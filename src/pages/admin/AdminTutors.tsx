import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus, Loader2 } from "lucide-react";

interface Row {
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

export const AdminTutors = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });

  const load = async () => {
    const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "tutor");
    const ids = roleRows?.map((r) => r.user_id) ?? [];
    if (ids.length === 0) return setRows([]);
    const { data } = await supabase.from("profiles").select("*").in("user_id", ids).order("created_at", { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.full_name || !form.email || form.password.length < 6) {
      toast({ title: "Fill all fields (password ≥ 6 chars)", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("create-tutor", {
      body: { email: form.email, password: form.password, full_name: form.full_name },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast({ title: "Failed", description: error?.message ?? (data as any)?.error, variant: "destructive" });
      return;
    }
    toast({ title: "Tutor created ✨", description: `${form.email} can now sign in.` });
    setOpen(false);
    setForm({ full_name: "", email: "", password: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove tutor role and profile?")) return;
    await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "tutor");
    await supabase.from("profiles").delete().eq("user_id", id);
    toast({ title: "Removed" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{rows.length} tutor(s) shepherding the flock.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="divine"><Plus className="w-4 h-4" /> Add Tutor</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle className="font-serif gold-text">Anoint a New Tutor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="glass mt-1.5" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="glass mt-1.5" />
              </div>
              <div>
                <Label>Temporary Password</Label>
                <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="glass mt-1.5" />
                <p className="text-xs text-muted-foreground mt-1">Share this with the tutor. They can change it later.</p>
              </div>
              <Button variant="divine" onClick={create} disabled={busy} className="w-full">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Tutor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-strong rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No tutors yet.</TableCell></TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.user_id} className="border-border/40">
                  <TableCell className="font-medium">{r.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.email}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => remove(r.user_id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
