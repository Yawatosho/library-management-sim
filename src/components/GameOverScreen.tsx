import type { CSSProperties } from "react";
import { statKeys, statLabels } from "../game/calculations";
import type { GameOverResult, StatKey, Stats } from "../game/types";

interface GameOverScreenProps {
  gameOver: GameOverResult;
  stats: Stats;
  onNewGame: () => void;
  onTitle: () => void;
}

const statIcons: Record<StatKey, string> = {
  budget: "payments",
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
  if (key === "budget") return value <= -20 ? "danger" : value <= 5 ? "warning" : "normal";
  if (key === "staffFatigue") return value >= 100 ? "danger" : value >= 80 ? "warning" : "normal";
  if (["reputation", "studentSatisfaction", "facultyTrust"].includes(key)) {
    return value <= 0 ? "danger" : value <= 20 ? "warning" : "normal";
  }
  return value < 35 ? "warning" : "normal";
};

const getMeterValue = (key: StatKey, value: number) => {
  if (key === "budget") return Math.max(0, Math.min(100, value));
  return Math.max(0, Math.min(100, value));
};

export const GameOverScreen = ({ gameOver, stats, onNewGame, onTitle }: GameOverScreenProps) => {
  const visualUrl = `${import.meta.env.BASE_URL}assets/images/game-over-key-visual.png`;
  const style = { "--game-over-visual": `url(${visualUrl})` } as CSSProperties;

  return (
    <div className="screen game-over-screen game-over-game" style={style}>
      <header className="game-over-topbar">
        <div>
          <span className="eyebrow">University Library Maker</span>
          <strong>OPERATIONS REVIEW</strong>
        </div>
        <span className="game-over-topbar__status">運営記録</span>
      </header>

      <main className="game-over-layout">
        <section className="game-over-report" aria-labelledby="game-over-heading">
          <div className="game-over-report__heading">
            <span className="material-symbols-rounded" aria-hidden="true">menu_book</span>
            <div>
              <p className="eyebrow">今回の歩みを振り返る</p>
              <h1 id="game-over-heading">{gameOver.reason}</h1>
            </div>
          </div>
          <p className="game-over-report__lead">{gameOver.comment}</p>

          <section className="game-over-stats" aria-labelledby="game-over-stats-heading">
            <div className="game-over-section-title">
              <span className="material-symbols-rounded" aria-hidden="true">monitoring</span>
              <h2 id="game-over-stats-heading">終了時の運営ステータス</h2>
            </div>
            <div className="game-over-stat-grid">
              {statKeys.map((key) => (
                <div key={key} className={`game-over-stat game-over-stat--${getStatTone(key, stats[key])}`}>
                  <span className="material-symbols-rounded" aria-hidden="true">{statIcons[key]}</span>
                  <div>
                    <small>{statLabels[key]}</small>
                    <strong>{stats[key]}</strong>
                  </div>
                  <span className="game-over-stat__meter" aria-hidden="true">
                    <span style={{ width: `${getMeterValue(key, stats[key])}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>

      <footer className="game-over-dialogue">
        <span className="game-over-dialogue__name">司書さん</span>
        <p>今回はここまでですね。でも、この3年間で見つけたことは、きっと次の運営に生かせます。次は私もそばでお手伝いしますから、また一緒に図書館を育ててみましょう。</p>
        <div className="game-over-actions">
          <button type="button" className="game-over-button game-over-button--primary" onClick={onNewGame}>
            <span className="material-symbols-rounded" aria-hidden="true">replay</span>
            もう一度始める
          </button>
          <button type="button" className="game-over-button" onClick={onTitle}>
            <span className="material-symbols-rounded" aria-hidden="true">home</span>
            タイトルへ
          </button>
        </div>
      </footer>
    </div>
  );
};
