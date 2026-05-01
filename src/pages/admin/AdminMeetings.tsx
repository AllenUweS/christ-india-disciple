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
  Video, Plus, Loader2, Trash2, ExternalLink, Users, Clock, RefreshCw,
} from "lucide-react";

type AudienceMode = "all_tutors" | "all_candidates" | "both" | "specific";

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
  creator_role: string;
  created_by: string;
  created_at: string;
  participantCount?: number;
  creatorName?: string;
}

const EMPTY_FORM = {
  title: "",
  meet_link: "",
  scheduled_at: "",
  notes: "",
  audience: "both" as AudienceMode,
  specificIds: [] as string[],
};

export const AdminMeetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tutors, setTutors] = useState<Profile[]>([]);
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadUsers = async () => {
    // Load tutors
    const { data: tutorRoles } = await supabase
      .from("user_roles").select("user_id").eq("role", "tutor");
    const tutorIds = tutorRoles?.map((r) => r.user_id) ?? [];
    if (tutorIds.length) {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", tutorIds);
      setTutors(data ?? []);
    }

    // Load candidates
    const { data: candidateRoles } = await supabase
      .from("user_roles").select("user_id").eq("role", "candidate");
    const candidateIds = candidateRoles?.map((r) => r.user_id) ?? [];
    if (candidateIds.length) {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", candidateIds);
      setCandidates(data ?? []);
    }
  };

  const loadMeetings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .order("scheduled_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Enrich with participant counts and creator names
    const enriched = await Promise.all(
      data.map(async (m) => {
        const { count } = await supabase
          .from("meeting_participants")
          .select("id", { count: "exact", head: true })
          .eq("meeting_id", m.id);
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", m.created_by)
          .maybeSingle();
        return {
          ...m,
          participantCount: count ?? 0,
          creatorName: prof?.full_name ?? "Admin",
        };
      })
    );
    setMeetings(enriched);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
    loadMeetings();
  }, []);

  // Resolve which user_ids to add based on audience mode
  const resolveParticipantIds = (): string[] => {
    switch (form.audience) {
      case "all_tutors":     return tutors.map((t) => t.user_id);
      case "all_candidates": return candidates.map((c) => c.user_id);
      case "both":           return [...tutors.map((t) => t.user_id), ...candidates.map((c) => c.user_id)];
      case "specific":       return form.specificIds;
    }
  };

  const create = async () => {
    if (!form.title.trim() || !form.meet_link.trim() || !form.scheduled_at) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    const participantIds = resolveParticipantIds();
    if (participantIds.length === 0) {
      toast({ title: "Select at least one participant", variant: "destructive" });
      return;
    }

    setBusy(true);
    // Insert meeting
    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        title: form.title.trim(),
        meet_link: form.meet_link.trim(),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        notes: form.notes.trim() || null,
        created_by: user!.id,
        creator_role: "admin",
      })
      .select()
      .single();

    if (error || !meeting) {
      toast({ title: "Failed to create meeting", description: error?.message, variant: "destructive" });
      setBusy(false);
      return;
    }

    // Insert participants
    const participantRows = participantIds.map((uid) => ({
      meeting_id: meeting.id,
      user_id: uid,
    }));
    await supabase.from("meeting_participants").insert(participantRows);

    toast({ title: "Meeting created ✨", description: `Shared with ${participantIds.length} participants.` });
    setOpen(false);
    setForm(EMPTY_FORM);
    loadMeetings();
    setBusy(false);
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm("Delete this meeting and remove access for all participants?")) return;
    await supabase.from("meeting_participants").delete().eq("meeting_id", id);
    await supabase.from("meetings").delete().eq("id", id);
    toast({ title: "Meeting deleted" });
    loadMeetings();
  };

  const toggleSpecific = (uid: string) => {
    setForm((f) => ({
      ...f,
      specificIds: f.specificIds.includes(uid)
        ? f.specificIds.filter((id) => id !== uid)
        : [...f.specificIds, uid],
    }));
  };

  const allSpecificUsers = [...tutors, ...candidates];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            {meetings.length} meeting{meetings.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadMeetings}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="divine"><Plus className="w-4 h-4 mr-1" /> Schedule Meeting</Button>
            </DialogTrigger>
            <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif gold-text">Schedule a Google Meet</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Title */}
                <div>
                  <Label>Meeting Title <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Weekly Bible Study"
                    className="glass mt-1.5"
                  />
                </div>

                {/* Google Meet Link */}
                <div>
                  <Label>Google Meet Link <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.meet_link}
                    onChange={(e) => setForm({ ...form, meet_link: e.target.value })}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="glass mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a meet at{" "}
                    <a href="https://meet.google.com" target="_blank" rel="noreferrer" className="text-primary underline">
                      meet.google.com
                    </a>{" "}
                    and paste the link here.
                  </p>
                </div>

                {/* Scheduled Date/Time */}
                <div>
                  <Label>Date & Time <span className="text-destructive">*</span></Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    className="glass mt-1.5"
                  />
                </div>

                {/* Audience */}
                <div>
                  <Label>Invite</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["both", "all_candidates", "all_tutors", "specific"] as AudienceMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setForm({ ...form, audience: mode, specificIds: [] })}
                        className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                          form.audience === mode
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border/40 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {mode === "both" && "All (Tutors + Candidates)"}
                        {mode === "all_candidates" && "All Candidates"}
                        {mode === "all_tutors" && "All Tutors"}
                        {mode === "specific" && "Specific Users"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific user selection */}
                {form.audience === "specific" && (
                  <div className="border border-border/40 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                    {allSpecificUsers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No users found.</p>
                    ) : (
                      allSpecificUsers.map((u) => {
                        const role = tutors.find((t) => t.user_id === u.user_id) ? "Tutor" : "Candidate";
                        return (
                          <label key={u.user_id} className="flex items-center gap-2 cursor-pointer py-1">
                            <Checkbox
                              checked={form.specificIds.includes(u.user_id)}
                              onCheckedChange={() => toggleSpecific(u.user_id)}
                            />
                            <span className="text-sm flex-1">{u.full_name || u.email}</span>
                            <Badge variant="outline" className="text-[10px]">{role}</Badge>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any agenda or instructions..."
                    className="glass mt-1.5 resize-none"
                    rows={2}
                  />
                </div>

                <Button variant="divine" onClick={create} disabled={busy} className="w-full">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <><Video className="w-4 h-4 mr-1" /> Create & Share Meeting</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="glass-strong rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead>Title</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : meetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  No meetings yet. Schedule your first one above.
                </TableCell>
              </TableRow>
            ) : (
              meetings.map((m) => {
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
                        <span className={isPast ? "text-muted-foreground" : "text-foreground"}>
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
                    <TableCell className="text-sm text-muted-foreground">{m.creatorName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm" variant="outline"
                          className="text-xs"
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
    </div>
  );
};
