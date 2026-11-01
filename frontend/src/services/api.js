const API_URL = import.meta.env.VITE_API_URL || "/api";
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
const DEMO_STATE_KEY = "smartspend-pages-demo-data";
const DEMO_USER_KEY = "smartspend-pages-demo-user";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function dateForDay(day) {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return `${currentMonth()}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function demoId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeInitialDemoData() {
  const transactions = [
    ["Apartment rent", 125000, "expense", "Housing", 2, "Monthly rent"],
    ["Monthly salary", 420000, "income", "Salary", 3, "Payday"],
    ["Weekly groceries", 6842, "expense", "Groceries", 5, "Fresh market"],
    ["Coffee with Maya", 1280, "expense", "Dining", 7, ""],
    ["Freelance project", 85000, "income", "Side income", 9, "Website project"],
    ["Metro pass", 4200, "expense", "Transport", 11, "Monthly pass"],
    ["Streaming subscription", 1599, "expense", "Entertainment", 13, ""],
    ["Dinner out", 3650, "expense", "Dining", 15, "Friday night"],
    ["Electricity bill", 5860, "expense", "Utilities", 17, ""],
    ["Savings transfer", 25000, "expense", "Savings", 19, "Automatic transfer"],
    ["Bookshop", 2475, "expense", "Shopping", 21, "New reads"]
  ].map(([description, amount_cents, kind, category, day, note]) => ({
    id: demoId(), description, amount_cents, kind, category, date: dateForDay(day), note
  }));
  return {
    transactions,
    goals: [
      { id: demoId(), name: "Summer getaway", target_cents: 250000, saved_cents: 145000, due_date: null, icon: "plane" },
      { id: demoId(), name: "Emergency fund", target_cents: 500000, saved_cents: 320000, due_date: null, icon: "shield" }
    ],
    budgets: { [currentMonth()]: 300000 }
  };
}

function readDemoData() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_STATE_KEY) || "null");
    if (stored && Array.isArray(stored.transactions) && Array.isArray(stored.goals) && stored.budgets) return stored;
  } catch {
    localStorage.removeItem(DEMO_STATE_KEY);
  }
  const initial = makeInitialDemoData();
  localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(initial));
  return initial;
}

function saveDemoData(data) {
  localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(data));
}

function demoUser() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_USER_KEY) || "null");
  } catch {
    return null;
  }
}

function demoDashboard(data, month) {
  const monthly = data.transactions.filter((item) => item.date.startsWith(month));
  const income = monthly.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount_cents, 0);
  const expense = monthly.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount_cents, 0);
  const allIncome = data.transactions.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount_cents, 0);
  const allExpenses = data.transactions.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount_cents, 0);
  const category_totals = {};
  monthly.filter((item) => item.kind === "expense").forEach((item) => {
    category_totals[item.category] = (category_totals[item.category] || 0) + item.amount_cents;
  });
  const [year, monthNumber] = month.split("-").map(Number);
  const trends = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(year, monthNumber - 1 - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    trends.push({
      month: key,
      label: date.toLocaleString("en", { month: "short" }),
      expense_cents: data.transactions
        .filter((item) => item.kind === "expense" && item.date.startsWith(key))
        .reduce((sum, item) => sum + item.amount_cents, 0)
    });
  }
  const budget_cents = data.budgets[month] ?? 300000;
  return {
    month,
    income_cents: income,
    expense_cents: expense,
    savings_cents: income - expense,
    savings_rate: income ? Math.round((income - expense) / income * 100) : 0,
    all_time_balance_cents: allIncome - allExpenses,
    budget_cents,
    category_totals,
    trends,
    goals: data.goals,
    recent_transactions: monthly.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  };
}

function demoRequest(path, { token, ...options } = {}) {
  const user = demoUser();
  const body = options.body ? JSON.parse(options.body) : {};
  const method = options.method || "GET";
  const url = new URL(path, "https://smartspend.demo");
  const parts = url.pathname.split("/").filter(Boolean);

  if (url.pathname === "/auth/login" && method === "POST") {
    const account = user || { id: "demo-user", full_name: "Alex Morgan", email: "demo@smartspend.com" };
    if (body.email?.toLowerCase() !== account.email.toLowerCase()
      || (!user && body.password !== "Demo123!")) {
      throw new ApiError("Email or password is incorrect. For the sample account, use Demo123!.", 401);
    }
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(account));
    return { access_token: "smartspend-pages-demo-session", token_type: "bearer", user: account };
  }

  if (url.pathname === "/auth/register" && method === "POST") {
    const account = { id: demoId(), full_name: body.full_name, email: body.email.toLowerCase() };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(account));
    return { access_token: "smartspend-pages-demo-session", token_type: "bearer", user: account };
  }

  if (url.pathname === "/auth/me" && method === "GET") {
    if (!token || !user) throw new ApiError("Sign in to continue.", 401);
    const { password, ...profile } = user;
    return profile;
  }

  if (!token) throw new ApiError("Sign in to continue.", 401);
  let data = readDemoData();

  if (url.pathname === "/reports/dashboard") {
    return demoDashboard(data, url.searchParams.get("month") || currentMonth());
  }

  if (url.pathname === "/expenses" || url.pathname === "/income") {
    const kind = parts[0] === "income" ? "income" : "expense";
    if (method === "GET") return data.transactions.filter((item) => item.kind === kind).sort((a, b) => b.date.localeCompare(a.date));
    if (method === "POST") {
      const transaction = { ...body, id: demoId(), kind, amount_cents: Math.round(Number(body.amount) * 100), note: body.note || "" };
      delete transaction.amount;
      data = { ...data, transactions: [transaction, ...data.transactions] };
      saveDemoData(data);
      return transaction;
    }
    if (method === "DELETE" && parts[1]) {
      saveDemoData({ ...data, transactions: data.transactions.filter((item) => String(item.id) !== parts[1]) });
      return null;
    }
  }

  if (url.pathname === "/savings" && method === "GET") return data.goals;
  if (url.pathname === "/savings" && method === "POST") {
    const goal = {
      id: demoId(),
      name: body.name,
      target_cents: Math.round(Number(body.target) * 100),
      saved_cents: 0,
      due_date: body.due_date || null,
      icon: body.icon || "target"
    };
    saveDemoData({ ...data, goals: [...data.goals, goal] });
    return goal;
  }
  if (parts[0] === "savings" && parts[1] && method === "DELETE") {
    saveDemoData({ ...data, goals: data.goals.filter((goal) => String(goal.id) !== parts[1]) });
    return null;
  }
  if (parts[0] === "savings" && parts[1] && parts[2] === "contributions" && method === "POST") {
    const goal = data.goals.find((item) => String(item.id) === parts[1]);
    if (!goal) throw new ApiError("Savings goal not found.", 404);
    const updated = { ...goal, saved_cents: goal.saved_cents + Math.round(Number(body.amount) * 100) };
    saveDemoData({ ...data, goals: data.goals.map((item) => item.id === goal.id ? updated : item) });
    return updated;
  }

  if (parts[0] === "budget" && method === "GET") {
    const month = url.searchParams.get("month") || currentMonth();
    const budget = demoDashboard(data, month);
    const remaining_cents = budget.budget_cents - budget.expense_cents;
    return { month, amount_cents: budget.budget_cents, spent_cents: budget.expense_cents, remaining_cents, percent_used: budget.budget_cents ? Math.round(budget.expense_cents / budget.budget_cents * 100) : 0 };
  }
  if (url.pathname === "/budget" && method === "PUT") {
    const updatedData = { ...data, budgets: { ...data.budgets, [body.month]: Math.round(Number(body.amount) * 100) } };
    saveDemoData(updatedData);
    const budget = demoDashboard(updatedData, body.month);
    return { month: body.month, amount_cents: budget.budget_cents, spent_cents: budget.expense_cents, remaining_cents: budget.budget_cents - budget.expense_cents, percent_used: budget.budget_cents ? Math.round(budget.expense_cents / budget.budget_cents * 100) : 0 };
  }
  throw new ApiError("This action is not available in the demo preview.", 404);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path, { token, ...options } = {}) {
  if (DEMO_MODE) return demoRequest(path, { token, ...options });

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new ApiError("Could not reach SmartSpend. Make sure the backend is running.", 0);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const detail = payload?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(", ")
      : typeof detail === "string" ? detail : "Something went wrong. Please try again.";
    throw new ApiError(message, response.status);
  }
  return payload;
}

export const authApi = {
  login: (values) => apiRequest("/auth/login", { method: "POST", body: JSON.stringify(values) }),
  register: (values) => apiRequest("/auth/register", { method: "POST", body: JSON.stringify(values) }),
  me: (token) => apiRequest("/auth/me", { token })
};

export const financeApi = {
  dashboard: (token, month) => apiRequest(`/reports/dashboard?month=${encodeURIComponent(month)}`, { token }),
  transactions: (token, kind) => apiRequest(`/${kind === "income" ? "income" : "expenses"}`, { token }),
  addTransaction: (token, values) => apiRequest(`/${values.kind === "income" ? "income" : "expenses"}`, { token, method: "POST", body: JSON.stringify(values) }),
  deleteTransaction: (token, kind, id) => apiRequest(`/${kind === "income" ? "income" : "expenses"}/${id}`, { token, method: "DELETE" }),
  goals: (token) => apiRequest("/savings", { token }),
  addGoal: (token, values) => apiRequest("/savings", { token, method: "POST", body: JSON.stringify(values) }),
  deleteGoal: (token, id) => apiRequest(`/savings/${id}`, { token, method: "DELETE" }),
  contribute: (token, id, amount) => apiRequest(`/savings/${id}/contributions`, { token, method: "POST", body: JSON.stringify({ amount }) }),
  budgets: (token, month) => apiRequest(`/budget?month=${encodeURIComponent(month)}`, { token }),
  saveBudget: (token, month, amount) => apiRequest("/budget", { token, method: "PUT", body: JSON.stringify({ month, amount }) })
};
