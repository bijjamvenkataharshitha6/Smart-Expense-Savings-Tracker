import { useCallback, useEffect, useState } from "react";
import ExpenseForm from "../components/ExpenseForm";
import TransactionList from "../components/TransactionList";
import { useAuth } from "../context/AuthContext";
import { financeApi } from "../services/api";

export default function Expenses() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const refresh = useCallback(() => financeApi.transactions(token, "expense").then(setItems).catch((issue) => setError(issue.message)), [token]);
  useEffect(() => { refresh(); }, [refresh]);
  async function add(values) { await financeApi.addTransaction(token, { ...values, kind: "expense" }); await refresh(); }
  async function remove(kind, id) { await financeApi.deleteTransaction(token, kind, id); await refresh(); }
  return <Page title="Expenses" subtitle="Understand your spending, one transaction at a time." error={error}><div className="page-columns"><article className="panel"><div className="panel-heading"><div><h2>Add an expense</h2><p className="panel-subtitle">Keep track of where your money goes</p></div></div><ExpenseForm onSubmit={add} /></article><article className="panel"><div className="panel-heading"><div><h2>Your expenses</h2><p className="panel-subtitle">{items.length} transactions</p></div></div><TransactionList transactions={items} onDelete={remove} emptyMessage="No expenses yet. Add one to get started." /></article></div></Page>;
}

export function Page({ title, subtitle, error, children }) {
  return <><section className="page-heading"><div><p className="eyebrow">YOUR MONEY, IN FOCUS</p><h1>{title}</h1><p className="subtitle">{subtitle}</p></div></section>{error && <div className="error-banner">{error}</div>}{children}</>;
}
