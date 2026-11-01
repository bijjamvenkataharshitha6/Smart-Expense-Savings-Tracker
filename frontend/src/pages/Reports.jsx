import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../context/AuthContext";
import { financeApi } from "../services/api";
import { Page } from "./Expenses";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const monthValue = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
};
export default function Reports() {
  const { token } = useAuth();
  const [month, setMonth] = useState(monthValue());
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { financeApi.dashboard(token, month).then(setReport).catch((issue) => setError(issue.message)); }, [token, month]);
  return <Page title="Reports" subtitle="See the patterns behind your progress." error={error}><div className="panel report-panel"><div className="panel-heading"><div><h2>Income & spending</h2><p className="panel-subtitle">Six-month financial overview</p></div><input className="month-picker-input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></div>{report && <><div className="report-stats"><span>Income <strong>{currency.format(report.income_cents / 100)}</strong></span><span>Expenses <strong>{currency.format(report.expense_cents / 100)}</strong></span><span>Saved <strong>{currency.format(report.savings_cents / 100)}</strong></span></div><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.trends} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}><CartesianGrid stroke="#edf0ee" strokeDasharray="4 4" /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} /><Tooltip formatter={(value) => currency.format(value / 100)} /><Bar dataKey="expense_cents" name="Expenses" fill="#278c73" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="category-report"><h2>Spending by category</h2>{Object.entries(report.category_totals).sort((a, b) => b[1] - a[1]).map(([category, amount]) => <div className="category-row" key={category}><span>{category}</span><strong>{currency.format(amount / 100)}</strong></div>)}</div></>}</div></Page>;
}
