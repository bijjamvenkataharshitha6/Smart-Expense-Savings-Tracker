import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, CircleAlert, CircleCheck, Info, LogOut, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { financeApi } from "../services/api";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

function buildNotifications(data) {
  const month = data.month;
  const budgetPercent = data.budget_cents ? Math.round(data.expense_cents / data.budget_cents * 100) : 0;
  const notifications = [];

  if (budgetPercent >= 100) {
    notifications.push({
      id: `${month}-budget`,
      title: "Monthly budget exceeded",
      message: `You’re ${currency.format((data.expense_cents - data.budget_cents) / 100)} over your budget.`,
      to: "/budget",
      kind: "warning"
    });
  } else if (budgetPercent >= 80) {
    notifications.push({
      id: `${month}-budget`,
      title: "Budget getting close",
      message: `${budgetPercent}% used. ${currency.format((data.budget_cents - data.expense_cents) / 100)} remains this month.`,
      to: "/budget",
      kind: "warning"
    });
  } else {
    notifications.push({
      id: `${month}-budget`,
      title: "Your budget is on track",
      message: `${currency.format((data.budget_cents - data.expense_cents) / 100)} remains for this month.`,
      to: "/budget",
      kind: "success"
    });
  }

  if (data.income_cents > 0) {
    const saved = data.savings_cents;
    notifications.push({
      id: `${month}-savings-rate`,
      title: saved > 0 ? "You’re building your savings" : "Take a look at your spending",
      message: saved > 0
        ? `You saved ${currency.format(saved / 100)} (${data.savings_rate}% of your income) this month.`
        : "Your expenses are above your income this month. Review your spending plan.",
      to: "/reports",
      kind: saved > 0 ? "success" : "warning"
    });
  }

  if (data.goals.length === 0) {
    notifications.push({
      id: `${month}-create-goal`,
      title: "Give your savings a goal",
      message: "Create a savings goal and make your next milestone feel closer.",
      to: "/savings",
      kind: "info"
    });
  } else {
    data.goals.forEach((goal) => {
      const progress = goal.target_cents
        ? Math.min(100, Math.round(goal.saved_cents / goal.target_cents * 100))
        : 0;
      if (progress < 50) return;
      notifications.push({
        id: `${month}-goal-${goal.id}`,
        title: progress >= 100 ? "Savings goal reached!" : `${progress}% of your goal`,
        message: progress >= 100
          ? `You reached your ${goal.name} goal. Congratulations!`
          : `You’re making great progress toward ${goal.name}. Keep it up!`,
        to: "/savings",
        kind: "info"
      });
    });
  }

  return notifications;
}

function readStoredIds(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function Navbar({ title = "Overview" }) {
  const { token, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const panelRef = useRef(null);
  const userId = user?.id ?? user?.email ?? "account";
  const readKey = `smartspend-notifications-read-${userId}`;
  const dismissedKey = `smartspend-notifications-dismissed-${userId}`;

  useEffect(() => {
    setReadIds(readStoredIds(readKey));
    setDismissedIds(readStoredIds(dismissedKey));
  }, [readKey, dismissedKey]);

  useEffect(() => {
    let active = true;
    financeApi.dashboard(token, getCurrentMonth())
      .then((data) => {
        if (active) {
          setNotifications(buildNotifications(data));
          setLoadError("");
        }
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });
    return () => { active = false; };
  }, [token, retryCount]);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointer(event) {
      if (!panelRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !dismissedIds.includes(item.id)),
    [notifications, dismissedIds]
  );
  const unreadCount = visibleNotifications.filter((item) => !readIds.includes(item.id)).length;

  const saveReadIds = useCallback((ids) => {
    setReadIds(ids);
    localStorage.setItem(readKey, JSON.stringify(ids));
  }, [readKey]);

  const markAllRead = () => saveReadIds([...new Set([...readIds, ...visibleNotifications.map((item) => item.id)])]);

  const dismissNotification = (id) => {
    const nextDismissed = [...new Set([...dismissedIds, id])];
    setDismissedIds(nextDismissed);
    localStorage.setItem(dismissedKey, JSON.stringify(nextDismissed));
  };

  const openNotification = (id) => {
    if (!readIds.includes(id)) saveReadIds([...readIds, id]);
    setOpen(false);
  };

  return (
    <header className="topbar">
      <div className="breadcrumb"><span>Workspace</span><span className="crumb-divider">/</span><strong>{title}</strong></div>
      <div className="topbar-actions">
        <div className="notification-wrapper" ref={panelRef}>
          <button
            className="icon-button notification-button"
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          {open && (
            <section className="notification-panel" role="dialog" aria-label="Notifications">
              <div className="notification-panel-heading">
                <div><h2>Notifications</h2><p>{unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You’re all caught up"}</p></div>
                <div className="notification-panel-actions">
                  {unreadCount > 0 && <button className="notification-text-button" onClick={markAllRead} type="button"><Check size={13} /> Mark all read</button>}
                  <button className="icon-button notification-close" onClick={() => setOpen(false)} type="button" aria-label="Close notifications"><X size={16} /></button>
                </div>
              </div>
              {loadError ? (
                <div className="notification-error" role="alert">
                  <p>{loadError}</p>
                  <button className="notification-text-button" onClick={() => setRetryCount((count) => count + 1)} type="button">Try again</button>
                </div>
              ) : visibleNotifications.length ? (
                <div className="notification-list">
                  {visibleNotifications.map((item) => {
                    const Icon = item.kind === "warning" ? CircleAlert : item.kind === "success" ? CircleCheck : Info;
                    const isRead = readIds.includes(item.id);
                    return (
                      <article className={`notification-item ${isRead ? "read" : "unread"} ${item.kind}`} key={item.id}>
                        <Icon className="notification-item-icon" size={17} />
                        <Link className="notification-copy" to={item.to} onClick={() => openNotification(item.id)}>
                          <strong>{item.title}</strong><span>{item.message}</span>
                        </Link>
                        {!isRead && <span className="notification-unread-dot" aria-label="Unread" />}
                        <button className="notification-dismiss" onClick={() => dismissNotification(item.id)} type="button" aria-label={`Dismiss ${item.title}`}><X size={14} /></button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="notification-empty">Nothing new right now. Your latest budget and savings updates will show here.</p>
              )}
            </section>
          )}
        </div>
        <div className="user-chip"><span className="avatar">{user?.full_name?.[0]?.toUpperCase() || "A"}</span><span className="user-name">{user?.full_name || "Alex Morgan"}</span></div>
        <button className="icon-button signout-button" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={16} /></button>
      </div>
    </header>
  );
}
