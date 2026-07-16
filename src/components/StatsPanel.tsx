import { getStatMeterPercent, metricKeys, statLabels } from "../game/calculations";
import type { StatKey, Stats } from "../game/types";

interface StatsPanelProps {
  stats: Stats;
  title?: string;
  excludeKeys?: StatKey[];
  previewEffects?: Partial<Record<StatKey, number>>;
}

const statIcons: Record<StatKey, string> = {
  budget: "account_balance_wallet",
  collection: "local_library",
  studentSatisfaction: "sentiment_satisfied",
  facultyTrust: "groups",
  executiveTrust: "account_balance",
  publicity: "campaign",
  staffMorale: "volunteer_activism",
  staffFatigue: "battery_alert",
  facility: "apartment",
  researchSupport: "science",
  dx: "memory",
  reputation: "stars",
};

const getStatTone = (key: StatKey, value: number) => {
  if (key === "budget") {
    if (value <= 5) return "danger";
    if (value <= 20) return "warn";
    return "good";
  }

  if (key === "staffFatigue") {
    if (value >= 80) return "danger";
    if (value >= 60) return "warn";
    return "good";
  }

  if (value <= 20) return "danger";
  if (value <= 40) return "warn";
  return "good";
};

const StatLabel = ({ statKey }: { statKey: StatKey }) => (
  <span className="stat-label">
    <span className={`material-symbols-rounded stat-icon stat-icon--${statKey}`} aria-hidden="true">
      {statIcons[statKey]}
    </span>
    <span className="stat-label__text">{statLabels[statKey]}</span>
  </span>
);

const formatPreviewDelta = (value: number) => `${value > 0 ? "+" : ""}${value}`;

const getPreviewTone = (key: StatKey, value: number) => {
  if (key === "staffFatigue") {
    return value > 0 ? "bad" : "good";
  }

  if (key === "budget") {
    return value > 0 ? "good" : "bad";
  }

  return value > 0 ? "good" : "bad";
};

export const StatsPanel = ({ stats, title = "パラメータ", excludeKeys = [], previewEffects = {} }: StatsPanelProps) => {
  const excluded = new Set<StatKey>(excludeKeys);
  const visibleKeys = [
    ...(excluded.has("budget") ? [] : (["budget"] as const)),
    ...metricKeys.filter((key) => !excluded.has(key)),
  ];

  return (
    <section className="panel stats-panel" aria-labelledby="stats-heading">
      <div className="panel__header">
        <h2 id="stats-heading">{title}</h2>
      </div>
      <div className="stat-list">
        {visibleKeys.map((key) => {
          const previewDelta = previewEffects[key] ?? 0;
          const previewTone = previewDelta === 0 ? null : getPreviewTone(key, previewDelta);

          return (
            <div
              key={key}
              className={`stat-row stat-row--${getStatTone(key, stats[key])} ${previewTone ? "stat-row--preview" : ""}`}
            >
              <div className="stat-row__top">
                <StatLabel statKey={key} />
                <span className="stat-row__value">
                  {previewTone && (
                    <span className={`stat-preview-delta stat-preview-delta--${previewTone}`}>
                      {formatPreviewDelta(previewDelta)}
                    </span>
                  )}
                  <strong>{stats[key]}</strong>
                </span>
              </div>
              <div className="stat-bar" aria-hidden="true">
                <span style={{ width: `${getStatMeterPercent(key, stats[key])}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
