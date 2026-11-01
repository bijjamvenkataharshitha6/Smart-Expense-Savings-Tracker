import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export default function TransactionList({ transactions = [], onDelete, emptyMessage = "No transactions yet." }) {
  if (!transactions.length) return <div className="empty-state">{emptyMessage}</div>;
  return <div className="transaction-list">{transactions.map((item) => {
    const income = item.kind === "income";
    return <div className="transaction-row" key={item.id}><span className={`transaction-icon ${income ? "income" : ""}`}>{income ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}</span><div className="transaction-main"><strong>{item.description}</strong><span>{item.category}{item.note ? ` · ${item.note}` : ""}</span></div><time className="transaction-date">{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time><span className={`transaction-amount ${income ? "income" : ""}`}>{income ? "+" : "−"}{currency.format(item.amount_cents / 100)}</span>{onDelete && <button className="delete-button" onClick={() => onDelete(item.kind, item.id)} aria-label={`Delete ${item.description}`}><Trash2 size={14} /></button>}</div>;
  })}</div>;
}
