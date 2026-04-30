import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { KeyRound, Plus, Trash2, Clock } from "lucide-react";

type Scope = "level" | "course" | "lesson";
type Level = "basic" | "intermediate" | "senior";

interface OverrideRow {
  id: string;
  candidate_id: string;
  scope: Scope;
  level: Level | null;
  course_id: string | null;
  lesson_id: string | null;
  unlock_until: string;
  granted_at: string;
  notes: string | null;
  candidate_name?: string;
  candidate_email?: string;
  target_label?: string;
}

interface Candidate { user_id: string; full_name: string | null; email: string | null }
interface Course { id: string; title: string; level: Level }
interface Lesson { id: string; title: string; course_id: string }

export const AdminOverrides = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<OverrideRow[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // form state
  const [candidateId, setCandidateId] = useState("");
  const [scope, setScope] = useState<Scope>("level");
  const [level, setLevel] = useState<Level>("basic");
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [days, setDays] = useState(7);
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    const [cRoles, cs, ls, ovRes] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "candidate"),
      supabase.from("courses").select("id, title, level"),
      supabase.from("lessons").select("id, title, course_id"),
      supabase
        .from("content_access_overrides")
        .select("id, candidate_id, scope, level, course_id, lesson_id, unlock_until, granted_at, notes")
        .order("granted_at", { ascending: false }),
    ]);

    const cIds = cRoles.data?.map((r) => r.user_id) ?? [];
    let profs: Candidate[] = [];
    if (cIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", cIds);
      profs = (data ?? []) as Candidate[];
    }
    setCandidates(profs);
    setCourses((cs.data ?? []) as Course[]);
    setLessons((ls.data ?? []) as Lesson[]);

    const profMap = new Map(profs.map((p) => [p.user_id, p]));
    const courseMap = new Map((cs.data ?? []).map((c: any) => [c.id, c]));
    const lessonMap = new Map((ls.data ?? []).map((l: any) => [l.id, l]));

    const enriched: OverrideRow[] = (ovRes.data ?? []).map((o: any) => {
      const p = profMap.get(o.candidate_id);
      let target = "—";
      if (o.scope === "level") target = `Level: ${o.level}`;
      else if (o.scope === "course") target = `Course: ${courseMap.get(o.course_id!)?.title ?? "—"}`;
      else if (o.scope === "lesson") target = `Lesson: ${lessonMap.get(o.lesson_id!)?.title ?? "—"}`;
      return {
        ...o,
        candidate_name: p?.full_name ?? null,
        candidate_email: p?.email ?? null,
        target_label: target,
      };
    });
    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredCourses = courses; // show all
  const filteredLessons = lessons.filter((l) => !courseId || l.course_id === courseId);

  const reset = () => {
    setCandidateId("");
    setScope("level");
    setLevel("basic");
    setCourseId("");
    setLessonId("");
    setDays(7);
    setNotes("");
  };

  const submit = async () => {
    if (!candidateId) return toast({ title: "Pick a candidate", variant: "destructive" });
    if (days <= 0) return toast({ title: "Days must be > 0", variant: "destructive" });
    if (scope === "course" && !courseId) return toast({ title: "Pick a course", variant: "destructive" });
    if (scope === "lesson" && !lessonId) return toast({ title: "Pick a lesson", variant: "destructive" });

    const unlockUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const payload: any = {
      candidate_id: candidateId,
      scope,
      level: scope === "level" ? level : null,
      course_id: scope === "course" ? courseId : null,
      lesson_id: scope === "lesson" ? lessonId : null,
      unlock_until: unlockUntil,
      granted_by: user?.id,
      notes: notes || null,
    };
    const { error } = await supabase.from("content_access_overrides").insert(payload);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Free access granted ✨" });
    setOpen(false);
    reset();
    load();
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this free access?")) return;
    const { error } = await supabase.from("content_access_overrides").delete().eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Revoked" });
    load();
  };

  const isExpired = (s: string) => new Date(s).getTime() <= Date.now();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl gold-text flex items-center gap-2">
            <KeyRound className="w-7 h-7" /> Free Access Overrides
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Grant temporary access to a level, course, or lesson. Access auto-locks when the time expires.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button variant="divine"><Plus className="w-4 h-4" /> Grant Access</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif gold-text">Grant Free Access</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Candidate</Label>
                <Select value={candidateId} onValueChange={setCandidateId}>
                  <SelectTrigger className="glass mt-1.5"><SelectValue placeholder="Pick a candidate" /></SelectTrigger>
                  <SelectContent>
                    {candidates.map((c) => (
                      <SelectItem key={c.user_id} value={c.user_id}>
                        {c.full_name || c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Scope</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
                  <SelectTrigger className="glass mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="level">Whole Level</SelectItem>
                    <SelectItem value="course">Specific Course</SelectItem>
                    <SelectItem value="lesson">Specific Lesson</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scope === "level" && (
                <div>
                  <Label>Level</Label>
                  <Select value={level} onValueChange={(v) => setLevel(v as Level)}>
                    <SelectTrigger className="glass mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {scope === "course" && (
                <div>
                  <Label>Course</Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger className="glass mt-1.5"><SelectValue placeholder="Pick a course" /></SelectTrigger>
                    <SelectContent>
                      {filteredCourses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          [{c.level}] {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {scope === "lesson" && (
                <>
                  <div>
                    <Label>Filter by Course (optional)</Label>
                    <Select value={courseId} onValueChange={setCourseId}>
                      <SelectTrigger className="glass mt-1.5"><SelectValue placeholder="All courses" /></SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>[{c.level}] {c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lesson</Label>
                    <Select value={lessonId} onValueChange={setLessonId}>
                      <SelectTrigger className="glass mt-1.5"><SelectValue placeholder="Pick a lesson" /></SelectTrigger>
                      <SelectContent>
                        {filteredLessons.map((l) => (
                          <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <Label>Access Duration (days)</Label>
                <Input type="number" min={1} value={days} onChange={(e) => setDays(parseInt(e.target.value) || 0)} className="glass mt-1.5" />
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="glass mt-1.5" placeholder="Reason for free access…" />
              </div>

              <Button variant="divine" onClick={submit} className="w-full">
                <KeyRound className="w-4 h-4" /> Grant Access
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-strong rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead>Candidate</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Granted</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No overrides yet.</TableCell></TableRow>
            ) : (
              rows.map((r) => {
                const expired = isExpired(r.unlock_until);
                return (
                  <TableRow key={r.id} className="border-border/40">
                    <TableCell>
                      <div className="font-medium">{r.candidate_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.candidate_email}</div>
                    </TableCell>
                    <TableCell className="capitalize">{r.target_label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.granted_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.unlock_until).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      {expired ? (
                        <Badge variant="outline" className="text-muted-foreground border-muted-foreground/40">Expired</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/40">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.notes || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => revoke(r.id)} title="Revoke">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
