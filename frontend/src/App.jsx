import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./context/AuthContext";
import Budget from "./pages/Budget";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import Savings from "./pages/Savings";

const titles = { "/": "Overview", "/expenses": "Expenses", "/income": "Income", "/budget": "Budget", "/savings": "Savings goals", "/reports": "Reports" };
function ProtectedLayout() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (loading) return <div className="loading-screen">Getting SmartSpend ready…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  function resetDemo() {
    Object.keys(localStorage).filter((key) => key.startsWith("smartspend-")).forEach((key) => localStorage.removeItem(key));
    signOut();
    navigate("/login");
  }
  return <div className="app-shell"><Sidebar /><main className="main-content">{import.meta.env.VITE_DEMO_MODE === "true" && <div className="showcase-banner"><strong>Interactive showcase</strong><span>Demo changes are saved only in this browser.</span><button type="button" onClick={resetDemo}>Reset demo</button></div>}<Navbar title={titles[location.pathname] || "Overview"} /><Routes><Route path="/" element={<Dashboard />} /><Route path="/expenses" element={<Expenses />} /><Route path="/income" element={<Income />} /><Route path="/budget" element={<Budget />} /><Route path="/savings" element={<Savings />} /><Route path="/reports" element={<Reports />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes><footer className="footer"><span>Made for mindful money moments.</span><span>SmartSpend · Personal finance, made simple</span></footer></main></div>;
}

export default function App() {
  return <Routes><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/*" element={<ProtectedLayout />} /></Routes>;
}
