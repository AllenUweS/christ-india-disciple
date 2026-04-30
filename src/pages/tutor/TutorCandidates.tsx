import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

export const TutorCandidates = () => {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Only candidates assigned to this tutor
      const { data: assigns } = await supabase
        .from("tutor_assignments")
        .select("candidate_id")
        .eq("tutor_id", user.id);
      const ids = assigns?.map((a) => a.candidate_id) ?? [];
      if (ids.length === 0) { setRows([]); return; }
      const { data: profs } = await supabase.from("profiles").select("*").in("user_id", ids);
      const { data: atts } = await supabase.from("test_attempts").select("candidate_id, status, percentage").in("candidate_id", ids);
      const map: Record<string, { passed: number; failed: number; avg: number }> = {};
      atts?.forEach((a) => {
        const m = (map[a.candidate_id] = map[a.candidate_id] || { passed: 0, failed: 0, avg: 0 });
        if (a.status === "passed") m.passed++;
        if (a.status === "failed") m.failed++;
        m.avg += Number(a.percentage);
      });
      setRows((profs ?? []).map((p) => {
        const m = map[p.user_id];
        const total = (m?.passed ?? 0) + (m?.failed ?? 0);
        return {
          ...p,
          passed: m?.passed ?? 0,
          failed: m?.failed ?? 0,
          avg: total ? Math.round((m!.avg / total) * 10) / 10 : 0,
        };
      }));
    })();
  }, []);

  return (
    <div className="glass-strong rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/40">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Passed</TableHead>
            <TableHead>Failed</TableHead>
            <TableHead>Avg %</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No candidates yet.</TableCell></TableRow>
          ) : rows.map((r) => (
            <TableRow key={r.user_id} className="border-border/40 hover:bg-primary/5 cursor-pointer" onClick={() => window.location.assign(`/tutor/candidates/${r.user_id}`)}>
              <TableCell className="font-medium">{r.full_name || "—"}</TableCell>
              <TableCell className="text-muted-foreground">{r.email}</TableCell>
              <TableCell><Badge variant="outline" className="border-primary/30 text-primary">{r.passed}</Badge></TableCell>
              <TableCell><Badge variant="outline" className="border-destructive/30 text-destructive">{r.failed}</Badge></TableCell>
              <TableCell className="font-mono">{r.avg}%</TableCell>
              <TableCell className="text-right">
                <Link to={`/tutor/candidates/${r.user_id}`} onClick={(e) => e.stopPropagation()} className="text-primary inline-flex items-center text-sm">
                  View <ChevronRight className="w-4 h-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
