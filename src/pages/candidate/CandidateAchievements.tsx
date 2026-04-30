import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const CandidateAchievements = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("test_attempts")
        .select("*, tests(title, lesson_id, lessons(title))")
        .eq("candidate_id", user.id)
        .order("submitted_at", { ascending: false });
      setRows(data ?? []);
    })();
  }, [user]);

  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          No attempts yet. Take a test to earn your first divine mark.
        </div>
      )}
      {rows.map((r) => (
        <div key={r.id} className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
            r.status === "passed" ? "bg-primary/10 border-primary/40" :
            r.status === "failed" ? "bg-destructive/10 border-destructive/40" :
            "bg-muted border-border",
          )}>
            {r.status === "passed" ? <Trophy className="w-6 h-6 text-primary" /> :
             r.status === "failed" ? <XCircle className="w-6 h-6 text-destructive" /> :
             <Clock className="w-6 h-6 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{r.tests?.title ?? "Test"}</div>
            <div className="text-xs text-muted-foreground">
              {r.tests?.lessons?.title} • {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "in progress"}
            </div>
          </div>
          <div className="text-right">
            <div className={cn("font-serif text-2xl", r.status === "passed" ? "gold-text" : r.status === "failed" ? "text-destructive" : "")}>
              {Number(r.percentage)}%
            </div>
            <div className="text-xs text-muted-foreground">{r.score}/{r.total} pts</div>
          </div>
        </div>
      ))}
    </div>
  );
};
