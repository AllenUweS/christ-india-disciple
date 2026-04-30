import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { MyTutorCard } from "@/components/MyTutorCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Trophy, TrendingUp, Flame, ArrowRight, GraduationCap, MessagesSquare, Award, Sparkles, CheckCircle2, Lock } from "lucide-react";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { formatPrice, levelLabel } from "@/lib/payments";

export const CandidateOverview = () => {
  const { user } = useAuth();
  const { activeSubs, hasAnyActive, loading: planLoading } = usePlanAccess();
  const [stats, setStats] = useState({ lessons: 0, completed: 0, passed: 0, avg: 0 });
  const [levels, setLevels] = useState<string[]>([]);
  const [tutorOpen, setTutorOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: lessonsAll }, { data: progress }, { data: atts }, { data: lvls }] = await Promise.all([
        supabase.from("lessons").select("id"),
        supabase.from("lesson_progress").select("*").eq("candidate_id", user.id).eq("is_completed", true),
        supabase.from("test_attempts").select("status, percentage").eq("candidate_id", user.id),
        supabase.from("candidate_levels").select("level").eq("candidate_id", user.id).eq("unlocked", true),
      ]);
      const passed = atts?.filter((a) => a.status === "passed") ?? [];
      const avg = atts && atts.length ? Math.round(atts.reduce((s, a) => s + Number(a.percentage), 0) / atts.length) : 0;
      setStats({
        lessons: lessonsAll?.length ?? 0,
        completed: progress?.length ?? 0,
        passed: passed.length,
        avg,
      });
      setLevels(lvls?.map((l) => l.level) ?? []);
    })();
  }, [user]);

  const completionPct = stats.lessons ? Math.round((stats.completed / stats.lessons) * 100) : 0;

  return (
    <div className="space-y-8">
      <WelcomeBanner role="candidate" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Lessons Done" value={stats.completed} icon={BookOpen} />
        <StatCard label="Tests Passed" value={stats.passed} icon={Trophy} />
        <StatCard label="Avg Score" value={`${stats.avg}%`} icon={TrendingUp} />
        <StatCard label="Levels Unlocked" value={levels.length} icon={Flame} />
      </div>

      <div className="glass-strong rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative">
          <h2 className="font-serif text-3xl mb-1">Your Divine Progress</h2>
          <p className="text-muted-foreground text-sm mb-5">{stats.completed} of {stats.lessons} lessons walked.</p>
          <Progress value={completionPct} className="h-3" />
          <p className="text-xs text-primary mt-2">{completionPct}% of the journey</p>
        </div>
      </div>

      {/* Plan Status */}
      {!planLoading && (
        hasAnyActive ? (
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="font-serif text-xl">Active Plan{activeSubs.length > 1 ? "s" : ""}</div>
                  <div className="text-xs text-muted-foreground">Your access is unlocked.</div>
                </div>
              </div>
              <Button asChild variant="glass" size="sm"><Link to="/candidate/plans">Manage</Link></Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {activeSubs.map((s) => (
                <div key={s.id} className="glass rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="font-serif gold-text">{levelLabel(s.level as any)}</div>
                    <div className="text-xs text-muted-foreground capitalize">{s.billing_type.replace("_", " ")} • {formatPrice(Number(s.price_paid), s.currency)}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right">
                    {s.expires_at ? `Until ${new Date(s.expires_at).toLocaleDateString()}` : "Lifetime"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-strong rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4 divine-glow-soft">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="font-serif text-xl mb-1">No active plan</div>
              <div className="text-sm text-muted-foreground">Please purchase a plan to access lessons and tests.</div>
            </div>
            <Button asChild variant="divine"><Link to="/candidate/plans"><Sparkles className="w-4 h-4" /> View Plans</Link></Button>
          </div>
        )
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="font-serif text-xl mb-3 gold-text">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setTutorOpen(true)}
            className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-primary/10 transition-all hover:scale-105 group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Tutor</span>
          </button>
          <Link
            to="/candidate/plans"
            className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-primary/10 transition-all hover:scale-105 group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Plans</span>
          </Link>
          <Link
            to="/candidate/messages"
            className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-primary/10 transition-all hover:scale-105 group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
              <MessagesSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Messages</span>
          </Link>
          <Link
            to="/candidate/learn"
            className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-primary/10 transition-all hover:scale-105 group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Learn</span>
          </Link>
          <Link
            to="/candidate/achievements"
            className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-primary/10 transition-all hover:scale-105 group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
              <Award className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Achievements</span>
          </Link>
        </div>
      </div>

      <MyTutorCard open={tutorOpen} onClose={() => setTutorOpen(false)} />
    </div>
  );
};
