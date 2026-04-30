import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GraduationCap, MessageSquare, Mail, Phone, Sparkles } from "lucide-react";

interface TutorProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export const MyTutorCard = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    (async () => {
      const { data: assignment } = await supabase
        .from("tutor_assignments")
        .select("tutor_id")
        .eq("candidate_id", user.id)
        .maybeSingle();
      if (!assignment?.tutor_id) {
        setTutor(null);
        setLoading(false);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, bio, avatar_url")
        .eq("user_id", assignment.tutor_id)
        .maybeSingle();
      setTutor(prof as TutorProfile | null);
      setLoading(false);
    })();
  }, [open, user]);

  if (!open) return null;

  const initials = (tutor?.full_name || tutor?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-3xl p-8 max-w-md w-full relative overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-primary-glow/20 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/80 font-semibold mb-2">
            <Sparkles className="w-3 h-3" /> Your Mentor
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
          ) : !tutor ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-serif text-xl">No tutor assigned yet</p>
              <p className="text-sm text-muted-foreground">
                Your shepherd will be appointed by the admin soon. Please check back later.
              </p>
              <Button variant="outline" onClick={onClose} className="mt-2">
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/40 shrink-0">
                  {tutor.avatar_url ? (
                    <img src={tutor.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-2xl gold-text leading-tight truncate">
                    {tutor.full_name || "Your Tutor"}
                  </h3>
                  <p className="text-xs text-primary/70">Shepherd of Souls</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {tutor.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{tutor.email}</span>
                  </div>
                )}
                {tutor.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <span>{tutor.phone}</span>
                  </div>
                )}
                {tutor.bio && (
                  <div className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3 mt-3">
                    "{tutor.bio}"
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
                <Button asChild variant="divine" className="flex-1" onClick={onClose}>
                  <Link to="/candidate/messages">
                    <MessageSquare className="w-4 h-4" /> Message
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
