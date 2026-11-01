import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { financeApi } from "../services/api";
import { Page } from "./Expenses";

const monthValue = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
};
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export default function Budget() {
  const { token } = useAuth();
  const [month, setMonth] = useState(monthValue());
  const [budget, setBudget] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { financeApi.budgets(token, month).then(setBudget).catch((issue) => setError(issue.message)); }, [token, month]);
  async function save(event) {
    event.preventDefault(); const amount = Number(new FormData(event.currentTarget).get("amount"));
    try { setBudget(await financeApi.saveBudget(token, month, amount)); setError(""); }
    catch (issue) { setError(issue.message); }
  }
  return <Page title="Monthly budget" subtitle="Set a spending plan that feels right for you." error={error}><div className="page-columns"><article className="panel"><div className="panel-heading"><div><h2>Budget overview</h2><p className="panel-subtitle">{month}</p></div></div>{budget && <><div className="budget-amounts"><strong>{currency.format(budget.spent_cents / 100)}</strong><span>spent of <span>{currency.format(budget.amount_cents / 100)}</span></span></div><div className="progress-track"><div className={`progress-fill ${budget.percent_used >= 90 ? "over-budget" : ""}`} style={{ width: `${Math.min(100, budget.percent_used)}%` }} /></div><div className="budget-foot"><span>{currency.format(Math.max(0, budget.remaining_cents) / 100)} remaining</span><span>{budget.percent_used}% used</span></div><div className="budget-tip">✦ &nbsp;Small adjustments can make your budget go further.</div></>}</article><article className="panel"><div className="panel-heading"><div><h2>Adjust your plan</h2><p className="panel-subtitle">Choose the month and spending limit</p></div></div><form className="entry-form" onSubmit={save}><label>Month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} required /></label><label>Monthly limit<input name="amount" type="number" min="0.01" step="0.01" defaultValue={budget ? budget.amount_cents / 100 : ""} required /></label><button className="primary-button">Save budget</button></form></article></div></Page>;
}
