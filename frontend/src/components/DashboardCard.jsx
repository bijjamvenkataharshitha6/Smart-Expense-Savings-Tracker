import { ArrowDownLeft, ArrowUpRight, Sparkles } from "lucide-react";

const icons = { income: ArrowDownLeft, expense: ArrowUpRight, savings: Sparkles };
export default function DashboardCard({ label, value, caption, kind = "income" }) {
  const Icon = icons[kind] || Sparkles;
  return <article className={`stat-card ${kind}-card`}><div className="stat-top"><span className="stat-label">{label}</span><span className={`stat-icon ${kind}-icon`}><Icon size={15} /></span></div><div className="stat-value">{value}</div><div className="stat-foot"><span className={kind === "expense" ? "trend-muted" : "trend-positive"}>{kind === "expense" ? "↗" : "↗"}</span>{caption}</div></article>;
}
