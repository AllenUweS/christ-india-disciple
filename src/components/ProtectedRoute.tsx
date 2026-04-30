import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  allow?: Array<"admin" | "tutor" | "candidate">;
}

export const ProtectedRoute = ({ children, allow }: Props) => {
  const { user, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (allow && role && !allow.includes(role)) {
    // redirect to their own dashboard
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "tutor") return <Navigate to="/tutor" replace />;
    return <Navigate to="/candidate" replace />;
  }
  return <>{children}</>;
};
