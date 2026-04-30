import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Search, Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface Row {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  level?: string;
  tutor_id?: string | null;
}

interface Tutor {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

export const AdminCandidates = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "candidate");
    const ids = roleRows?.map((r) => r.user_id) ?? [];

    // Load tutors for assignment dropdown
    const { data: tutorRoleRows } = await supabase.from("user_roles").select("user_id").eq("role", "tutor");
    const tIds = tutorRoleRows?.map((r) => r.user_id) ?? [];
    if (tIds.length > 0) {
      const { data: tProfs } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", tIds);
      setTutors(tProfs ?? []);
    } else {
      setTutors([]);
    }

    if (ids.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").in("user_id", ids).order("created_at", { ascending: false });
    const { data: levels } = await supabase.from("candidate_levels").select("candidate_id, level, unlocked").in("candidate_id", ids).eq("unlocked", true);
    const { data: assigns } = await supabase.from("tutor_assignments").select("candidate_id, tutor_id").in("candidate_id", ids);
    const map: Record<string, string[]> = {};
    levels?.forEach((l) => {
      map[l.candidate_id] = [...(map[l.candidate_id] ?? []), l.level];
    });
    const aMap: Record<string, string> = {};
    assigns?.forEach((a) => { aMap[a.candidate_id] = a.tutor_id; });
    setRows(
      (data ?? []).map((r) => ({
        ...r,
        level: (map[r.user_id] ?? ["basic"]).slice(-1)[0],
        tutor_id: aMap[r.user_id] ?? null,
      })),
    );
    setLoading(false);
  };

  const assignTutor = async (candidateId: string, tutorId: string | null) => {
    if (!tutorId) {
      const { error } = await supabase.from("tutor_assignments").delete().eq("candidate_id", candidateId);
      if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
      else { toast({ title: "Tutor unassigned" }); load(); }
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("tutor_assignments")
      .upsert(
        { candidate_id: candidateId, tutor_id: tutorId, assigned_by: user?.id },
        { onConflict: "candidate_id" },
      );
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Tutor assigned ✨" }); load(); }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editing.full_name, phone: editing.phone })
      .eq("user_id", editing.user_id);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Updated" });
      setEditing(null);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this candidate? This removes their profile only.")) return;
    const { error } = await supabase.from("profiles").delete().eq("user_id", id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Removed" });
      load();
    }
  };

  const setLevel = async (cid: string, level: "basic" | "intermediate" | "senior") => {
    const { error } = await supabase
      .from("candidate_levels")
      .upsert({ candidate_id: cid, level, unlocked: true, unlocked_at: new Date().toISOString() }, { onConflict: "candidate_id,level" });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: `Unlocked ${level}` });
      load();
    }
  };

  const filtered = rows.filter(
    (r) =>
      !q ||
      r.full_name?.toLowerCase().includes(q.toLowerCase()) ||
      r.email?.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="border-0 bg-transparent focus-visible:ring-0" />
        <Badge variant="outline" className="border-primary/30 text-primary">{filtered.length}</Badge>
      </div>

      <div className="glass-strong rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Level</TableHead>
              <TableHead>Assigned Tutor</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No candidates yet.</TableCell></TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.user_id} className="border-border/40">
                  <TableCell className="font-medium">{r.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.email}</TableCell>
                  <TableCell>
                    <Select defaultValue={r.level} onValueChange={(v) => setLevel(r.user_id, v as any)}>
                      <SelectTrigger className="w-36 glass border-primary/20 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.tutor_id ?? "__none__"}
                      onValueChange={(v) => assignTutor(r.user_id, v === "__none__" ? null : v)}
                    >
                      <SelectTrigger className="w-44 glass border-primary/20">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Unassigned —</SelectItem>
                        {tutors.map((t) => (
                          <SelectItem key={t.user_id} value={t.user_id}>
                            {t.full_name || t.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button asChild size="icon" variant="ghost" title="View progress">
                      <Link to={`/admin/candidates/${r.user_id}`}><Eye className="w-4 h-4 text-primary" /></Link>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.user_id)} title="Delete">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle className="font-serif gold-text">Edit Candidate</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={editing.full_name ?? ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} className="glass mt-1.5" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className="glass mt-1.5" />
              </div>
              <Button variant="divine" onClick={save} className="w-full">Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
