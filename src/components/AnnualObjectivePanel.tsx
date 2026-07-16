import { formatEffect, statLabels } from "../game/calculations";
import type { AnnualObjectiveResult, StatKey } from "../game/types";

interface AnnualObjectiveBadgeProps {
  result: AnnualObjectiveResult;
  onOpen: () => void;
  disabled?: boolean;
  variant?: "stage" | "topbar";
}

interface AnnualObjectiveModalProps {
  result: AnnualObjectiveResult;
  onClose: () => void;
}

const statIcons: Partial<Record<StatKey, string>> = {
  collection: "local_library",
  studentSatisfaction: "sentiment_satisfied",
  facility: "apartment",
  publicity: "campaign",
  facultyTrust: "groups",
  executiveTrust: "account_balance",
  researchSupport: "science",
  dx: "memory",
  reputation: "stars",
  staffMorale: "volunteer_activism",
  staffFatigue: "battery_alert",
};

const targetLabel = (comparison: "atLeast" | "atMost", target: number) =>
  comparison === "atMost" ? `${target}以下` : `${target}以上`;

const rewardItems = (result: AnnualObjectiveResult) => {
  const items: string[] = [];
  const { budgetBonus, effects } = result.objective.reward;
  if (budgetBonus > 0) items.push(`次年度予算 +${budgetBonus}`);
  for (const [key, value] of Object.entries(effects)) {
    if (value !== undefined && value !== 0) {
      items.push(formatEffect(key as StatKey, value));
    }
  }
  return items;
};

export const AnnualObjectiveBadge = ({
  result,
  onOpen,
  disabled = false,
  variant = "stage",
}: AnnualObjectiveBadgeProps) => {
  const total = result.conditions.length;
  const progress = total > 0 ? (result.completedCount / total) * 100 : 0;

  return (
    <button
      type="button"
      className={`annual-objective-badge annual-objective-badge--${variant}`}
      onClick={onOpen}
      disabled={disabled}
    >
      <span className="material-symbols-rounded annual-objective-badge__icon" aria-hidden="true">
        {result.objective.icon}
      </span>
      <span className="annual-objective-badge__copy">
        <small>{result.objective.year}年目・重点課題</small>
        <strong>{result.objective.title}</strong>
        <span className="annual-objective-badge__meter" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </span>
      </span>
      <span className={`annual-objective-badge__count ${result.completed ? "is-complete" : ""}`}>
        {result.completedCount}<small>/{total}</small>
      </span>
    </button>
  );
};

export const AnnualObjectiveModal = ({ result, onClose }: AnnualObjectiveModalProps) => {
  const rewards = rewardItems(result);

  return (
    <div className="modal-backdrop objective-backdrop" role="dialog" aria-modal="true" aria-labelledby="objective-modal-heading">
      <section className="annual-objective-modal">
        <header className="annual-objective-modal__header">
          <span className="material-symbols-rounded" aria-hidden="true">{result.objective.icon}</span>
          <div>
            <small>YEAR {result.objective.year} / ANNUAL PRIORITY</small>
            <h2 id="objective-modal-heading">{result.objective.title}</h2>
            <p>{result.objective.description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="重点課題を閉じる">
            <span className="material-symbols-rounded" aria-hidden="true">close</span>
          </button>
        </header>

        <div className="annual-objective-modal__progress">
          <span>現在の達成状況</span>
          <strong>{result.completedCount}<small> / {result.conditions.length}</small></strong>
        </div>

        <div className="annual-objective-modal__conditions">
          {result.conditions.map((condition) => (
            <article key={condition.key} className={condition.completed ? "is-complete" : ""}>
              <span className="material-symbols-rounded" aria-hidden="true">
                {condition.completed ? "check_circle" : statIcons[condition.key] ?? "monitoring"}
              </span>
              <div>
                <small>{statLabels[condition.key]}</small>
                <strong>{condition.label}</strong>
              </div>
              <span className="annual-objective-modal__condition-value">
                <b>{condition.current}</b>
                <small>/ {targetLabel(condition.comparison, condition.target)}</small>
              </span>
            </article>
          ))}
        </div>

        <footer className="annual-objective-modal__reward">
          <span className="material-symbols-rounded" aria-hidden="true">redeem</span>
          <div>
            <small>全条件達成ボーナス</small>
            <p>{rewards.map((item) => <strong key={item}>{item}</strong>)}</p>
          </div>
        </footer>
      </section>
    </div>
  );
};
