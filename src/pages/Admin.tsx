import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, BookOpen, BarChart3, Tag, Receipt, KeyRound } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { AdminOverview } from "./admin/AdminOverview";
import { AdminCandidates } from "./admin/AdminCandidates";
import { AdminTutors } from "./admin/AdminTutors";
import { AdminCourses } from "./admin/AdminCourses";
import { AdminLessons } from "./admin/AdminLessons";
import { AdminLessonEditor } from "./admin/AdminLessonEditor";
import { AdminAnalytics } from "./admin/AdminAnalytics";
import { AdminPricing } from "./admin/AdminPricing";
import { AdminSubscriptions } from "./admin/AdminSubscriptions";
import { AdminOverrides } from "./admin/AdminOverrides";
import { CandidateDetail } from "./shared/CandidateDetail";

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/candidates", label: "Candidates", icon: GraduationCap },
  { to: "/admin/tutors", label: "Tutors", icon: Users },
  { to: "/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/pricing", label: "Pricing", icon: Tag },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: Receipt },
  { to: "/admin/overrides", label: "Free Access", icon: KeyRound },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

const titles: Record<string, string> = {
  "/admin": "Admin Sanctum",
  "/admin/candidates": "Candidates",
  "/admin/tutors": "Tutors",
  "/admin/courses": "Courses",
  "/admin/pricing": "Pricing",
  "/admin/subscriptions": "Subscriptions",
  "/admin/overrides": "Free Access",
  "/admin/analytics": "Analytics",
};

const AdminLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    const id = setInterval(() => setPath(window.location.pathname), 200);
    return () => {
      window.removeEventListener("popstate", onPop);
      clearInterval(id);
    };
  }, []);
  const matched = Object.keys(titles).find((k) => path === k || path.startsWith(k + "/"));
  return (
    <DashboardShell title={titles[matched || "/admin"] || "Admin"} items={items} badge="Administrator">
      {children}
    </DashboardShell>
  );
};

const Admin = () => (
  <AdminLayoutWrapper>
    <Routes>
      <Route index element={<AdminOverview />} />
      <Route path="candidates" element={<AdminCandidates />} />
      <Route path="candidates/:candidateId" element={<CandidateDetail />} />
      <Route path="tutors" element={<AdminTutors />} />
      <Route path="courses" element={<AdminCourses />} />
      <Route path="courses/:courseId/lessons" element={<AdminLessons />} />
      <Route path="lessons/:lessonId" element={<AdminLessonEditor />} />
      <Route path="pricing" element={<AdminPricing />} />
      <Route path="subscriptions" element={<AdminSubscriptions />} />
      <Route path="overrides" element={<AdminOverrides />} />
      <Route path="analytics" element={<AdminAnalytics />} />
    </Routes>
  </AdminLayoutWrapper>
);

export default Admin;
