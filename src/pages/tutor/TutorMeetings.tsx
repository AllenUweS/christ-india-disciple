import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  Video, Plus, Loader2, Trash2, ExternalLink, Clock, RefreshCw, Users, ShieldCheck,
} from "lucide-react";

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface Meeting {
  id: string;
  title: string;
  meet_link: string;
  scheduled_at: string;
  notes: string | null;
  created_at: string;
  created_by: string;
  creator_role: string;
  participantCount?: number;
  creatorName?: string;
}

const EMPTY_FORM = {
  title: "",
  meet_link: "",
  scheduled_at: "",
  notes: "",
  selectedCandidateIds: [] as string[],
};

export const TutorMeetings = () => {
  const { user } = useAuth();
  const [ownMeetings, setOwnMeetings] = useState<Meeting[]>([]);
  const [assignedMeetings, setAssignedMeetings] = useState<Meeting[]>([]);
  const [assignedCandidates, setAssignedCandidates] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadAssignedCandidates = async () => {
    if (!user) return;
    const { data: assignments } = await supabase
      .from("tutor_assignments")
      .select("candidate_id")
      .eq("tutor_id", user.id);
    const ids = assignments?.map((a) => a.candidate_id) ?? [];
    if (!ids.length) { setAssignedCandidates([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", ids);
    setAssignedCandidates(data ?? []);
  };

  const loadMeetings = async () => {
    if (!user) return;
    setLoading(true);

    // 1. Meetings this tutor created
    const { data: created } = await supabase
      .from("meetings")
      .select("*")
      .eq("created_by", user.id)
      .order("scheduled_at", { ascending: false });

    // 2. All meeting_ids where tutor is a participant
    const { data: participantRows } = await supabase
      .from("meeting_participants")
      .select("meeting_id")
      .eq("user_id", user.id);

    const participantMeetingIds = participantRows?.map((p) => p.meeting_id) ?? [];

    // Exclude meetings the tutor themselves created (those are in list 1)
    const createdIds = new Set((created ?? []).map((m) => m.id));
    const assignedIds = participantMeetingIds.filter((id) => !createdIds.has(id));

    let assigned: Meeting[] = [];
    if (assignedIds.length > 0) {
      const { data } = await supabase
        .from("meetings")
        .select("*")
        .in("id", assignedIds)
        .order("scheduled_at", { ascending: false });
      assigned = data ?? [];
    }

    // Enrich own meetings with participant count
    const enrichedOwn = await Promise.all(
      (created ?? []).map(async (m) => {
        const { count } = await supabase
          .from("meeting_participants")
          .select("id", { count: "exact", head: true })
          .eq("meeting_id", m.id);
        return { ...m, participantCount: count ?? 0 };
      })
    );

    // Enrich assigned meetings with creator name
    const enrichedAssigned = await Promise.all(
      assigned.map(async (m) => {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", m.created_by)
          .maybeSingle();
        return { ...m, creatorName: prof?.full_name ?? "Admin" };
      })
    );

    setOwnMeetings(enrichedOwn);
    setAssignedMeetings(enrichedAssigned);
    setLoading(false);
  };

  useEffect(() => {
    loadAssignedCandidates();
    loadMeetings();
  }, [user]);

  const toggleCandidate = (uid: string) => {
    setForm((f) => ({
      ...f,
      selectedCandidateIds: f.selectedCandidateIds.includes(uid)
        ? f.selectedCandidateIds.filter((id) => id !== uid)
        : [...f.selectedCandidateIds, uid],
    }));
  };

  const create = async () => {
    if (!form.title.trim() || !form.meet_link.trim() || !form.scheduled_at) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    if (form.selectedCandidateIds.length === 0) {
      toast({ title: "Select at least one candidate", variant: "destructive" });
      return;
    }

    const validIds = form.selectedCandidateIds.filter((id) =>
      assignedCandidates.some((c) => c.user_id === id)
    );
    if (validIds.length !== form.selectedCandidateIds.length) {
      toast({ title: "Unauthorized selection detected", variant: "destructive" });
      return;
    }

    setBusy(true);
    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        title: form.title.trim(),
        meet_link: form.meet_link.trim(),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        notes: form.notes.trim() || null,
        created_by: user!.id,
        creator_role: "tutor",
      })
      .select()
      .single();

    if (error || !meeting) {
      toast({ title: "Failed to create meeting", description: error?.message, variant: "destructive" });
      setBusy(false);
      return;
    }

    // Include tutor themselves so they can also join
    const allParticipantIds = [...new Set([user!.id, ...validIds])];
    await supabase.from("meeting_participants").insert(
      allParticipantIds.map((uid) => ({ meeting_id: meeting.id, user_id: uid }))
    );

    toast({ title: "Meeting created ✨", description: `Shared with ${validIds.length} candidate(s).` });
    setOpen(false);
    setForm(EMPTY_FORM);
    loadMeetings();
    setBusy(false);
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm("Delete this meeting?")) return;
    await supabase.from("meeting_participants").delete().eq("meeting_id", id);
    await supabase.from("meetings").delete().eq("id", id).eq("created_by", user!.id);
    toast({ title: "Meeting deleted" });
    loadMeetings();
  };

  const totalCount = ownMeetings.length + assignedMeetings.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            {totalCount} meeting{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadMeetings}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="divine"><Plus className="w-4 h-4 mr-1" /> New Meeting</Button>
            </DialogTrigger>
            <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif gold-text">Schedule a Session</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div>
                  <Label>Meeting Title <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Prayer & Discipleship Session"
                    className="glass mt-1.5"
                  />
                </div>

                <div>
                  <Label>Google Meet Link <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.meet_link}
                    onChange={(e) => setForm({ ...form, meet_link: e.target.value })}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="glass mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Go to{" "}
                    <a href="https://meet.google.com" target="_blank" rel="noreferrer" className="text-primary underline">
                      meet.google.com
                    </a>{" "}
                    → "New meeting" → copy the link.
                  </p>
                </div>

                <div>
                  <Label>Date & Time <span className="text-destructive">*</span></Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    className="glass mt-1.5"
                  />
                </div>

                <div>
                  <Label>Select Candidates <span className="text-destructive">*</span></Label>
                  {assignedCandidates.length === 0 ? (
                    <div className="mt-2 p-3 border border-border/40 rounded-xl text-sm text-muted-foreground">
                      You have no assigned candidates yet.
                    </div>
                  ) : (
                    <div className="mt-2 border border-border/40 rounded-xl p-3 space-y-2 max-h-44 overflow-y-auto">
                      {assignedCandidates.map((c) => (
                        <label key={c.user_id} className="flex items-center gap-2 cursor-pointer py-1">
                          <Checkbox
                            checked={form.selectedCandidateIds.includes(c.user_id)}
                            onCheckedChange={() => toggleCandidate(c.user_id)}
                          />
                          <div className="flex-1">
                            <span className="text-sm block">{c.full_name || c.email}</span>
                            {c.full_name && (
                              <span className="text-xs text-muted-foreground">{c.email}</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    You can only invite candidates assigned to you.
                  </p>
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Agenda, scripture references, etc."
                    className="glass mt-1.5 resize-none"
                    rows={2}
                  />
                </div>

                <Button
                  variant="divine"
                  onClick={create}
                  disabled={busy || assignedCandidates.length === 0}
                  className="w-full"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <><Video className="w-4 h-4 mr-1" /> Create & Share</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* ── Meetings Assigned by Admin ── */}
          {assignedMeetings.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  Assigned by Admin
                </h2>
              </div>
              <div className="glass-strong rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40">
                      <TableHead>Title</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedMeetings.map((m) => {
                      const isPast = new Date(m.scheduled_at) < new Date();
                      return (
                        <TableRow key={m.id} className="border-border/40">
                          <TableCell>
                            <div className="font-medium">{m.title}</div>
                            {m.notes && (
                              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.notes}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className={isPast ? "text-muted-foreground" : ""}>
                                {new Date(m.scheduled_at).toLocaleString()}
                              </span>
                            </div>
                            {isPast && <Badge variant="outline" className="text-[10px] mt-1">Past</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              {m.creatorName}
                              <Badge variant="outline" className="text-[9px]">Admin</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm" variant="divine" className="text-xs"
                              onClick={() => window.open(m.meet_link, "_blank")}
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Join
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </section>
          )}

          {/* ── My Created Meetings ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Created by Me
              </h2>
            </div>
            <div className="glass-strong rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40">
                    <TableHead>Title</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Candidates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownMeetings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                        No meetings created yet. Use the button above to schedule one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ownMeetings.map((m) => {
                      const isPast = new Date(m.scheduled_at) < new Date();
                      return (
                        <TableRow key={m.id} className="border-border/40">
                          <TableCell>
                            <div className="font-medium">{m.title}</div>
                            {m.notes && (
                              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.notes}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className={isPast ? "text-muted-foreground" : ""}>
                                {new Date(m.scheduled_at).toLocaleString()}
                              </span>
                            </div>
                            {isPast && <Badge variant="outline" className="text-[10px] mt-1">Past</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="w-3.5 h-3.5" />
                              {m.participantCount}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm" variant="divine" className="text-xs"
                                onClick={() => window.open(m.meet_link, "_blank")}
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Join
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => deleteMeeting(m.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};