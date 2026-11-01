import { useCallback, useEffect, useRef, useState } from "react";
import { PiggyBank, Plus, Sparkles, Target, X } from "lucide-react";
import SavingsCard from "../components/SavingsCard";
import { useAuth } from "../context/AuthContext";
import { financeApi } from "../services/api";
import { Page } from "./Expenses";

const goalTypes = [
  { value: "plane", label: "Travel", example: "A trip you’ll always remember", image: "goal-travel.svg" },
  { value: "shield", label: "Emergency fund", example: "A little peace of mind", image: "goal-emergency.svg" },
  { value: "home", label: "Home", example: "Your own place, one step at a time", image: "goal-home.svg" },
  { value: "book", label: "Education", example: "Invest in what comes next", image: "goal-education.svg" },
  { value: "car", label: "Vehicle", example: "A smoother ride ahead", image: "goal-car.svg" },
  { value: "target", label: "Something else", example: "Give your next dream a name", image: "goal-personal.svg" }
];

function parseAmount(value) {
  const amount = Number(String(value).trim().replace(/[$,]/g, ""));
  return Number.isFinite(amount) && amount > 0 && amount <= 10_000_000 ? amount : null;
}

function currentDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function Savings() {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState("plane");
  const [contributionGoal, setContributionGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const contributionDialog = useRef(null);
  const refresh = useCallback(async () => {
    try {
      setGoals(await financeApi.goals(token));
      setError("");
    } catch (issue) {
      setError(issue.message);
    }
  }, [token]);
  useEffect(() => { refresh(); }, [refresh]);

  async function create(event) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const target = parseAmount(form.get("target"));
    if (target === null) {
      setError("Enter a valid target amount greater than zero.");
      return;
    }
    try {
      await financeApi.addGoal(token, {
        name: form.get("name"),
        target,
        due_date: form.get("due_date") || null,
        icon: selectedType
      });
      formElement.reset();
      setSelectedType("plane");
      await refresh();
    } catch (issue) {
      setError(issue.message);
    }
  }

  function openContribution(goal) {
    setError("");
    setContributionGoal(goal);
    requestAnimationFrame(() => contributionDialog.current?.showModal());
  }

  async function addContribution(event) {
    event.preventDefault();
    if (!contributionGoal) return;
    const formElement = event.currentTarget;
    const amount = parseAmount(new FormData(formElement).get("amount"));
    if (amount === null) {
      setError("Enter a valid contribution greater than zero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await financeApi.contribute(token, contributionGoal.id, amount);
      contributionDialog.current?.close();
      setContributionGoal(null);
      formElement.reset();
      await refresh();
    } catch (issue) {
      setError(issue.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeGoal(goal) {
    if (!window.confirm(`Delete "${goal.name}" and its saved progress? This cannot be undone.`)) return;
    setError("");
    try {
      await financeApi.deleteGoal(token, goal.id);
      await refresh();
    } catch (issue) {
      setError(issue.message);
    }
  }

  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved_cents, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target_cents, 0);
  const overallProgress = totalTarget ? Math.min(100, Math.round(totalSaved / totalTarget * 100)) : 0;
  const previewType = goalTypes.find((type) => type.value === selectedType) || goalTypes[0];

  return (
    <>
      <Page title="Savings goals" subtitle="Big dreams start with small, steady steps." error={error}>
        <section className="goals-intro">
          <div className="goals-intro-copy">
            <span className="goals-intro-icon"><Sparkles size={16} /></span>
            <div><h2>Your future, with a plan.</h2><p>Choose what you’re saving for, set a target, and watch every little contribution add up.</p></div>
          </div>
          <img src={`${import.meta.env.BASE_URL}savings-illustration.svg`} alt="" />
        </section>

        <section className="goals-summary" aria-label="Savings totals">
          <article className="goals-summary-card"><span className="summary-icon"><PiggyBank size={17} /></span><span className="summary-label">Total saved</span><strong>{money(totalSaved)}</strong><span className="summary-caption">across {goals.length} {goals.length === 1 ? "goal" : "goals"}</span></article>
          <article className="goals-summary-card"><span className="summary-icon target"><Target size={17} /></span><span className="summary-label">Combined target</span><strong>{money(totalTarget)}</strong><span className="summary-caption">one step at a time</span></article>
          <article className="goals-summary-card overall-summary"><span className="summary-label">Overall progress</span><strong>{overallProgress}%</strong><div className="goal-progress"><span style={{ width: `${overallProgress}%` }} /></div><span className="summary-caption">{totalTarget ? `${money(Math.max(totalTarget - totalSaved, 0))} to your goals` : "Set a goal to start"}</span></article>
        </section>

        <section className="goal-workspace">
          <article className="panel goal-list-panel">
            <div className="panel-heading"><div><h2>Your goals</h2><p className="panel-subtitle">A little progress adds up.</p></div><span className="goal-count">{goals.length} {goals.length === 1 ? "goal" : "goals"}</span></div>
            {goals.length ? <div className="goal-card-grid">{goals.map((goal) => <SavingsCard key={goal.id} goal={goal} onContribute={openContribution} onDelete={removeGoal} />)}</div> : <div className="goal-empty"><img src={`${import.meta.env.BASE_URL}goals/goal-personal.svg`} alt="" /><h3>Your next big thing starts here.</h3><p>Create a goal and give your savings a destination.</p></div>}
          </article>

          <article className="panel create-goal-panel">
            <div className="panel-heading"><div><h2>Create a goal</h2><p className="panel-subtitle">What are you looking forward to?</p></div><span className="create-goal-icon"><Plus size={16} /></span></div>
            <form className="entry-form" onSubmit={create}>
              <fieldset className="goal-type-field">
                <legend>Choose a goal type</legend>
                <div className="goal-type-grid">{goalTypes.map((type) => <button className={`goal-type-option${selectedType === type.value ? " selected" : ""}`} key={type.value} onClick={() => setSelectedType(type.value)} type="button" aria-pressed={selectedType === type.value}><img src={`${import.meta.env.BASE_URL}goals/${type.image}`} alt="" /><span>{type.label}</span></button>)}</div>
              </fieldset>
              <div className="goal-preview"><img src={`${import.meta.env.BASE_URL}goals/${previewType.image}`} alt="" /><span><strong>{previewType.label}</strong><small>{previewType.example}</small></span></div>
              <label>Goal name<input name="name" minLength="2" maxLength="80" placeholder="e.g. Summer getaway" required /></label>
              <label>Target amount<input name="target" type="number" min="0.01" max="10000000" step="0.01" placeholder="2500.00" required /></label>
              <label>Target date <span className="optional">(optional)</span><input name="due_date" type="date" min={currentDate()} /></label>
              <button className="primary-button">Create savings goal</button>
            </form>
          </article>
        </section>
      </Page>

      <dialog className="contribution-dialog" ref={contributionDialog} onClose={() => setContributionGoal(null)}>
        <form className="contribution-form" onSubmit={addContribution}>
          <div className="contribution-heading"><span className="contribution-icon"><PiggyBank size={19} /></span><button className="contribution-close" onClick={() => contributionDialog.current?.close()} type="button" aria-label="Close"><X size={17} /></button></div>
          <p className="eyebrow">KEEP THE MOMENTUM</p>
          <h2>Add to your savings</h2>
          <p className="contribution-description">{contributionGoal ? `Every bit brings "${contributionGoal.name}" closer.` : "Add a little more to your goal."}</p>
          {contributionGoal && <p className="contribution-balance">{money(contributionGoal.saved_cents)} saved <span>of {money(contributionGoal.target_cents)}</span></p>}
          <label>Contribution amount<input name="amount" type="number" min="0.01" max="10000000" step="0.01" placeholder="25.00" autoFocus required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={saving}>{saving ? "Adding contribution…" : "Add to goal"}</button>
        </form>
      </dialog>
    </>
  );
}
