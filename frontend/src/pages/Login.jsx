import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try { await signIn(values); navigate("/", { replace: true }); }
    catch (issue) { setError(issue.message); }
    finally { setBusy(false); }
  }
  return <AuthPage title="Welcome back" subtitle="Your money, in focus." onSubmit={submit} error={error} busy={busy} submitLabel="Sign in"><label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" minLength="8" required /></label><p className="demo-hint">Demo account: <strong>demo@smartspend.com</strong><br />Password: <strong>Demo123!</strong></p><p className="auth-switch">New to SmartSpend? <Link to="/register">Create an account</Link></p></AuthPage>;
}

export function AuthPage({ title, subtitle, onSubmit, error, busy, submitLabel, children }) {
  return <main className="auth-page"><div className="auth-layout"><section className="auth-visual"><img src={`${import.meta.env.BASE_URL}finance-welcome.svg`} alt="A savings jar, growing plant, and progress chart" /><div className="auth-visual-copy"><span className="eyebrow">A CALMER WAY TO HANDLE MONEY</span><h2>Make room for what matters.</h2><p>See your spending clearly, celebrate your progress, and feel good about what comes next.</p></div></section><section className="auth-card"><Link className="brand auth-brand" to="/"><img src={`${import.meta.env.BASE_URL}logo.png`} alt="" /><span>smart<span className="brand-light">spend</span></span></Link><p className="eyebrow">A LITTLE MORE CLARITY, EVERY DAY</p><h1>{title}</h1><p className="subtitle">{subtitle}</p>{import.meta.env.VITE_DEMO_MODE === "true" && <p className="demo-mode-note">This interactive preview uses sample data. Changes are saved only in your browser.</p>}<form className="entry-form auth-form" onSubmit={onSubmit}>{children}{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Please wait…" : submitLabel}</button></form></section></div></main>;
}
