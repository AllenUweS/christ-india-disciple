import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, BookOpen, ChevronRight } from "lucide-react";

type Level = "basic" | "intermediate" | "senior";
const LEVELS: Level[] = ["basic", "intermediate", "senior"];

export const AdminCourses = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Level>("basic");
  const [form, setForm] = useState({ title: "", description: "", level: "basic" as Level });

  const load = async () => {
    const { data } = await supabase
      .from("courses")
      .select("*, lessons(count)")
      .order("created_at", { ascending: false });
    setCourses(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title) return toast({ title: "Title required", variant: "destructive" });
    const { error } = await supabase.from("courses").insert({
      title: form.title,
      description: form.description,
      level: form.level,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Course created" });
      setOpen(false);
      setActive(form.level);
      setForm({ title: "", description: "", level: active });
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete course and all its lessons?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); load(); }
  };

  const renderGrid = (level: Level) => {
    const filtered = courses.filter((c) => c.level === level);
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="glass rounded-2xl p-5 hover:divine-glow-soft transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                {c.level}
              </span>
            </div>
            <h3 className="font-serif text-xl mb-1">{c.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{c.description || "No description"}</p>
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-muted-foreground">{c.lessons?.[0]?.count ?? 0} lessons</span>
              <div className="flex items-center gap-1">
                <Button asChild size="sm" variant="glass">
                  <Link to={`/admin/courses/${c.id}/lessons`}>Manage <ChevronRight className="w-3.5 h-3.5" /></Link>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full glass rounded-2xl p-12 text-center text-muted-foreground capitalize">
            No {level} courses yet.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <p className="text-sm text-muted-foreground">{courses.length} course(s) in the curriculum.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="divine"><Plus className="w-4 h-4" /> New Course</Button></DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle className="font-serif gold-text">New Course</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="glass mt-1.5" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="glass mt-1.5" />
              </div>
              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v as Level })}>
                  <SelectTrigger className="glass mt-1.5 capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="divine" onClick={create} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={active} onValueChange={(v) => setActive(v as Level)}>
        <TabsList className="glass">
          {LEVELS.map((l) => (
            <TabsTrigger key={l} value={l} className="capitalize">{l}</TabsTrigger>
          ))}
        </TabsList>
        {LEVELS.map((l) => (
          <TabsContent key={l} value={l} className="mt-6">{renderGrid(l)}</TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
