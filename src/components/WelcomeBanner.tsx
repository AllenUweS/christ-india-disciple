import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Sun, Moon, Star } from "lucide-react";

interface Props {
  role: "admin" | "tutor" | "candidate";
}

const versesByRole: Record<Props["role"], { text: string; ref: string }[]> = {
  admin: [
    { text: "By wisdom a house is built, and by understanding it is established.", ref: "Proverbs 24:3" },
    { text: "Whoever is faithful in a very little is also faithful in much.", ref: "Luke 16:10" },
    { text: "Let all things be done decently and in order.", ref: "1 Corinthians 14:40" },
    { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  ],
  tutor: [
    { text: "Let your light so shine before men, that they may see your good works.", ref: "Matthew 5:16" },
    { text: "Train up a child in the way he should go.", ref: "Proverbs 22:6" },
    { text: "Freely you have received; freely give.", ref: "Matthew 10:8" },
    { text: "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.", ref: "Proverbs 27:17" },
  ],
  candidate: [
    { text: "Thy word is a lamp unto my feet, and a light unto my path.", ref: "Psalm 119:105" },
    { text: "I can do all things through Christ which strengtheneth me.", ref: "Philippians 4:13" },
    { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
    { text: "Trust in the Lord with all thine heart; lean not unto thine own understanding.", ref: "Proverbs 3:5" },
    { text: "They that wait upon the Lord shall renew their strength.", ref: "Isaiah 40:31" },
  ],
};

const roleSubtitle: Record<Props["role"], string> = {
  admin: "Steward of the Sanctuary",
  tutor: "Shepherd of Souls",
  candidate: "Disciple on the Path",
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return { word: "Peace of the night", Icon: Moon };
  if (h < 12) return { word: "Good morning", Icon: Sun };
  if (h < 17) return { word: "Good afternoon", Icon: Sun };
  if (h < 21) return { word: "Good evening", Icon: Star };
  return { word: "Blessed evening", Icon: Moon };
};

export const WelcomeBanner = ({ role }: Props) => {
  const { user } = useAuth();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", user.id)
        .maybeSingle();
      setName(data?.full_name || data?.email?.split("@")[0] || "Beloved");
    })();
  }, [user]);

  const verses = versesByRole[role];
  const verse = verses[new Date().getDate() % verses.length];
  const { word, Icon } = greeting();

  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-primary-glow/15 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-primary/80 font-semibold">
              {word}
            </span>
            <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              · {roleSubtitle[role]}
            </span>
          </div>

          <h2 className="font-serif text-3xl md:text-5xl leading-tight">
            Welcome, <span className="gold-text italic font-medium">{name || "Beloved"}</span>
          </h2>

          <div className="mt-5 flex items-start gap-3 max-w-2xl">
            <Sparkles className="w-4 h-4 text-primary mt-1 shrink-0" />
            <div>
              <p className="font-serif italic text-base md:text-lg leading-relaxed text-foreground/90">
                "{verse.text}"
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-primary/80 mt-1">
                — {verse.ref}
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex shrink-0">
          <div className="relative w-28 h-28 rounded-full glass border border-primary/30 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-xl" />
            <Sparkles className="w-12 h-12 text-primary relative" />
          </div>
        </div>
      </div>
    </div>
  );
};
