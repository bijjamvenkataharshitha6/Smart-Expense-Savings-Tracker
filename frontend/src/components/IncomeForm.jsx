import { useState } from "react";

const categories = ["Salary", "Side income", "Investment", "Gift", "Refund", "Other"];
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
export default function IncomeForm({ onSubmit, onCancel }) {
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    try {
      await onSubmit({ description: form.get("description"), amount: Number(form.get("amount")), category: form.get("category"), date: form.get("date"), note: form.get("note") });
      formElement.reset();
    } catch (issue) { setError(issue.message); }
  }
  return <form className="entry-form" onSubmit={submit}><label>Description<input name="description" minLength="2" maxLength="80" placeholder="e.g. Monthly salary" required /></label><div className="form-grid"><label>Amount<input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label><label>Date<input name="date" type="date" defaultValue={today()} required /></label></div><label>Category<select name="category">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Note <span className="optional">(optional)</span><input name="note" maxLength="160" placeholder="Add a little context" /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="primary-button" type="submit">Add income</button>{onCancel && <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>}</div></form>;
}
