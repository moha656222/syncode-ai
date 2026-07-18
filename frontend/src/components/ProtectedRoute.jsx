import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="font-mono-ui text-xs text-zinc-500 cursor-blink">CARGANDO SESIÓN</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
