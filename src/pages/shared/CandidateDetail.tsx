import { useEffect, useState, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { ArrowLeft, BookOpen, Trophy, TrendingUp, Flame, Clock, CheckCircle2, XCircle, Send, MessageSquare, Eye, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export const CandidateDetail = () => {
  const { candidateId } = useParams();
  const loc = useLocation();
  const { user } = useAuth();
  const backTo = loc.pathname.startsWith("/admin") ? "/admin/candidates" : "/tutor/candidates";

  const [profile, setProfile] = useState<any>(null);
  const [levels, setLevels] = useState<string[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [reviewAttempt, setReviewAttempt] = useState<any>(null);
  const [reviewQuestions, setReviewQuestions] = useState<any[]>([]);

  // messaging
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadAll = async () => {
    if (!candidateId) return;
    const [{ data: prof }, { data: lvls }, { data: prog }, { data: lessonsAll }, { data: atts }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", candidateId).maybeSingle(),
      supabase.from("candidate_levels").select("level, unlocked_at").eq("candidate_id", candidateId).eq("unlocked", true),
      supabase.from("lesson_progress").select("*, lessons(title, course_id, courses(title, level))").eq("candidate_id", candidateId).eq("is_completed", true),
      supabase.from("lessons").select("id"),
      supabase.from("test_attempts").select("*, tests(title, lesson_id, lessons(title, courses(level, title)))").eq("candidate_id", candidateId).order("submitted_at", { ascending: false }),
    ]);
    setProfile(prof);
    setLevels(lvls?.map((l) => l.level) ?? []);
    setCompleted(prog ?? []);
    setTotalLessons(lessonsAll?.length ?? 0);
    setAttempts(atts ?? []);
  };

  const loadMsgs = async () => {
    if (!candidateId || !user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${candidateId}),and(sender_id.eq.${candidateId},recipient_id.eq.${user.id})`)
      .order("created_at");
    setMsgs(data ?? []);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  useEffect(() => {
    loadAll();
    loadMsgs();
  }, [candidateId, user?.id]);

  useEffect(() => {
    if (!candidateId || !user) return;
    const ch = supabase
      .channel(`detail-msg-${candidateId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload: any) => {
        const m = payload.new;
        if (
          (m.sender_id === user.id && m.recipient_id === candidateId) ||
          (m.sender_id === candidateId && m.recipient_id === user.id)
        ) {
          setMsgs((arr) => [...arr, m]);
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [candidateId, user?.id]);

  const send = async () => {
    if (!text.trim() || !candidateId || !user) return;
    const body = text.trim();
    setText("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: user.id, recipient_id: candidateId, body })
      .select()
      .single();
    if (error) {
      toast({ title: "Send failed", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      setMsgs((arr) => arr.some((m) => m.id === data.id) ? arr : [...arr, data]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const openReview = async (attempt: any) => {
    setReviewAttempt(attempt);
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("test_id", attempt.test_id)
      .order("order_index");
    setReviewQuestions(data ?? []);
  };

  const passed = attempts.filter((a) => a.status === "passed");
  const failed = attempts.filter((a) => a.status === "failed");
  const submitted = attempts.filter((a) => a.submitted_at);
  const avg = submitted.length ? Math.round(submitted.reduce((s, a) => s + Number(a.percentage), 0) / submitted.length) : 0;
  const completionPct = totalLessons ? Math.round((completed.length / totalLessons) * 100) : 0;
  const currentLevel = levels.includes("senior") ? "senior" : levels.includes("intermediate") ? "intermediate" : "basic";

  const fmtDuration = (start?: string, end?: string) => {
    if (!start || !end) return "—";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  };

  const durationSec = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  };

  // chart data — chronological scores
  const scoreOverTime = [...submitted].reverse().map((a, i) => ({
    label: a.submitted_at ? new Date(a.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : `#${i + 1}`,
    score: Number(a.percentage),
    pass: 25,
  }));

  // speed per attempt (seconds), color by pass/fail
  const speedData = submitted.slice(0, 10).reverse().map((a) => ({
    title: (a.tests?.title ?? "Test").slice(0, 14),
    seconds: durationSec(a.started_at, a.submitted_at),
    status: a.status,
  }));

  if (!profile) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <Button asChild variant="glass" size="sm"><Link to={backTo}><ArrowLeft className="w-4 h-4" /> Back</Link></Button>

      <div className="glass-strong rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-serif text-3xl gold-text">
            {(profile.full_name || profile.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-[200px]">
            <h2 className="font-serif text-3xl">{profile.full_name || "Anonymous"}</h2>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
            {profile.phone && <p className="text-muted-foreground text-xs mt-1">{profile.phone}</p>}
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary capitalize text-sm px-4 py-1">
            {currentLevel} level
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Lessons Done" value={`${completed.length}/${totalLessons}`} icon={BookOpen} />
        <StatCard label="Tests Passed" value={passed.length} icon={Trophy} />
        <StatCard label="Tests Failed" value={failed.length} icon={XCircle} />
        <StatCard label="Avg Score" value={`${avg}%`} icon={TrendingUp} />
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="glass-strong">
          <TabsTrigger value="analytics"><TrendingUp className="w-4 h-4 mr-2" /> Analytics</TabsTrigger>
          <TabsTrigger value="tests"><Trophy className="w-4 h-4 mr-2" /> Test Results</TabsTrigger>
          <TabsTrigger value="lessons"><BookOpen className="w-4 h-4 mr-2" /> Lessons</TabsTrigger>
          <TabsTrigger value="messages"><MessageSquare className="w-4 h-4 mr-2" /> Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6 mt-4">
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-2xl gold-text flex items-center gap-2"><Flame className="w-5 h-5" /> Journey Progress</h3>
              <span className="text-sm text-primary font-mono">{completionPct}%</span>
            </div>
            <Progress value={completionPct} className="h-3" />
            <div className="flex gap-2 mt-4 flex-wrap">
              {(["basic", "intermediate", "senior"] as const).map((l) => (
                <Badge key={l} variant="outline" className={levels.includes(l)
                  ? "border-primary/40 text-primary capitalize"
                  : "border-border text-muted-foreground capitalize opacity-50"}>
                  {levels.includes(l) ? "✓ " : "🔒 "}{l}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="font-serif text-xl mb-4 gold-text">Score Over Time</h3>
              {scoreOverTime.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">No submitted attempts yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={scoreOverTime}>
                    <CartesianGrid stroke="hsl(45 10% 25%)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="hsl(45 10% 70%)" fontSize={11} />
                    <YAxis stroke="hsl(45 10% 70%)" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(42 30% 25%)", borderRadius: 12 }} />
                    <Line type="monotone" dataKey="pass" stroke="hsl(0 70% 55%)" strokeDasharray="4 4" dot={false} name="Pass line" />
                    <Line type="monotone" dataKey="score" stroke="hsl(42 65% 55%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(45 90% 70%)" }} name="Score %" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="glass-strong rounded-2xl p-6">
              <h3 className="font-serif text-xl mb-4 gold-text flex items-center gap-2"><Zap className="w-5 h-5" /> Test Speed (s)</h3>
              {speedData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={speedData}>
                    <CartesianGrid stroke="hsl(45 10% 25%)" strokeDasharray="3 3" />
                    <XAxis dataKey="title" stroke="hsl(45 10% 70%)" fontSize={10} />
                    <YAxis stroke="hsl(45 10% 70%)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(42 30% 25%)", borderRadius: 12 }} />
                    <Bar dataKey="seconds" radius={[8, 8, 0, 0]}>
                      {speedData.map((d, i) => (
                        <Cell key={i} fill={d.status === "passed" ? "hsl(42 65% 55%)" : "hsl(0 70% 55%)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="mt-4">
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border/40">
              <h3 className="font-serif text-xl gold-text">Test Attempts</h3>
              <p className="text-xs text-muted-foreground">Click "Review" to see exactly which questions were answered wrong.</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead>Test</TableHead>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead><Clock className="w-3.5 h-3.5 inline mr-1" />Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No attempts yet.</TableCell></TableRow>
                ) : attempts.map((a) => (
                  <TableRow key={a.id} className="border-border/40">
                    <TableCell className="font-medium">{a.tests?.title ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{a.tests?.lessons?.title ?? "—"}</TableCell>
                    <TableCell className="font-mono">
                      <span className={a.status === "passed" ? "text-primary" : "text-destructive"}>{a.percentage}%</span>
                      <span className="text-xs text-muted-foreground ml-1">({a.score}/{a.total})</span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{fmtDuration(a.started_at, a.submitted_at)}</TableCell>
                    <TableCell>
                      {a.status === "passed" ? (
                        <Badge variant="outline" className="border-primary/40 text-primary"><CheckCircle2 className="w-3 h-3 mr-1" /> Passed</Badge>
                      ) : a.status === "failed" ? (
                        <Badge variant="outline" className="border-destructive/40 text-destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>
                      ) : (
                        <Badge variant="outline" className="border-border text-muted-foreground">In progress</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{a.submitted_at ? new Date(a.submitted_at).toLocaleString() : "—"}</TableCell>
                    <TableCell>
                      {a.submitted_at && (
                        <Button size="sm" variant="ghost" onClick={() => openReview(a)}>
                          <Eye className="w-4 h-4 mr-1" /> Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="lessons" className="mt-4">
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border/40">
              <h3 className="font-serif text-xl gold-text">Lessons Completed</h3>
            </div>
            {completed.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground text-sm">No lessons completed yet.</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {completed.map((c) => (
                  <li key={c.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.lessons?.title ?? "—"}</div>
                      <div className="text-xs text-muted-foreground capitalize">{c.lessons?.courses?.title} • {c.lessons?.courses?.level}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.completed_at ? new Date(c.completed_at).toLocaleDateString() : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <div className="glass-strong rounded-2xl overflow-hidden flex flex-col h-[60vh]">
            <div className="p-4 border-b border-border/40">
              <div className="font-serif text-lg">Conversation with {profile.full_name || profile.email}</div>
              <p className="text-xs text-muted-foreground">Messages are real-time and private.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {msgs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No messages yet — say hello.</div>
              ) : msgs.map((m) => (
                <div key={m.id} className={cn("flex", m.sender_id === user?.id ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-md px-4 py-2 rounded-2xl text-sm",
                    m.sender_id === user?.id ? "bg-primary/20 border border-primary/30" : "glass")}>
                    {m.body}
                    <div className="text-[10px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t border-border/40 flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" className="glass" />
              <Button variant="divine" size="icon" onClick={send}><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!reviewAttempt} onOpenChange={(o) => !o && setReviewAttempt(null)}>
        <DialogContent className="glass-strong max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif gold-text">
              {reviewAttempt?.tests?.title} — {reviewAttempt?.percentage}%
            </DialogTitle>
          </DialogHeader>
          {reviewAttempt && (
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap text-sm">
                <Badge variant="outline" className="border-primary/30">Score: {reviewAttempt.score}/{reviewAttempt.total}</Badge>
                <Badge variant="outline" className="border-primary/30">Time: {fmtDuration(reviewAttempt.started_at, reviewAttempt.submitted_at)}</Badge>
                <Badge variant="outline" className={reviewAttempt.status === "passed" ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}>
                  {reviewAttempt.status}
                </Badge>
              </div>
              {reviewQuestions.map((q, i) => {
                const userAns = (reviewAttempt.answers as any)?.[q.id] ?? "";
                const correct = String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
                return (
                  <div key={q.id} className={cn("rounded-xl p-4 border",
                    correct ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5")}>
                    <div className="flex items-start gap-2 mb-2">
                      {correct ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />}
                      <div className="font-medium text-sm">Q{i + 1}. {q.question_text}</div>
                    </div>
                    <div className="ml-7 space-y-1 text-xs">
                      <div>
                        <span className="text-muted-foreground">Their answer: </span>
                        <span className={correct ? "text-primary" : "text-destructive"}>{userAns || <em>(blank)</em>}</span>
                      </div>
                      {!correct && (
                        <div>
                          <span className="text-muted-foreground">Correct answer: </span>
                          <span className="text-primary">{q.correct_answer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
