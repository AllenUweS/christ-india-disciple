import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const TutorMessages = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Only assigned candidates
      const { data: assigns } = await supabase
        .from("tutor_assignments")
        .select("candidate_id")
        .eq("tutor_id", user.id);
      const candidateIds = assigns?.map((a) => a.candidate_id) ?? [];

      // Plus admins (so tutors can reach the admin)
      const { data: adminRows } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const ids = Array.from(new Set([...candidateIds, ...(adminRows?.map((r) => r.user_id) ?? [])]));
      if (ids.length === 0) return setContacts([]);
      const { data: profs } = await supabase.from("profiles").select("*").in("user_id", ids);
      setContacts(profs ?? []);
    })();
  }, [user]);

  const scrollEnd = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 60);

  const loadMsgs = async (other: any) => {
    setActive(other);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user!.id},recipient_id.eq.${other.user_id}),and(sender_id.eq.${other.user_id},recipient_id.eq.${user!.id})`,
      )
      .order("created_at");
    setMsgs(data ?? []);
    scrollEnd();
  };

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`tmsg-inbox-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        (payload: any) => {
          const m = payload.new;
          if (active && m.sender_id === active.user_id) {
            setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
            scrollEnd();
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, active]);

  const send = async () => {
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: user!.id, recipient_id: active.user_id, body })
      .select()
      .single();
    if (error) return;
    if (data) {
      setMsgs((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]));
      scrollEnd();
    }
  };

  const initials = (n?: string, e?: string) =>
    (n || e || "?")
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="glass-strong rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[70vh]">
      <div className="border-r border-border/40 overflow-y-auto bg-gradient-to-b from-background/40 to-transparent">
        <div className="p-4 border-b border-border/40">
          <div className="text-xs uppercase tracking-[0.2em] text-primary/80 font-semibold flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Candidates
          </div>
        </div>
        {contacts.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground italic">No candidates yet.</p>
        )}
        {contacts.map((c) => (
          <button
            key={c.user_id}
            onClick={() => loadMsgs(c)}
            className={cn(
              "w-full text-left p-3 transition-all border-b border-border/20 flex items-center gap-3",
              active?.user_id === c.user_id
                ? "bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-l-primary"
                : "hover:bg-white/5",
            )}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 shrink-0">
              {initials(c.full_name, c.email)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{c.full_name || "—"}</div>
              <div className="text-xs text-muted-foreground truncate">{c.email}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="md:col-span-2 flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary-glow/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <div>
              <div className="font-serif text-2xl gold-text">Connect with a Candidate</div>
              <div className="text-sm text-muted-foreground mt-1">Pick someone to chat with.</div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border/40 flex items-center gap-3 bg-background/40 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-bold text-sm">
                {initials(active.full_name, active.email)}
              </div>
              <div>
                <div className="font-serif text-lg leading-tight">{active.full_name || active.email}</div>
                <div className="text-xs text-primary/70 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> online
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {msgs.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-12">
                  No messages yet — send the first one ✨
                </div>
              )}
              {msgs.map((m, i) => {
                const mine = m.sender_id === user!.id;
                const prev = msgs[i - 1];
                const showAvatar = !prev || prev.sender_id !== m.sender_id;
                return (
                  <div key={m.id} className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
                    {!mine && (
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full bg-gradient-to-br from-primary/60 to-primary-glow/40 flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0",
                          !showAvatar && "invisible",
                        )}
                      >
                        {initials(active.full_name, active.email)}
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-md break-words ring-1",
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-sm shadow-primary/40 ring-primary/40 font-medium"
                          : "bg-card text-card-foreground border border-border rounded-bl-sm ring-border/30",
                      )}
                    >
                      <div className="leading-relaxed">{m.body}</div>
                      <div
                        className={cn(
                          "text-[10px] mt-1",
                          mine ? "text-primary-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="p-4 border-t border-border/40 flex gap-2 bg-background/60 backdrop-blur-sm">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message…"
                className="glass border-primary/30 focus-visible:ring-primary"
              />
              <Button
                variant="divine"
                size="icon"
                onClick={send}
                className="shadow-lg shadow-primary/40 hover:scale-105 transition-transform"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
