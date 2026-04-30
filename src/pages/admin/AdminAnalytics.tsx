import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { StatCard } from "@/components/StatCard";
import { Activity, Trophy, XCircle, BookOpen } from "lucide-react";

const COLORS = ["hsl(42 65% 55%)", "hsl(45 90% 70%)", "hsl(42 30% 40%)"];

export const AdminAnalytics = () => {
  const [signups, setSignups] = useState<{ date: string; count: number }[]>([]);
  const [byLevel, setByLevel] = useState<{ name: string; value: number }[]>([]);
  const [attempts, setAttempts] = useState({ passed: 0, failed: 0, in_progress: 0 });
  const [topCourses, setTopCourses] = useState<{ title: string; lessons: number }[]>([]);

  useEffect(() => {
    (async () => {
      // signups last 14 days
      const since = new Date(Date.now() - 14 * 86400000).toISOString();
      const { data: profs } = await supabase.from("profiles").select("created_at").gte("created_at", since);
      const buckets: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        buckets[d] = 0;
      }
      profs?.forEach((p) => {
        const d = p.created_at.slice(0, 10);
        if (d in buckets) buckets[d]++;
      });
      setSignups(Object.entries(buckets).map(([date, count]) => ({ date: date.slice(5), count })));

      // levels distribution
      const { data: levels } = await supabase.from("candidate_levels").select("level").eq("unlocked", true);
      const lc: Record<string, number> = { basic: 0, intermediate: 0, senior: 0 };
      levels?.forEach((l) => { lc[l.level] = (lc[l.level] || 0) + 1; });
      setByLevel(Object.entries(lc).map(([name, value]) => ({ name, value })));

      // attempts
      const { data: atts } = await supabase.from("test_attempts").select("status");
      const ac = { passed: 0, failed: 0, in_progress: 0 };
      atts?.forEach((a) => { (ac as any)[a.status]++; });
      setAttempts(ac);

      // top courses by lesson count
      const { data: courses } = await supabase.from("courses").select("title, lessons(count)").limit(6);
      setTopCourses((courses ?? []).map((c: any) => ({ title: c.title, lessons: c.lessons?.[0]?.count ?? 0 })));
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tests Passed" value={attempts.passed} icon={Trophy} />
        <StatCard label="Tests Failed" value={attempts.failed} icon={XCircle} />
        <StatCard label="In Progress" value={attempts.in_progress} icon={Activity} />
        <StatCard label="Total Courses" value={topCourses.length} icon={BookOpen} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4 gold-text">Active Signups (14d)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={signups}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(45 90% 70%)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="hsl(45 90% 70%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="hsl(45 10% 70%)" fontSize={11} />
              <YAxis stroke="hsl(45 10% 70%)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(42 30% 25%)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="count" stroke="hsl(42 65% 55%)" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4 gold-text">Candidates by Level</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byLevel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {byLevel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(42 30% 25%)", borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-serif text-xl mb-4 gold-text">Lesson Counts per Course</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topCourses}>
              <XAxis dataKey="title" stroke="hsl(45 10% 70%)" fontSize={11} />
              <YAxis stroke="hsl(45 10% 70%)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(42 30% 25%)", borderRadius: 12 }} />
              <Bar dataKey="lessons" fill="hsl(42 65% 55%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
