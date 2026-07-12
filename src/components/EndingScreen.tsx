import type { CSSProperties } from "react";
import { useState } from "react";
import { metricKeys, statLabels } from "../game/calculations";
import type { EndingResult, StatKey, Stats } from "../game/types";

interface EndingScreenProps {
  ending: EndingResult;
  stats: Stats;
  onTitle: () => void;
}

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

export const EndingScreen = ({ ending, stats, onTitle }: EndingScreenProps) => {
  const [phase, setPhase] = useState<"report" | "epilogue">("report");
  const [imageFailed, setImageFailed] = useState(false);
  const rank = ending.rank.toLowerCase();
  const backgroundUrl = `${import.meta.env.BASE_URL}assets/images/background.png`;
  const librarianUrl = `${import.meta.env.BASE_URL}assets/images/librarian.png`;
  const endingImageUrl = `${import.meta.env.BASE_URL}assets/images/endings/rank-${rank}.png`;
  const style = { "--year-end-background": `url(${backgroundUrl})` } as CSSProperties;

  if (phase === "epilogue") {
    return (
      <div className={`screen ending-epilogue ending-epilogue--${rank}`}>
        {!imageFailed ? (
          <img className="ending-epilogue__image" src={endingImageUrl} alt={`${ending.rank}ランク ${ending.title}のエピローグ`} onError={() => setImageFailed(true)} />
        ) : (
          <div className="ending-epilogue__fallback" style={{ backgroundImage: `url(${backgroundUrl})` }}>
            <img src={librarianUrl} alt="司書さん" />
          </div>
        )}
        <div className="ending-epilogue__shade" aria-hidden="true" />
        <header className="ending-epilogue__header">
          <span>UNIVERSITY LIBRARY MAKER</span>
          <small>THREE YEARS LATER</small>
        </header>
        <section className="ending-epilogue__caption" aria-labelledby="epilogue-heading">
          <span className="ending-epilogue__rank">RANK {ending.rank}</span>
          <div>
            <p>3年間の物語、その先へ</p>
            <h1 id="epilogue-heading">{ending.title}</h1>
            <strong>{ending.comment}</strong>
          </div>
          <button type="button" onClick={onTitle}>
            <span>タイトルへ</span>
            <span className="material-symbols-rounded" aria-hidden="true">home</span>
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className={`screen year-end-screen year-end-game ending-report-screen ending-report-screen--${rank}`} style={style}>
      <header className="year-end-topbar">
        <div>
          <span className="eyebrow">University Library Maker</span>
          <strong>FINAL OPERATIONS REPORT</strong>
        </div>
        <span className="year-end-topbar__year">3年目・最終評価</span>
      </header>

      <main className="year-end-layout ending-result-layout">
        <section className="year-end-report ending-final-report" aria-labelledby="ending-heading">
          <div className="year-end-report__heading">
            <div>
              <span className="year-end-report__seal material-symbols-rounded" aria-hidden="true">military_tech</span>
              <p className="eyebrow">3年間の運営成果</p>
              <h1 id="ending-heading">最終評価報告</h1>
            </div>
            <span className="year-end-report__status">運営完了</span>
          </div>

          <section className="ending-score-board" aria-label={`総合スコア ${ending.score}、ランク ${ending.rank}`}>
            <div className="ending-score-board__rank">
              <small>FINAL RANK</small>
              <strong>{ending.rank}</strong>
            </div>
            <div className="ending-score-board__summary">
              <span>総合スコア</span>
              <strong>{ending.score}</strong>
              <h2>{ending.title}</h2>
            </div>
          </section>

          <section className="year-end-review" aria-labelledby="final-stats-heading">
            <div className="year-end-section-title">
              <span className="material-symbols-rounded" aria-hidden="true">analytics</span>
              <h2 id="final-stats-heading">最終運営ステータス</h2>
              <small>3年目3月終了時点</small>
            </div>
            <div className="year-end-stat-grid">
              {metricKeys.map((key) => (
                <div key={key} className={`year-end-stat year-end-stat--${getStatTone(key, stats[key])}`}>
                  <span className="material-symbols-rounded" aria-hidden="true">{statIcons[key]}</span>
                  <div>
                    <small>{statLabels[key]}</small>
                    <span className="year-end-stat__values"><strong>{stats[key]}</strong></span>
                  </div>
                  <span className="year-end-stat__bar" aria-hidden="true"><span style={{ width: `${stats[key]}%` }} /></span>
                </div>
              ))}
            </div>
          </section>

          <p className="ending-final-report__comment">{ending.comment}</p>
        </section>

        <aside className="ending-rank-showcase" aria-label={`${ending.rank}ランク ${ending.title}`}>
          <div className="ending-rank-showcase__ring" aria-hidden="true" />
          <span>RANK</span>
          <strong>{ending.rank}</strong>
          <h2>{ending.title}</h2>
          <img src={librarianUrl} alt="3年間を見届けた司書さん" />
        </aside>
      </main>

      <footer className="year-end-dialogue ending-report-dialogue">
        <span className="year-end-dialogue__name">司書さん</span>
        <div className="year-end-dialogue__message">
          <strong>3年間、本当におつかれさまでした。</strong>
          <p>あなたが育てた図書館の、その後を見届けましょう。</p>
        </div>
        <button type="button" className="year-end-dialogue__button" onClick={() => setPhase("epilogue")}>
          <span>エピローグを見る</span>
          <span className="material-symbols-rounded" aria-hidden="true">auto_stories</span>
        </button>
      </footer>
    </div>
  );
};
