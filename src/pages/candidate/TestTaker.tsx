import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Clock, Trophy, XCircle, ArrowRight, Check, X, Timer, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Result = {
  score: number;
  total: number;
  pct: number;
  passed: boolean;
  timeTakenSec: number;
  perQuestion: { q: any; userAnswer: string; correct: boolean }[];
};

export const TestTaker = () => {
  const { testId } = useParams();
  const { user } = useAuth();
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [submitted, setSubmitted] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const submittedRef = useRef(false);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!testId) return;
    (async () => {
      const { data: t } = await supabase.from("tests").select("*").eq("id", testId).single();
      setTest(t);
      const dur = (t?.duration_minutes ?? 15) * 60;
      setSeconds(dur);
      setTotalSeconds(dur);
      startedAtRef.current = Date.now();
      const { data: qs } = await supabase.from("questions").select("*").eq("test_id", testId).order("order_index");
      setQuestions(qs ?? []);
    })();
  }, [testId]);

  const submit = useCallback(async (auto = false) => {
    if (submittedRef.current || !test || !user) return;
    submittedRef.current = true;
    setBusy(true);
    let score = 0;
    let total = 0;
    const perQuestion: Result["perQuestion"] = [];
    questions.forEach((q) => {
      total += q.points;
      const userAnswer = (answers[q.id] ?? "").trim();
      const correctRaw = (q.correct_answer ?? "").trim();
      const correct = userAnswer.toLowerCase() === correctRaw.toLowerCase() && userAnswer.length > 0;
      if (correct) score += q.points;
      perQuestion.push({ q, userAnswer, correct });
    });
    const pct = total ? Math.round((score / total) * 100 * 100) / 100 : 0;
    const passed = pct >= test.pass_percentage;
    const timeTakenSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));

    await supabase.from("test_attempts").insert({
      test_id: testId!,
      candidate_id: user.id,
      answers,
      score,
      total,
      percentage: pct,
      status: passed ? "passed" : "failed",
      submitted_at: new Date().toISOString(),
    });

    if (passed) {
      const { data: testRow } = await supabase.from("tests").select("lesson_id").eq("id", testId!).single();
      if (testRow) {
        const { data: lessonRow } = await supabase.from("lessons").select("course_id").eq("id", testRow.lesson_id).single();
        if (lessonRow) {
          const { data: courseRow } = await supabase.from("courses").select("level").eq("id", lessonRow.course_id).single();
          if (courseRow?.level === "basic") {
            await supabase.from("candidate_levels").upsert({ candidate_id: user.id, level: "intermediate", unlocked: true, unlocked_at: new Date().toISOString() }, { onConflict: "candidate_id,level" });
          } else if (courseRow?.level === "intermediate") {
            await supabase.from("candidate_levels").upsert({ candidate_id: user.id, level: "senior", unlocked: true, unlocked_at: new Date().toISOString() }, { onConflict: "candidate_id,level" });
          }
        }
      }
    }

    setSubmitted({ score, total, pct, passed, timeTakenSec, perQuestion });
    setBusy(false);
    if (auto) toast({ title: "Time's up!", description: "Your answers were submitted automatically." });
  }, [answers, questions, test, testId, user]);

  useEffect(() => {
    if (!test || submitted) return;
    if (seconds <= 0) { submit(true); return; }
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds, test, submitted, submit]);

  if (!test) return <div className="text-muted-foreground">Loading…</div>;

  if (submitted) {
    const mins = Math.floor(submitted.timeTakenSec / 60);
    const secs = submitted.timeTakenSec % 60;
    const speedPct = Math.round(((totalSeconds - submitted.timeTakenSec) / totalSeconds) * 100);
    const correctCount = submitted.perQuestion.filter((p) => p.correct).length;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Hero result card */}
        <div className="glass-strong rounded-2xl p-10 text-center relative overflow-hidden">
          <div className={cn("absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl",
            submitted.passed ? "bg-primary/20" : "bg-destructive/20")} />
          <div className="relative">
            <div className={cn("w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center border",
              submitted.passed ? "border-primary/40 bg-primary/10" : "border-destructive/40 bg-destructive/10")}>
              {submitted.passed ? <Trophy className="w-10 h-10 text-primary" /> : <XCircle className="w-10 h-10 text-destructive" />}
            </div>
            <h2 className={cn("font-serif text-4xl mb-2", submitted.passed ? "gold-text" : "text-destructive")}>
              {submitted.passed ? "Blessed! You passed." : "Not yet — try again."}
            </h2>
            <p className="text-muted-foreground mb-6">
              {submitted.passed ? "The next lesson awaits you." : `Required: ${test.pass_percentage}% — review your answers below.`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="glass rounded-xl p-4">
                <div className="font-serif text-3xl gold-text">{submitted.pct}%</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Score</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="font-serif text-3xl">{submitted.score}/{submitted.total}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Points</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="font-serif text-3xl">{correctCount}/{submitted.perQuestion.length}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Correct</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="font-serif text-3xl flex items-center justify-center gap-1"><Timer className="w-5 h-5 text-primary" />{mins}:{secs.toString().padStart(2, "0")}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Time</div>
              </div>
            </div>
            {speedPct > 50 && submitted.passed && (
              <div className="inline-flex items-center gap-2 text-xs text-primary glass rounded-full px-3 py-1.5 mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Speed Demon — finished with {speedPct}% time to spare!
              </div>
            )}
          </div>
        </div>

        {/* Review */}
        <div>
          <h3 className="font-serif text-2xl gold-text mb-3">Review your answers</h3>
          <div className="space-y-3">
            {submitted.perQuestion.map((p, i) => (
              <div key={p.q.id} className={cn("glass-strong rounded-2xl p-5 border",
                p.correct ? "border-primary/30" : "border-destructive/30")}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                    p.correct ? "bg-primary/10 border-primary/40 text-primary" : "bg-destructive/10 border-destructive/40 text-destructive")}>
                    {p.correct ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Q{i + 1} • {p.q.points} pt • {p.q.q_type === "mcq" ? "Multiple choice" : "Fill in the blank"}</div>
                    <div className="font-medium">{p.q.question_text}</div>
                  </div>
                </div>
                {p.q.q_type === "mcq" ? (
                  <div className="space-y-1.5 ml-11">
                    {(p.q.options as string[]).map((o, j) => {
                      const isCorrect = o === p.q.correct_answer;
                      const isUser = o === p.userAnswer;
                      return (
                        <div key={j} className={cn(
                          "rounded-lg px-3 py-2 text-sm flex items-center gap-2 border",
                          isCorrect && "bg-primary/10 border-primary/40 text-primary",
                          isUser && !isCorrect && "bg-destructive/10 border-destructive/40 text-destructive",
                          !isUser && !isCorrect && "border-border/30 text-muted-foreground",
                        )}>
                          {isCorrect && <Check className="w-3.5 h-3.5" />}
                          {isUser && !isCorrect && <X className="w-3.5 h-3.5" />}
                          <span className="flex-1">{o}</span>
                          {isUser && <span className="text-[10px] uppercase tracking-widest">Your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ml-11 space-y-2">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Your answer</div>
                    <div className={cn("glass rounded-lg px-3 py-2 text-sm", p.correct ? "text-primary" : "text-destructive")}>
                      {p.userAnswer || <em className="opacity-60">— blank —</em>}
                    </div>
                    {!p.correct && (
                      <>
                        <div className="text-xs uppercase tracking-widest text-primary">Correct answer</div>
                        <div className="glass rounded-lg px-3 py-2 text-sm text-primary">{p.q.correct_answer}</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild variant="divine" size="lg" className="flex-1"><Link to="/candidate/learn">Back to Lessons <ArrowRight className="w-4 h-4" /></Link></Button>
          {!submitted.passed && (
            <Button variant="glass" size="lg" onClick={() => window.location.reload()}>Retake</Button>
          )}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
        This test has no questions yet. Check back later.
      </div>
    );
  }

  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  const pctTime = (seconds / (test.duration_minutes * 60)) * 100;
  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;
  const answerPct = (answeredCount / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-strong rounded-2xl p-6 sticky top-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-2xl gold-text">{test.title}</h2>
          <div className={cn("flex items-center gap-2 font-mono text-lg",
            seconds < 60 ? "text-destructive animate-pulse" : "text-primary")}>
            <Clock className="w-5 h-5" /> {m}:{s}
          </div>
        </div>
        <Progress value={pctTime} className="h-1.5 mb-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Pass mark: {test.pass_percentage}%</span>
          <span>Answered: {answeredCount}/{questions.length} ({Math.round(answerPct)}%)</span>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="glass-strong rounded-2xl p-6">
            <div className="text-xs uppercase tracking-widest text-primary mb-2">Question {i + 1} • {q.points} pt</div>
            <p className="font-medium text-lg mb-4">{q.question_text}</p>
            {q.q_type === "mcq" ? (
              <RadioGroup value={answers[q.id] ?? ""} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
                {(q.options as string[]).map((o, j) => (
                  <div key={j} className="flex items-center gap-3 glass rounded-xl p-3 hover:bg-white/5 cursor-pointer">
                    <RadioGroupItem value={o} id={`${q.id}-${j}`} />
                    <Label htmlFor={`${q.id}-${j}`} className="flex-1 cursor-pointer">{o}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Input
                placeholder="Your answer…"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                className="glass"
              />
            )}
          </div>
        ))}
      </div>

      <Button variant="divine" size="lg" className="w-full" onClick={() => submit(false)} disabled={busy}>
        {busy ? "Submitting…" : "Submit Test"}
      </Button>
    </div>
  );
};
