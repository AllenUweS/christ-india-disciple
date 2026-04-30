import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, ChevronRight } from "lucide-react";

export const AdminLessons = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", order_index: 0 });

  const load = async () => {
    if (!courseId) return;
    const { data: c } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
    setCourse(c);
    const { data: l } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index");
    setLessons(l ?? []);
  };

  useEffect(() => { load(); }, [courseId]);

  const create = async () => {
    if (!form.title) return toast({ title: "Title required", variant: "destructive" });
    const { error } = await supabase.from("lessons").insert({
      course_id: courseId!,
      title: form.title,
      description: form.description,
      order_index: form.order_index || lessons.length,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Lesson created" });
      setOpen(false);
      setForm({ title: "", description: "", order_index: 0 });
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete lesson?")) return;
    await supabase.from("lessons").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="glass" size="sm">
        <Link to="/admin/courses"><ArrowLeft className="w-4 h-4" /> All Courses</Link>
      </Button>

      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary mb-1">{course?.level}</div>
          <h2 className="font-serif text-3xl gold-text">{course?.title ?? "Course"}</h2>
          <p className="text-sm text-muted-foreground mt-1">{course?.description}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="divine"><Plus className="w-4 h-4" /> New Lesson</Button></DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle className="font-serif gold-text">New Lesson</DialogTitle></DialogHeader>
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
                <Label>Order</Label>
                <Input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: +e.target.value })} className="glass mt-1.5" />
              </div>
              <Button variant="divine" onClick={create} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {lessons.map((l, i) => (
          <div key={l.id} className="glass rounded-xl p-4 flex items-center justify-between hover:divine-glow-soft transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-sm text-primary font-medium">
                {i + 1}
              </div>
              <div>
                <div className="font-medium">{l.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{l.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button asChild size="sm" variant="glass">
                <Link to={`/admin/lessons/${l.id}`}>Edit <ChevronRight className="w-3.5 h-3.5" /></Link>
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(l.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {lessons.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
            No lessons yet. Add the first one above.
          </div>
        )}
      </div>
    </div>
  );
};
