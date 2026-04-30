import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Presentation, Youtube, Check, ArrowRight } from "lucide-react";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { PlanLocked } from "@/components/PlanLocked";

const ytEmbed = (url: string) => {
  const m = url.match(/(?:youtu\.be\/|v=)([^&?]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
};

export const LessonViewer = () => {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);

  const { hasLevel, canAccessLesson, loading: planLoading } = usePlanAccess();
  const lessonLevel = lesson?.course?.level as "basic" | "intermediate" | "senior" | undefined;
  const courseId = lesson?.course_id as string | undefined;
  const accessible =
    lessonLevel && lessonId
      ? hasLevel(lessonLevel) || (courseId ? canAccessLesson(lessonId, courseId, lessonLevel) : false)
      : true;

  useEffect(() => {
    if (!user || !lessonId) return;
    (async () => {
      const { data: l } = await supabase.from("lessons").select("*, course:courses(level)").eq("id", lessonId).single();
      setLesson(l);
      const { data: r } = await supabase.from("lesson_resources").select("*").eq("lesson_id", lessonId).order("order_index");
      setResources(r ?? []);
      const { data: t } = await supabase.from("tests").select("*").eq("lesson_id", lessonId);
      setTests(t ?? []);
      const { data: p } = await supabase.from("lesson_progress").select("*").eq("candidate_id", user.id).eq("lesson_id", lessonId).maybeSingle();
      setCompleted(!!p?.is_completed);
    })();
  }, [user, lessonId]);

  const markDone = async () => {
    await supabase
      .from("lesson_progress")
      .upsert({ candidate_id: user!.id, lesson_id: lessonId!, is_completed: true, completed_at: new Date().toISOString() }, { onConflict: "candidate_id,lesson_id" });
    setCompleted(true);
    toast({ title: "Lesson completed ✨", description: tests.length > 0 ? "Now take the test!" : "On to the next lesson." });
  };

  if (!lesson) return <div className="text-muted-foreground">Loading…</div>;

  if (!planLoading && lessonLevel && !accessible) {
    return (
      <div className="space-y-6">
        <Button variant="glass" size="sm" onClick={() => nav(-1)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <PlanLocked level={lessonLevel} />
      </div>
    );
  }

  // Combine legacy single-field URLs with new resources for back-compat
  const legacy: any[] = [];
  if (lesson.youtube_url) legacy.push({ id: "legacy-yt", kind: "youtube", url: lesson.youtube_url, title: "Video" });
  if (lesson.pdf_url) legacy.push({ id: "legacy-pdf", kind: "pdf", url: lesson.pdf_url, title: "PDF" });
  if (lesson.ppt_url) legacy.push({ id: "legacy-ppt", kind: "ppt", url: lesson.ppt_url, title: "Slides" });
  const all = [...resources, ...legacy];

  const yt = all.filter((r) => r.kind === "youtube");
  const pdfs = all.filter((r) => r.kind === "pdf");
  const ppts = all.filter((r) => r.kind === "ppt");

  return (
    <div className="space-y-6">
      <Button variant="glass" size="sm" onClick={() => nav(-1)}>
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div className="glass-strong rounded-2xl p-6 md:p-8">
        <h2 className="font-serif text-3xl gold-text mb-2">{lesson.title}</h2>
        <p className="text-muted-foreground">{lesson.description}</p>
      </div>

      {lesson.text_content && (
        <div className="glass rounded-2xl p-6 prose prose-invert max-w-none">
          <h3 className="font-serif text-xl gold-text mb-3">Lesson Notes</h3>
          <p className="whitespace-pre-wrap text-muted-foreground">{lesson.text_content}</p>
        </div>
      )}

      {yt.map((r) => (
        <div key={r.id} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Youtube className="w-5 h-5 text-primary" />
            <h3 className="font-serif text-lg">{r.title || "Video"}</h3>
          </div>
          <div className="aspect-video rounded-xl overflow-hidden">
            <iframe src={ytEmbed(r.url)} className="w-full h-full" allowFullScreen title={r.title || "Video"} />
          </div>
        </div>
      ))}

      {pdfs.map((r) => (
        <div key={r.id} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-serif text-lg">{r.title || "PDF"}</h3>
            <a href={r.url} target="_blank" rel="noreferrer" className="ml-auto text-xs text-primary underline">Open in new tab</a>
          </div>
          <iframe src={r.url} className="w-full h-[600px] rounded-xl bg-black/20" title={r.title || "PDF"} />
        </div>
      ))}

      {ppts.map((r) => (
        <div key={r.id} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Presentation className="w-5 h-5 text-primary" />
            <h3 className="font-serif text-lg">{r.title || "Slides"}</h3>
            <a href={r.url} target="_blank" rel="noreferrer" className="ml-auto text-xs text-primary underline">Download</a>
          </div>
          <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(r.url)}&embedded=true`} className="w-full h-[600px] rounded-xl bg-black/20" title={r.title || "Slides"} />
        </div>
      ))}

      <div className="glass-strong rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl mb-1">{completed ? "✓ Lesson Completed" : "Mark this lesson complete"}</h3>
          <p className="text-sm text-muted-foreground">
            {completed
              ? tests.length > 0 ? "Now take the test below to advance." : "On to the next lesson."
              : "When you've studied the materials above, mark it complete to unlock the test."}
          </p>
        </div>
        {!completed && (
          <Button variant="divine" size="lg" onClick={markDone}><Check className="w-4 h-4" /> Mark Complete</Button>
        )}
      </div>

      {tests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif text-2xl gold-text">{completed ? "Take the Test" : "Test (locked)"}</h3>
          {tests.map((t) => (
            <div key={t.id} className={`glass-strong rounded-2xl p-5 flex items-center justify-between gap-4 ${completed ? "divine-glow-soft" : "opacity-60"}`}>
              <div>
                <div className="font-serif text-lg">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.duration_minutes} min • Pass ≥ {t.pass_percentage}%</div>
              </div>
              {completed ? (
                <Button asChild variant="divine" size="lg">
                  <Link to={`/candidate/learn/test/${t.id}`}>Take Test <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              ) : (
                <Button variant="divine" size="lg" disabled>Locked</Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
