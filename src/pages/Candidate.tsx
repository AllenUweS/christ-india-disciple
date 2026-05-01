import { Routes, Route, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, MessagesSquare, Award, Sparkles, Video } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { CandidateOverview } from "./candidate/CandidateOverview";
import { CandidateLevels } from "./candidate/CandidateLevels";
import { CandidateLevelView } from "./candidate/CandidateLevelView";
import { LessonViewer } from "./candidate/LessonViewer";
import { TestTaker } from "./candidate/TestTaker";
import { CandidateMessages } from "./candidate/CandidateMessages";
import { CandidateAchievements } from "./candidate/CandidateAchievements";
import { CandidatePlans } from "./candidate/CandidatePlans";
import { CandidateMeetings } from "./candidate/CandidateMeetings";   // ← NEW

const items = [
  { to: "/candidate", label: "Overview", icon: LayoutDashboard },
  { to: "/candidate/learn", label: "Learn", icon: BookOpen },
  { to: "/candidate/meetings", label: "Meetings", icon: Video },      // ← NEW
  { to: "/candidate/plans", label: "Plans", icon: Sparkles },
  { to: "/candidate/achievements", label: "Achievements", icon: Award },
  { to: "/candidate/messages", label: "Messages", icon: MessagesSquare },
];

const titles: Record<string, string> = {
  "/candidate": "Your Sanctuary",
  "/candidate/learn": "The Path",
  "/candidate/meetings": "Meetings",                                   // ← NEW
  "/candidate/plans": "Plans & Subscriptions",
  "/candidate/achievements": "Achievements",
  "/candidate/messages": "Messages",
};

const Candidate = () => {
  const loc = useLocation();
  const matched = Object.keys(titles).find((k) => loc.pathname === k || loc.pathname.startsWith(k + "/"));
  return (
    <DashboardShell title={titles[matched || "/candidate"] || "Candidate"} items={items} badge="Candidate">
      <Routes>
        <Route index element={<CandidateOverview />} />
        <Route path="learn" element={<CandidateLevels />} />
        <Route path="learn/:level" element={<CandidateLevelView />} />
        <Route path="learn/lesson/:lessonId" element={<LessonViewer />} />
        <Route path="learn/test/:testId" element={<TestTaker />} />
        <Route path="meetings" element={<CandidateMeetings />} />      {/* ← NEW */}
        <Route path="plans" element={<CandidatePlans />} />
        <Route path="achievements" element={<CandidateAchievements />} />
        <Route path="messages" element={<CandidateMessages />} />
      </Routes>
    </DashboardShell>
  );
};

export default Candidate;
