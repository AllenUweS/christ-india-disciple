import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isSubscriptionActive, type Level } from "@/lib/payments";

export interface ActiveSub {
  id: string;
  level: Level;
  billing_type: "monthly" | "one_time";
  price_paid: number;
  currency: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
}

export interface AccessOverride {
  id: string;
  scope: "level" | "course" | "lesson";
  level: Level | null;
  course_id: string | null;
  lesson_id: string | null;
  unlock_until: string;
  notes: string | null;
}

export function usePlanAccess() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<ActiveSub[]>([]);
  const [overrides, setOverrides] = useState<AccessOverride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [subsRes, overRes] = await Promise.all([
        supabase
          .from("candidate_subscriptions")
          .select("id, level, billing_type, price_paid, currency, status, starts_at, expires_at")
          .eq("candidate_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("content_access_overrides")
          .select("id, scope, level, course_id, lesson_id, unlock_until, notes")
          .eq("candidate_id", user.id),
      ]);
      if (!cancelled) {
        setSubs((subsRes.data ?? []) as ActiveSub[]);
        setOverrides((overRes.data ?? []) as AccessOverride[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const activeSubs = subs.filter(isSubscriptionActive);
  const activeOverrides = overrides.filter((o) => new Date(o.unlock_until).getTime() > Date.now());
  const hasAnyActive = activeSubs.length > 0 || activeOverrides.length > 0;

  const hasLevelOverride = (l: Level) => activeOverrides.some((o) => o.scope === "level" && o.level === l);
  const hasCourseOverride = (courseId: string) => activeOverrides.some((o) => o.scope === "course" && o.course_id === courseId);
  const hasLessonOverride = (lessonId: string) => activeOverrides.some((o) => o.scope === "lesson" && o.lesson_id === lessonId);

  // Strict: a paid subscription unlocks ONLY that level (per spec)
  const hasLevel = (l: Level) => activeSubs.some((s) => s.level === l) || hasLevelOverride(l);

  // For lesson/course access, also accept any matching override
  const canAccessCourse = (courseId: string, level: Level) => hasLevel(level) || hasCourseOverride(courseId);
  const canAccessLesson = (lessonId: string, courseId: string, level: Level) =>
    hasLevel(level) || hasCourseOverride(courseId) || hasLessonOverride(lessonId);

  return {
    subs,
    activeSubs,
    overrides,
    activeOverrides,
    hasAnyActive,
    hasLevel,
    canAccessCourse,
    canAccessLesson,
    loading,
  };
}
