import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Presentation, Youtube } from "lucide-react";

const ytEmbed = (url: string) => {
  const m = url.match(/(?:youtu\.be\/|v=)([^&?]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
};

export const TutorLessonView = () => {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      const { data: l } = await supabase.from("lessons").select("*").eq("id", lessonId).single();
      setLesson(l);
      const { data: r } = await supabase.from("lesson_resources").select("*").eq("lesson_id", lessonId).order("order_index");
      setResources(r ?? []);
      const { data: t } = await supabase.from("tests").select("*").eq("lesson_id", lessonId);
      setTests(t ?? []);
    })();
  }, [lessonId]);

  if (!lesson) return <div className="text-muted-foreground">Loading…</div>;

  const yt = resources.filter((r) => r.kind === "youtube");
  const pdfs = resources.filter((r) => r.kind === "pdf");
  const ppts = resources.filter((r) => r.kind === "ppt");

  return (
    <div className="space-y-6">
      <Button asChild variant="glass" size="sm">
        <Link to="/tutor/lessons"><ArrowLeft className="w-4 h-4" /> Back</Link>
      </Button>

      <div className="glass-strong rounded-2xl p-6 md:p-8">
        <div className="text-xs uppercase tracking-widest text-primary mb-2">Read-only • Tutor</div>
        <h2 className="font-serif text-3xl gold-text mb-2">{lesson.title}</h2>
        <p className="text-muted-foreground">{lesson.description}</p>
      </div>

      {lesson.text_content && (
        <div className="glass rounded-2xl p-6">
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
            <a href={r.url} target="_blank" rel="noreferrer" className="ml-auto text-xs text-primary underline">Open</a>
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

      {tests.length > 0 && (
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="font-serif text-xl gold-text mb-3">Tests in this Lesson</h3>
          <div className="space-y-2">
            {tests.map((t) => (
              <div key={t.id} className="glass rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.duration_minutes} min • Pass ≥ {t.pass_percentage}%</div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">view-only</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
