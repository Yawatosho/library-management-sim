import type { CSSProperties } from "react";
import { formatEffect, metricKeys, statLabels } from "../game/calculations";
import { initialStats } from "../game/initialState";
import type { StatKey, YearEndResult } from "../game/types";

interface YearEndScreenProps {
  result: YearEndResult;
  onContinue: () => void;
}

const reviewKeys: StatKey[] = [...metricKeys];

const statIcons: Partial<Record<StatKey, string>> = {
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
  const favorableValue = key === "staffFatigue" ? 100 - value : value;
  if (favorableValue >= 70) return "strong";
  if (favorableValue < 40) return "alert";
  return "steady";
};

const formatDelta = (value: number) => `${value > 0 ? "+" : ""}${value}`;

const getDeltaTone = (key: StatKey, delta: number) => {
  if (delta === 0) return "neutral";
  const favorable = key === "staffFatigue" ? delta < 0 : delta > 0;
  return favorable ? "positive" : "negative";
};

const getReflection = (result: YearEndResult) => {
  const stats = result.statsAfter;
  const strengths = reviewKeys
    .map((key) => ({ key, value: key === "staffFatigue" ? 100 - stats[key] : stats[key] }))
    .sort((a, b) => b.value - a.value);
  const best = strengths[0];
  const concern = strengths[strengths.length - 1];

  if (!best || !concern) return result.comment;
  const bestLabel = best.key === "staffFatigue" ? "職員の疲労管理" : statLabels[best.key];
  const concernLabel = concern.key === "staffFatigue" ? "職員の負担軽減" : statLabels[concern.key];
  return `${bestLabel}は、この1年で頼れる土台になりました。次は${concernLabel}を意識しながら、図書館をもう一段育てていきましょう。`;
};

export const YearEndScreen = ({ result, onContinue }: YearEndScreenProps) => {
  const statChanges = Object.entries(result.statChanges)
    .filter((entry): entry is [StatKey, number] => entry[1] !== undefined && entry[1] !== 0)
    .map(([key, value]) => formatEffect(key, value));
  const budgetDelta = result.nextBudget - result.baseBudget;
  const backgroundUrl = `${import.meta.env.BASE_URL}assets/images/background.png`;
  const librarianUrl = `${import.meta.env.BASE_URL}assets/images/librarian.png`;
  const style = { "--year-end-background": `url(${backgroundUrl})` } as CSSProperties;
  const statsBefore = result.statsBefore ?? (result.year === 1 ? initialStats : result.statsAfter);

  return (
    <div className="screen year-end-screen year-end-game" style={style}>
      <header className="year-end-topbar">
        <div>
          <span className="eyebrow">University Library Maker</span>
          <strong>ANNUAL OPERATIONS REPORT</strong>
        </div>
        <span className="year-end-topbar__year">{result.year}年目・年度末</span>
      </header>

      <main className="year-end-layout">
        <section className="year-end-report" aria-labelledby="year-end-heading">
          <div className="year-end-report__heading">
            <div>
              <span className="year-end-report__seal material-symbols-rounded" aria-hidden="true">workspace_premium</span>
              <p className="eyebrow">一年間の運営を振り返る</p>
              <h1 id="year-end-heading">{result.year}年目 年度末評価</h1>
            </div>
            <span className="year-end-report__status">運営継続</span>
          </div>

          <section className="year-end-budget" aria-label="次年度予算">
            <div>
              <span>査定基準額</span>
              <strong>{result.baseBudget}</strong>
            </div>
            <span className="material-symbols-rounded year-end-budget__arrow" aria-hidden="true">trending_flat</span>
            <div className="year-end-budget__next">
              <span>次年度予算</span>
              <strong>{result.nextBudget}</strong>
              {budgetDelta !== 0 && <small className={budgetDelta > 0 ? "is-positive" : "is-negative"}>{budgetDelta > 0 ? "+" : ""}{budgetDelta}</small>}
            </div>
          </section>

          <section className="year-end-review" aria-labelledby="review-heading">
            <div className="year-end-section-title">
              <span className="material-symbols-rounded" aria-hidden="true">monitoring</span>
              <h2 id="review-heading">運営ステータス</h2>
              <small>年度初 → 年度末</small>
            </div>
            <div className="year-end-stat-grid">
              {reviewKeys.map((key) => {
                const delta = result.statsAfter[key] - statsBefore[key];
                return (
                <div
                  key={key}
                  className={`year-end-stat year-end-stat--${getStatTone(key, result.statsAfter[key])}`}
                  aria-label={`${statLabels[key]} ${statsBefore[key]}から${result.statsAfter[key]}、${formatDelta(delta)}`}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">{statIcons[key]}</span>
                  <div>
                    <small>{statLabels[key]}</small>
                    <span className="year-end-stat__values">
                      <small>{statsBefore[key]} →</small>
                      <strong>{result.statsAfter[key]}</strong>
                      <b className={`year-end-stat__delta year-end-stat__delta--${getDeltaTone(key, delta)}`}>{formatDelta(delta)}</b>
                    </span>
                  </div>
                  <span className="year-end-stat__bar" aria-hidden="true"><span style={{ width: `${result.statsAfter[key]}%` }} /></span>
                </div>
                );
              })}
            </div>
          </section>

          <section className="year-end-assessment" aria-labelledby="assessment-heading">
            <div className="year-end-section-title">
              <span className="material-symbols-rounded" aria-hidden="true">fact_check</span>
              <h2 id="assessment-heading">査定結果</h2>
            </div>
            <div className="year-end-assessment__items">
              {result.budgetBonuses.length > 0
                ? result.budgetBonuses.map((item) => <span className="is-positive" key={item}>{item}</span>)
                : <span>次年度予算ボーナスなし</span>}
              {statChanges.length > 0
                ? statChanges.map((item) => <span key={item}>{item}</span>)
                : <span>追加パラメータ補正なし</span>}
            </div>
          </section>
        </section>

        <aside className="year-end-character" aria-label="司書さん">
          <div className="year-end-character__halo" aria-hidden="true" />
          <img src={librarianUrl} alt="年度末を振り返る司書さん" />
        </aside>
      </main>

      <footer className="year-end-dialogue">
        <span className="year-end-dialogue__name">司書さん</span>
        <div className="year-end-dialogue__message">
          <strong>{result.comment}</strong>
          <p>{getReflection(result)}</p>
        </div>
        <button type="button" className="year-end-dialogue__button" onClick={onContinue}>
          <span>{result.year + 1}年目へ進む</span>
          <span className="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
        </button>
      </footer>
    </div>
  );
};
