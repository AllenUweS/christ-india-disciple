import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { Users, BookOpen, Trophy, FileText } from "lucide-react";

export const TutorOverview = () => {
  const [s, setS] = useState({ candidates: 0, lessons: 0, tests: 0, passed: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: c1 }, { count: c2 }, { count: c3 }, { count: c4 }] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "candidate"),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("tests").select("*", { count: "exact", head: true }),
        supabase.from("test_attempts").select("*", { count: "exact", head: true }).eq("status", "passed"),
      ]);
      setS({ candidates: c1 ?? 0, lessons: c2 ?? 0, tests: c3 ?? 0, passed: c4 ?? 0 });
    })();
  }, []);

  return (
    <div className="space-y-8">
      <WelcomeBanner role="tutor" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Candidates" value={s.candidates} icon={Users} />
        <StatCard label="Lessons" value={s.lessons} icon={BookOpen} />
        <StatCard label="Tests" value={s.tests} icon={FileText} />
        <StatCard label="Passes" value={s.passed} icon={Trophy} />
      </div>
      <div className="glass rounded-2xl p-6">
        <p className="text-muted-foreground max-w-xl">
          Upload lessons (PDFs, PowerPoints, YouTube videos), craft tests, monitor progress, and walk beside your candidates on the divine path.
        </p>
      </div>
    </div>
  );
};
