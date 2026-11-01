import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthPage } from "./Login";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.password !== values.confirm_password) { setError("Passwords do not match."); setBusy(false); return; }
    delete values.confirm_password;
    try { await register(values); navigate("/", { replace: true }); }
    catch (issue) { setError(issue.message); }
    finally { setBusy(false); }
  }
  return <AuthPage title="Create your account" subtitle="A fresh start for your finances." onSubmit={submit} error={error} busy={busy} submitLabel="Create account"><label>Your name<input name="full_name" autoComplete="name" minLength="2" maxLength="80" required /></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete="new-password" minLength="8" required /></label><label>Confirm password<input name="confirm_password" type="password" autoComplete="new-password" minLength="8" required /></label><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></AuthPage>;
}
