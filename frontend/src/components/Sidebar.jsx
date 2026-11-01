import { Link, NavLink } from "react-router-dom";
import { BarChart3, CircleDollarSign, LayoutDashboard, PiggyBank, ReceiptText, Target, Wallet } from "lucide-react";

const links = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/expenses", label: "Expenses", icon: ReceiptText },
  { to: "/income", label: "Income", icon: CircleDollarSign },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/savings", label: "Savings goals", icon: Target },
  { to: "/reports", label: "Reports", icon: BarChart3 }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Link className="brand" to="/" aria-label="SmartSpend home">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
        <span>smart<span className="brand-light">spend</span></span>
      </Link>
      <p className="workspace-label">WORKSPACE</p>
      <nav className="navigation" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <Icon size={17} strokeWidth={1.8} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card"><span className="help-icon">✦</span><p className="help-title">A little progress adds up.</p><p className="help-copy">Small money habits make a big difference over time.</p><NavLink to="/savings" className="help-link">See your goals <span>→</span></NavLink></div>
        <div className="profile-caption">Your personal finance workspace</div>
      </div>
    </aside>
  );
}
