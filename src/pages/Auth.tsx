import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 chars").max(72),
});
const signUpSchema = signInSchema.extend({
  full_name: z.string().trim().min(2, "Name required").max(100),
});

const Auth = () => {
  const nav = useNavigate();
  const { user, role, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin") nav("/admin", { replace: true });
      else if (role === "tutor") nav("/tutor", { replace: true });
      else nav("/candidate", { replace: true });
    }
  }, [user, role, loading, nav]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) {
      toast({ title: "Invalid input", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back ✨" });
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
      full_name: fd.get("full_name"),
    });
    if (!parsed.success) {
      toast({ title: "Invalid input", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: parsed.data.full_name },
      },
    });
    setBusy(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created ✨", description: "Welcome to Christ India Disciple." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-divine)" }} />
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-2 text-primary font-serif text-xl">
          <Sparkles className="w-5 h-5" />
          <span className="gold-text">Christ India Disciple</span>
        </Link>
      </div>

      <div className="glass-strong rounded-3xl p-8 md:p-10 w-full max-w-md divine-glow-soft">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif gold-text mb-2">Enter the Sanctuary</h1>
          <p className="text-muted-foreground text-sm">Sign in or begin your divine journey.</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-2 w-full glass mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required className="glass mt-1.5" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required className="glass mt-1.5" />
              </div>
              <Button type="submit" variant="divine" size="lg" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" required className="glass mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email_up">Email</Label>
                <Input id="email_up" name="email" type="email" required className="glass mt-1.5" />
              </div>
              <div>
                <Label htmlFor="password_up">Password</Label>
                <Input id="password_up" name="password" type="password" required minLength={6} className="glass mt-1.5" />
              </div>
              <Button type="submit" variant="divine" size="lg" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Begin Journey"}
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-2">
                New accounts begin as <span className="text-primary">Candidates</span>. Tutors are created by admins.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
