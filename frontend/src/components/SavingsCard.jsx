import { BookOpen, CarFront, House, Plane, Shield, Target, Trash2 } from "lucide-react";

const goalTypes = {
  plane: { icon: Plane, label: "Travel", image: "goal-travel.svg" },
  shield: { icon: Shield, label: "Safety net", image: "goal-emergency.svg" },
  home: { icon: House, label: "Home", image: "goal-home.svg" },
  book: { icon: BookOpen, label: "Education", image: "goal-education.svg" },
  car: { icon: CarFront, label: "Vehicle", image: "goal-car.svg" },
  target: { icon: Target, label: "Personal goal", image: "goal-personal.svg" }
};

const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function SavingsCard({ goal, onContribute, onDelete }) {
  const percent = goal.target_cents ? Math.min(100, Math.round(goal.saved_cents / goal.target_cents * 100)) : 0;
  const type = goalTypes[goal.icon] || goalTypes.target;
  const Icon = type.icon;
  const remaining = Math.max(goal.target_cents - goal.saved_cents, 0);

  return (
    <article className="goal-card">
      <div className="goal-card-art">
        <img src={`${import.meta.env.BASE_URL}goals/${type.image}`} alt="" />
        <span className="goal-type-tag"><Icon size={13} />{type.label}</span>
        {onDelete && <button className="goal-delete" onClick={() => onDelete(goal)} type="button" aria-label={`Delete ${goal.name}`} title="Delete goal"><Trash2 size={15} /></button>}
      </div>
      <div className="goal-card-body">
        <div className="goal-line"><strong>{goal.name}</strong><span>{percent}%</span></div>
        <div className="goal-progress" role="progressbar" aria-label={`${goal.name} progress`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div>
        <div className="goal-meta"><span>{money(goal.saved_cents)} saved</span><span>of {money(goal.target_cents)}</span></div>
        <div className="goal-card-footer">
          <span>{remaining ? `${money(remaining)} to go` : "Goal reached — amazing!"}</span>
          {onContribute && remaining > 0 && <button className="small-action" onClick={() => onContribute(goal)} type="button">Add savings</button>}
        </div>
      </div>
    </article>
  );
}
