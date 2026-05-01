import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Video, Clock, User, ExternalLink, RefreshCw, CalendarClock } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  meet_link: string;
  scheduled_at: string;
  notes: string | null;
  creator_role: string;
  created_by: string;
  creatorName?: string;
}

export const CandidateMeetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    // Get meeting IDs for this candidate
    const { data: participantRows } = await supabase
      .from("meeting_participants")
      .select("meeting_id")
      .eq("user_id", user.id);

    const meetingIds = participantRows?.map((p) => p.meeting_id) ?? [];
    if (!meetingIds.length) { setMeetings([]); setLoading(false); return; }

    // Fetch those meetings
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .in("id", meetingIds)
      .order("scheduled_at", { ascending: true });

    if (!data) { setLoading(false); return; }

    // Enrich with creator names
    const enriched = await Promise.all(
      data.map(async (m) => {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", m.created_by)
          .maybeSingle();
        return {
          ...m,
          creatorName: prof?.full_name ?? (m.creator_role === "admin" ? "Administrator" : "Tutor"),
        };
      })
    );
    setMeetings(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const upcoming = meetings.filter((m) => new Date(m.scheduled_at) >= new Date());
  const past = meetings.filter((m) => new Date(m.scheduled_at) < new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {upcoming.length} upcoming • {past.length} past
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {meetings.length === 0 && (
        <div className="glass-strong rounded-2xl p-12 text-center space-y-3">
          <Video className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No meetings assigned to you yet.</p>
          <p className="text-xs text-muted-foreground">
            Your tutor or admin will share a meeting link with you here.
          </p>
        </div>
      )}

      {/* Upcoming Meetings */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Upcoming
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} variant="upcoming" />
            ))}
          </div>
        </section>
      )}

      {/* Past Meetings */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Past Sessions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {past.reverse().map((m) => (
              <MeetingCard key={m.id} meeting={m} variant="past" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ── Meeting Card ──────────────────────────────────────────────
const MeetingCard = ({
  meeting: m,
  variant,
}: {
  meeting: Meeting;
  variant: "upcoming" | "past";
}) => {
  const dt = new Date(m.scheduled_at);
  const isToday = dt.toDateString() === new Date().toDateString();

  return (
    <div
      className={`glass-strong rounded-2xl p-5 flex flex-col gap-3 border transition-all ${
        variant === "upcoming"
          ? "border-primary/30 hover:border-primary/60"
          : "border-border/30 opacity-70"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              variant === "upcoming" ? "bg-primary/20" : "bg-muted/40"
            }`}
          >
            <Video className={`w-4 h-4 ${variant === "upcoming" ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <h3 className="font-medium text-sm leading-tight">{m.title}</h3>
        </div>
        {isToday && variant === "upcoming" && (
          <Badge className="text-[10px] shrink-0 bg-primary/20 text-primary border border-primary/30">
            Today
          </Badge>
        )}
        {variant === "past" && (
          <Badge variant="outline" className="text-[10px] shrink-0">Past</Badge>
        )}
      </div>

      {/* Meta */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          {dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          {" at "}
          {dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          {m.creatorName}
          <Badge variant="outline" className="text-[9px] py-0 px-1 capitalize">{m.creator_role}</Badge>
        </div>
      </div>

      {/* Notes */}
      {m.notes && (
        <p className="text-xs text-muted-foreground bg-white/5 rounded-lg px-3 py-2 border border-border/30 line-clamp-2">
          {m.notes}
        </p>
      )}

      {/* Join button */}
      <Button
        variant={variant === "upcoming" ? "divine" : "outline"}
        size="sm"
        className="w-full mt-auto"
        onClick={() => window.open(m.meet_link, "_blank")}
      >
        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
        {variant === "upcoming" ? "Join Meeting" : "Open Recording / Link"}
      </Button>
    </div>
  );
};
