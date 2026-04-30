import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { Users, GraduationCap, BookOpen, Trophy } from "lucide-react";

export const AdminOverview = () => {
  const [stats, setStats] = useState({ candidates: 0, tutors: 0, courses: 0, passed: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: c1 }, { count: c2 }, { count: c3 }, { count: c4 }] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "candidate"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "tutor"),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("test_attempts").select("*", { count: "exact", head: true }).eq("status", "passed"),
      ]);
      setStats({ candidates: c1 ?? 0, tutors: c2 ?? 0, courses: c3 ?? 0, passed: c4 ?? 0 });
    })();
  }, []);

  return (
    <div className="space-y-8">
      <WelcomeBanner role="admin" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Candidates" value={stats.candidates} icon={GraduationCap} trend="↗ live" />
        <StatCard label="Tutors" value={stats.tutors} icon={Users} />
        <StatCard label="Courses" value={stats.courses} icon={BookOpen} />
        <StatCard label="Tests Passed" value={stats.passed} icon={Trophy} trend="↗ all-time" />
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-serif text-xl mb-3 gold-text">Quick Actions</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Add a tutor under <span className="text-primary">Tutors</span></li>
          <li>• Promote candidates to higher levels</li>
          <li>• Review analytics for engagement</li>
          <li>• Curate courses & lessons</li>
        </ul>
      </div>
    </div>
  );
};
