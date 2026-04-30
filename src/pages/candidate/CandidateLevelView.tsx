import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, Lock, Check, ChevronRight, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanAccess } from "@/hooks/usePlanAccess";

export const CandidateLevelView = () => {
  const { level } = useParams();
  const { user } = useAuth();
  const { hasLevel, canAccessCourse, canAccessLesson, loading: planLoading } = usePlanAccess();
  const [data, setData] = useState<any[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [passedTests, setPassedTests] = useState<Set<string>>(new Set());

  const levelAccessible = level ? hasLevel(level as any) : false;

  useEffect(() => {
    if (!user || !level) return;
    (async () => {
      const { data: courses } = await supabase
        .from("courses")
        .select("*, lessons(id, title, order_index, description)")
        .eq("level", level as any);
      courses?.forEach((c: any) => c.lessons?.sort((a: any, b: any) => a.order_index - b.order_index));
      setData(courses ?? []);

      const { data: prog } = await supabase.from("lesson_progress").select("lesson_id").eq("candidate_id", user.id).eq("is_completed", true);
      setCompleted(new Set(prog?.map((p) => p.lesson_id) ?? []));

      const { data: atts } = await supabase.from("test_attempts").select("test_id, status").eq("candidate_id", user.id).eq("status", "passed");
      setPassedTests(new Set(atts?.map((a) => a.test_id) ?? []));
    })();
  }, [user, level]);

  // Lesson is unlocked if: candidate has access (level/course/lesson) AND (first OR previous completed)
  const isLessonProgressUnlocked = (lessons: any[], idx: number) => {
    if (idx === 0) return true;
    return completed.has(lessons[idx - 1].id);
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="glass" size="sm"><Link to="/candidate/learn"><ArrowLeft className="w-4 h-4" /> All Levels</Link></Button>
      <div>
        <div className="text-xs uppercase tracking-widest text-primary mb-1">Tier</div>
        <h2 className="font-serif text-4xl gold-text capitalize">{level}</h2>
      </div>

      {!planLoading && !levelAccessible && (
        <div className="glass-strong rounded-2xl p-5 flex items-center gap-4 border border-amber-500/30">
          <Lock className="w-6 h-6 text-amber-500 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Upgrade or renew your plan to access this content</div>
            <div className="text-sm text-muted-foreground">Individual items granted by an admin remain unlocked below.</div>
          </div>
          <Button asChild variant="divine" size="sm"><Link to="/candidate/plans"><Sparkles className="w-4 h-4" /> View Plans</Link></Button>
        </div>
      )}

      {data.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          No courses available in this tier yet.
        </div>
      )}

      {data.map((course) => {
        const courseAccessible = canAccessCourse(course.id, course.level);
        const totalLessons = course.lessons?.length ?? 0;
        const doneLessons = course.lessons?.filter((l: any) => completed.has(l.id)).length ?? 0;
        const pct = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;
        return (
          <div key={course.id} className={cn("glass-strong rounded-2xl p-6 relative overflow-hidden", !courseAccessible && "")}>
            <div className={cn(!courseAccessible && "opacity-60 blur-[1px] pointer-events-none select-none")}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-serif text-2xl mb-1 flex items-center gap-2">
                    {course.title}
                    {!courseAccessible && <Lock className="w-4 h-4 text-amber-500" />}
                  </h3>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                </div>
                {pct === 100 && totalLessons > 0 && courseAccessible && (
                  <div className="flex items-center gap-1.5 text-xs text-primary glass rounded-full px-3 py-1.5 shrink-0">
                    <Trophy className="w-3.5 h-3.5" /> Complete
                  </div>
                )}
              </div>
              {totalLessons > 0 && courseAccessible && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{doneLessons} of {totalLessons} lessons completed</span>
                    <span className="text-primary">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              )}
              <div className="space-y-2">
                {course.lessons?.map((l: any, i: number) => {
                  const lessonAccess = canAccessLesson(l.id, course.id, course.level);
                  const progressUnlocked = isLessonProgressUnlocked(course.lessons, i);
                  const unlocked = lessonAccess && progressUnlocked;
                  const done = completed.has(l.id);
                  return (
                    <Link
                      key={l.id}
                      to={unlocked ? `/candidate/learn/lesson/${l.id}` : "#"}
                      className={cn(
                        "glass rounded-xl p-4 flex items-center gap-3 transition-all",
                        unlocked ? "hover:divine-glow-soft cursor-pointer" : "opacity-50 cursor-not-allowed",
                      )}
                      onClick={(e) => !unlocked && e.preventDefault()}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        done ? "bg-primary/20 border border-primary/40" : unlocked ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border",
                      )}>
                        {done ? <Check className="w-5 h-5 text-primary" /> : unlocked ? <BookOpen className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{i + 1}. {l.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{l.description}</div>
                      </div>
                      {unlocked && <ChevronRight className="w-5 h-5 text-primary shrink-0" />}
                    </Link>
                  );
                })}
                {(!course.lessons || course.lessons.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No lessons yet.</p>
                )}
              </div>
            </div>

            {!courseAccessible && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] z-10">
                <Link
                  to="/candidate/plans"
                  className="glass-strong rounded-xl px-5 py-3 text-sm font-medium hover:divine-glow-soft transition-all inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  Upgrade or renew your plan to access this content
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
