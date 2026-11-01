import { useCallback, useEffect, useState } from "react";
import IncomeForm from "../components/IncomeForm";
import TransactionList from "../components/TransactionList";
import { useAuth } from "../context/AuthContext";
import { financeApi } from "../services/api";
import { Page } from "./Expenses";

export default function Income() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const refresh = useCallback(() => financeApi.transactions(token, "income").then(setItems).catch((issue) => setError(issue.message)), [token]);
  useEffect(() => { refresh(); }, [refresh]);
  async function add(values) { await financeApi.addTransaction(token, { ...values, kind: "income" }); await refresh(); }
  async function remove(kind, id) { await financeApi.deleteTransaction(token, kind, id); await refresh(); }
  return <Page title="Income" subtitle="Every stream of income, all in one place." error={error}><div className="page-columns"><article className="panel"><div className="panel-heading"><div><h2>Add income</h2><p className="panel-subtitle">Record a payment or other income</p></div></div><IncomeForm onSubmit={add} /></article><article className="panel"><div className="panel-heading"><div><h2>Your income</h2><p className="panel-subtitle">{items.length} transactions</p></div></div><TransactionList transactions={items} onDelete={remove} emptyMessage="No income records yet." /></article></div></Page>;
}
