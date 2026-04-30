import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, ChevronRight, Eye } from "lucide-react";

type Level = "basic" | "intermediate" | "senior";
const LEVELS: Level[] = ["basic", "intermediate", "senior"];

export const TutorLessons = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [active, setActive] = useState<Level>("basic");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("*, lessons(id, title, order_index, description)")
        .order("level");
      data?.forEach((c: any) => c.lessons?.sort((a: any, b: any) => a.order_index - b.order_index));
      setCourses(data ?? []);
    })();
  }, []);

  const renderLevel = (level: Level) => {
    const filtered = courses.filter((c) => c.level === level);
    if (filtered.length === 0) {
      return (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground capitalize">
          No {level} courses available.
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {filtered.map((c) => (
          <div key={c.id} className="glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl">{c.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{c.lessons?.length ?? 0} lesson(s)</span>
            </div>
            <div className="space-y-2">
              {c.lessons?.map((l: any, i: number) => (
                <Link
                  key={l.id}
                  to={`/tutor/lessons/${l.id}`}
                  className="glass rounded-xl p-3 flex items-center justify-between hover:divine-glow-soft transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                      {i + 1}
                    </div>
                    <span className="font-medium">{l.title}</span>
                  </div>
                  <Eye className="w-4 h-4 text-primary" />
                </Link>
              ))}
              {(!c.lessons || c.lessons.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">No lessons yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Browse the curriculum. Content is curated by Admin — you have read-only access to guide your candidates.
      </p>
      <Tabs value={active} onValueChange={(v) => setActive(v as Level)}>
        <TabsList className="glass">
          {LEVELS.map((l) => (
            <TabsTrigger key={l} value={l} className="capitalize">{l}</TabsTrigger>
          ))}
        </TabsList>
        {LEVELS.map((l) => (
          <TabsContent key={l} value={l} className="mt-6">{renderLevel(l)}</TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
