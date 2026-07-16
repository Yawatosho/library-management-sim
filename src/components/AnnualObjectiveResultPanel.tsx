import { formatEffect } from "../game/calculations";
import type { AnnualObjectiveResult, StatKey } from "../game/types";

interface AnnualObjectiveResultPanelProps {
  result: AnnualObjectiveResult;
}

const rewardItems = (result: AnnualObjectiveResult) => {
  const rewards: string[] = [];
  const { budgetBonus, effects } = result.objective.reward;
  if (budgetBonus > 0) rewards.push(`次年度予算 +${budgetBonus}`);
  for (const [key, value] of Object.entries(effects)) {
    if (value !== undefined && value !== 0) rewards.push(formatEffect(key as StatKey, value));
  }
  return rewards;
};

export const AnnualObjectiveResultPanel = ({ result }: AnnualObjectiveResultPanelProps) => {
  const rewards = rewardItems(result);
  const message = result.completed
    ? result.objective.successMessage
    : result.objective.encouragementMessage;

  return (
    <section className={`annual-objective-result ${result.completed ? "is-complete" : "is-incomplete"}`} aria-label="年度重点課題の結果">
      <header>
        <span className="material-symbols-rounded" aria-hidden="true">
          {result.completed ? "workspace_premium" : result.objective.icon}
        </span>
        <div>
          <small>{result.objective.year}年目・重点課題</small>
          <h2>{result.objective.title}</h2>
        </div>
        <strong>{result.completed ? "達成" : `${result.completedCount} / ${result.conditions.length}`}</strong>
      </header>

      <div className="annual-objective-result__conditions">
        {result.conditions.map((condition) => (
          <span key={condition.key} className={condition.completed ? "is-complete" : ""}>
            <span className="material-symbols-rounded" aria-hidden="true">
              {condition.completed ? "check_circle" : "radio_button_unchecked"}
            </span>
            {condition.label}
          </span>
        ))}
      </div>

      <p>{message}</p>
      {result.completed && rewards.length > 0 && (
        <div className="annual-objective-result__rewards">
          <small>達成ボーナス</small>
          {rewards.map((reward) => <strong key={reward}>{reward}</strong>)}
        </div>
      )}
    </section>
  );
};
