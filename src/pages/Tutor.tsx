import { Routes, Route, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, MessagesSquare, Users } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { TutorOverview } from "./tutor/TutorOverview";
import { TutorLessons } from "./tutor/TutorLessons";
import { TutorLessonView } from "./tutor/TutorLessonView";
import { TutorMessages } from "./tutor/TutorMessages";
import { TutorCandidates } from "./tutor/TutorCandidates";
import { CandidateDetail } from "./shared/CandidateDetail";

const items = [
  { to: "/tutor", label: "Overview", icon: LayoutDashboard },
  { to: "/tutor/lessons", label: "Lessons & Tests", icon: BookOpen },
  { to: "/tutor/candidates", label: "Candidates", icon: Users },
  { to: "/tutor/messages", label: "Messages", icon: MessagesSquare },
];

const titles: Record<string, string> = {
  "/tutor": "Tutor Sanctum",
  "/tutor/lessons": "Lessons & Tests",
  "/tutor/candidates": "My Candidates",
  "/tutor/messages": "Messages",
};

const Tutor = () => {
  const loc = useLocation();
  const title = Object.keys(titles).find((k) => loc.pathname === k || loc.pathname.startsWith(k + "/"));
  return (
    <DashboardShell title={titles[title || "/tutor"] || "Tutor"} items={items} badge="Tutor">
      <Routes>
        <Route index element={<TutorOverview />} />
        <Route path="lessons" element={<TutorLessons />} />
        <Route path="lessons/:lessonId" element={<TutorLessonView />} />
        <Route path="candidates" element={<TutorCandidates />} />
        <Route path="candidates/:candidateId" element={<CandidateDetail />} />
        <Route path="messages" element={<TutorMessages />} />
      </Routes>
    </DashboardShell>
  );
};

export default Tutor;
