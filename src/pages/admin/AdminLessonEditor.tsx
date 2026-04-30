import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Trash2, Plus, FileText, Presentation, Youtube } from "lucide-react";

type ResKind = "pdf" | "ppt" | "youtube";

export const AdminLessonEditor = () => {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [uploading, setUploading] = useState<ResKind | null>(null);

  const [ytForm, setYtForm] = useState({ title: "", url: "" });
  const [testOpen, setTestOpen] = useState(false);
  const [qOpen, setQOpen] = useState(false);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  const [tForm, setTForm] = useState({ title: "", duration_minutes: 15, pass_percentage: 25 });
  const [qForm, setQForm] = useState<{
    question_text: string; q_type: "mcq" | "fib"; options: string[]; correct_answer: string; points: number;
  }>({ question_text: "", q_type: "mcq", options: ["", "", "", ""], correct_answer: "", points: 1 });

  const load = async () => {
    const { data: l } = await supabase.from("lessons").select("*").eq("id", lessonId!).single();
    setLesson(l);
    const { data: r } = await supabase.from("lesson_resources").select("*").eq("lesson_id", lessonId!).order("order_index");
    setResources(r ?? []);
    const { data: t } = await supabase.from("tests").select("*").eq("lesson_id", lessonId!);
    setTests(t ?? []);
  };

  useEffect(() => { load(); }, [lessonId]);

  const save = async () => {
    const { error } = await supabase.from("lessons").update({
      title: lesson.title,
      description: lesson.description,
      text_content: lesson.text_content,
      order_index: lesson.order_index,
    }).eq("id", lessonId!);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Saved" });
  };

  const uploadFile = async (kind: "pdf" | "ppt", file: File) => {
    setUploading(kind);
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("lesson-files").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(null);
      return;
    }
    const { data } = supabase.storage.from("lesson-files").getPublicUrl(path);
    const { error: insErr } = await supabase.from("lesson_resources").insert({
      lesson_id: lessonId!,
      kind,
      title: file.name,
      url: data.publicUrl,
      order_index: resources.length,
      created_by: user!.id,
    });
    if (insErr) toast({ title: "Save failed", description: insErr.message, variant: "destructive" });
    else { toast({ title: "Uploaded ✨" }); load(); }
    setUploading(null);
  };

  const addYoutube = async () => {
    if (!ytForm.url) return toast({ title: "URL required", variant: "destructive" });
    const { error } = await supabase.from("lesson_resources").insert({
      lesson_id: lessonId!,
      kind: "youtube",
      title: ytForm.title || "Video",
      url: ytForm.url,
      order_index: resources.length,
      created_by: user!.id,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { setYtForm({ title: "", url: "" }); load(); }
  };

  const removeRes = async (id: string) => {
    if (!confirm("Remove this resource?")) return;
    await supabase.from("lesson_resources").delete().eq("id", id);
    load();
  };

  const createTest = async () => {
    const { error } = await supabase
      .from("tests")
      .insert({ lesson_id: lessonId!, title: tForm.title, duration_minutes: tForm.duration_minutes, pass_percentage: tForm.pass_percentage });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else {
      setTestOpen(false);
      setTForm({ title: "", duration_minutes: 15, pass_percentage: 25 });
      load();
    }
  };

  const openQuestions = async (t: any) => {
    setActiveTest(t);
    const { data } = await supabase.from("questions").select("*").eq("test_id", t.id).order("order_index");
    setQuestions(data ?? []);
    setQOpen(true);
  };

  const addQuestion = async () => {
    if (!activeTest) return;
    const payload: any = {
      test_id: activeTest.id,
      question_text: qForm.question_text,
      q_type: qForm.q_type,
      correct_answer: qForm.correct_answer,
      points: qForm.points,
      order_index: questions.length,
    };
    if (qForm.q_type === "mcq") payload.options = qForm.options.filter(Boolean);
    const { error } = await supabase.from("questions").insert(payload);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else {
      setQForm({ question_text: "", q_type: "mcq", options: ["", "", "", ""], correct_answer: "", points: 1 });
      const { data } = await supabase.from("questions").select("*").eq("test_id", activeTest.id).order("order_index");
      setQuestions(data ?? []);
    }
  };

  const delQuestion = async (id: string) => {
    await supabase.from("questions").delete().eq("id", id);
    const { data } = await supabase.from("questions").select("*").eq("test_id", activeTest.id).order("order_index");
    setQuestions(data ?? []);
  };

  const delTest = async (id: string) => {
    if (!confirm("Delete test?")) return;
    await supabase.from("tests").delete().eq("id", id);
    load();
  };

  if (!lesson) return <div className="text-muted-foreground">Loading…</div>;

  const iconFor = (k: ResKind) => k === "pdf" ? FileText : k === "ppt" ? Presentation : Youtube;

  return (
    <div className="space-y-6">
      <Button asChild variant="glass" size="sm">
        <Link to={`/admin/courses/${lesson.course_id}/lessons`}><ArrowLeft className="w-4 h-4" /> Back</Link>
      </Button>

      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <h2 className="font-serif text-2xl gold-text">Lesson Content</h2>
        <div>
          <Label>Title</Label>
          <Input value={lesson.title} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} className="glass mt-1.5" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={lesson.description ?? ""} onChange={(e) => setLesson({ ...lesson, description: e.target.value })} className="glass mt-1.5" />
        </div>
        <div>
          <Label>Text Lesson Content</Label>
          <Textarea rows={6} value={lesson.text_content ?? ""} onChange={(e) => setLesson({ ...lesson, text_content: e.target.value })} className="glass mt-1.5" />
        </div>
        <Button variant="divine" onClick={save}>Save Lesson</Button>
      </div>

      {/* Resources */}
      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <h2 className="font-serif text-2xl gold-text">Resources</h2>
        <p className="text-sm text-muted-foreground">Add multiple PDFs, PPTs, and YouTube videos. Candidates will see all of them.</p>

        <div className="grid md:grid-cols-3 gap-3">
          <label className="cursor-pointer glass rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:divine-glow-soft transition-all border border-primary/20">
            <input type="file" accept="application/pdf" hidden multiple onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              for (const f of files) await uploadFile("pdf", f);
              e.target.value = "";
            }} />
            <FileText className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium">{uploading === "pdf" ? "Uploading…" : "Upload PDFs"}</span>
            <span className="text-[10px] text-muted-foreground">Multiple allowed</span>
          </label>

          <label className="cursor-pointer glass rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:divine-glow-soft transition-all border border-primary/20">
            <input type="file" accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" hidden multiple onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              for (const f of files) await uploadFile("ppt", f);
              e.target.value = "";
            }} />
            <Presentation className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium">{uploading === "ppt" ? "Uploading…" : "Upload PPTs"}</span>
            <span className="text-[10px] text-muted-foreground">Multiple allowed</span>
          </label>

          <div className="glass rounded-xl p-4 space-y-2 border border-primary/20">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Add YouTube</span>
            </div>
            <Input value={ytForm.title} onChange={(e) => setYtForm({ ...ytForm, title: e.target.value })} placeholder="Title (optional)" className="glass h-8 text-sm" />
            <Input value={ytForm.url} onChange={(e) => setYtForm({ ...ytForm, url: e.target.value })} placeholder="https://youtube.com/…" className="glass h-8 text-sm" />
            <Button size="sm" variant="divine" className="w-full" onClick={addYoutube}><Plus className="w-3.5 h-3.5" /> Add</Button>
          </div>
        </div>

        <div className="space-y-2">
          {resources.map((r) => {
            const Icon = iconFor(r.kind);
            return (
              <div key={r.id} className="glass rounded-xl p-3 flex items-center gap-3">
                <Icon className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.title || r.url}</div>
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary truncate block">{r.url}</a>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.kind}</span>
                <Button size="icon" variant="ghost" onClick={() => removeRes(r.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            );
          })}
          {resources.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No resources yet.</p>}
        </div>
      </div>

      {/* Tests */}
      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-2xl gold-text">Tests for this Lesson</h2>
          <Dialog open={testOpen} onOpenChange={setTestOpen}>
            <DialogTrigger asChild><Button variant="divine" size="sm"><Plus className="w-4 h-4" /> New Test</Button></DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader><DialogTitle className="font-serif gold-text">New Test</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={tForm.title} onChange={(e) => setTForm({ ...tForm, title: e.target.value })} className="glass mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Duration (min)</Label>
                    <Input type="number" value={tForm.duration_minutes} onChange={(e) => setTForm({ ...tForm, duration_minutes: +e.target.value })} className="glass mt-1.5" />
                  </div>
                  <div>
                    <Label>Pass %</Label>
                    <Input type="number" value={tForm.pass_percentage} onChange={(e) => setTForm({ ...tForm, pass_percentage: +e.target.value })} className="glass mt-1.5" />
                  </div>
                </div>
                <Button variant="divine" onClick={createTest} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {tests.length === 0 && <p className="text-sm text-muted-foreground">No tests yet.</p>}
        {tests.map((t) => (
          <div key={t.id} className="glass rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.duration_minutes} min • Pass ≥ {t.pass_percentage}%</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="glass" onClick={() => openQuestions(t)}>Questions</Button>
              <Button size="icon" variant="ghost" onClick={() => delTest(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={qOpen} onOpenChange={setQOpen}>
        <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif gold-text">Questions — {activeTest?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={q.id} className="glass rounded-xl p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-primary uppercase tracking-widest">{q.q_type} • {q.points} pt</div>
                      <div className="font-medium">{i + 1}. {q.question_text}</div>
                      {q.q_type === "mcq" && (
                        <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                          {(q.options as string[]).map((o, j) => (
                            <li key={j} className={o === q.correct_answer ? "text-primary" : ""}>• {o}</li>
                          ))}
                        </ul>
                      )}
                      {q.q_type === "fib" && <div className="text-sm text-primary mt-1">Answer: {q.correct_answer}</div>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => delQuestion(q.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/40 pt-4 space-y-3">
              <h4 className="font-serif text-lg">Add Question</h4>
              <Select value={qForm.q_type} onValueChange={(v) => setQForm({ ...qForm, q_type: v as any })}>
                <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="fib">Fill in the Blanks</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Question text" value={qForm.question_text} onChange={(e) => setQForm({ ...qForm, question_text: e.target.value })} className="glass" />
              {qForm.q_type === "mcq" ? (
                <div className="space-y-2">
                  {qForm.options.map((o, i) => (
                    <Input key={i} placeholder={`Option ${i + 1}`} value={o} onChange={(e) => {
                      const opts = [...qForm.options];
                      opts[i] = e.target.value;
                      setQForm({ ...qForm, options: opts });
                    }} className="glass" />
                  ))}
                  <Select value={qForm.correct_answer} onValueChange={(v) => setQForm({ ...qForm, correct_answer: v })}>
                    <SelectTrigger className="glass"><SelectValue placeholder="Correct option" /></SelectTrigger>
                    <SelectContent>
                      {qForm.options.filter(Boolean).map((o, i) => <SelectItem key={i} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Input placeholder="Correct answer" value={qForm.correct_answer} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })} className="glass" />
              )}
              <Input type="number" placeholder="Points" value={qForm.points} onChange={(e) => setQForm({ ...qForm, points: +e.target.value })} className="glass" />
              <Button variant="divine" onClick={addQuestion} className="w-full">Add Question</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
