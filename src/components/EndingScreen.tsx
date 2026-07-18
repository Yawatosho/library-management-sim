import type { CSSProperties, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { randomEvents } from "../data/randomEvents";
import { getStatMeterPercent, metricKeys, statLabels } from "../game/calculations";
import { evaluateAnnualObjective } from "../game/annualObjectives";
import type { EndingResult, StatKey, Stats } from "../game/types";
import { AnnualObjectiveResultPanel } from "./AnnualObjectiveResultPanel";

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

const creditItems = [
  { role: "Illustration", name: "Chat GPT" },
  { role: "Programing", name: "Chat GPT" },
  { role: "Music", name: "Suno" },
  { role: "Sound Effect", name: "効果音ラボ" },
  { role: "Special Thanks", name: "図書館を愛する皆様" },
] as const;

export const EndingScreen = ({ ending, stats, onTitle }: EndingScreenProps) => {
  const [phase, setPhase] = useState<"report" | "epilogue" | "credits">("report");
  const [imageFailed, setImageFailed] = useState(false);
  const [creditsComplete, setCreditsComplete] = useState(false);
  const creditsTimerRef = useRef<number | null>(null);
  const rank = ending.rank.toLowerCase();
  const backgroundUrl = `${import.meta.env.BASE_URL}assets/images/background.png`;
  const librarianUrl = `${import.meta.env.BASE_URL}assets/images/librarian.png`;
  const endingImageUrl = `${import.meta.env.BASE_URL}assets/images/endings/rank-${rank}.png`;
  const style = { "--year-end-background": `url(${backgroundUrl})` } as CSSProperties;
  const annualObjective = ending.annualObjective ?? evaluateAnnualObjective(3, stats);
  const creditMemoryImages = useMemo(() => {
    const images = [...new Set(randomEvents.map((event) => `${event.imageId ?? event.id}.png`))];
    for (let index = images.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [images[index], images[swapIndex]] = [images[swapIndex]!, images[index]!];
    }
    return images.slice(0, 6);
  }, []);

  useEffect(() => {
    if (phase !== "credits") return;

    setCreditsComplete(false);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    creditsTimerRef.current = window.setTimeout(() => {
      creditsTimerRef.current = null;
      setCreditsComplete(true);
    }, reduceMotion ? 19000 : 32000);

    return () => {
      if (creditsTimerRef.current !== null) {
        window.clearTimeout(creditsTimerRef.current);
        creditsTimerRef.current = null;
      }
    };
  }, [phase]);

  const handleCreditsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (creditsComplete && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onTitle();
    }
  };

  if (phase === "credits") {
    return (
      <div
        className={`screen ending-credits ${creditsComplete ? "ending-credits--complete" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={creditsComplete ? "スタッフロール終了。クリックしてタイトルへ戻る" : "スタッフロール"}
        onClick={() => {
          if (creditsComplete) onTitle();
        }}
        onKeyDown={handleCreditsKeyDown}
      >
        <div className="ending-credits__memories" aria-hidden="true">
          {creditMemoryImages.map((imageName, index) => {
            const memoryStyle = {
              "--memory-delay": `${index * 4.4}s`,
              "--memory-rotation": `${index % 2 === 0 ? -1.8 : 1.4}deg`,
            } as CSSProperties;
            return (
              <figure
                key={imageName}
                className="ending-credits__photo-frame ending-credits__memory"
                style={memoryStyle}
              >
                <img src={`${import.meta.env.BASE_URL}assets/images/random-events/${imageName}`} alt="" />
              </figure>
            );
          })}
        </div>
        <div className="ending-credits__shade" aria-hidden="true" />
        <header className="ending-credits__header">
          <span>UNIVERSITY LIBRARY MAKER</span>
          <small>STAFF ROLL</small>
        </header>
        <div className="ending-credits__roll">
          {creditItems.map((item, index) => (
            <section
              key={item.role}
              className="ending-credits__item"
              style={{ "--credit-delay": `${index * 3.2}s` } as CSSProperties}
            >
              <span>{item.role}</span>
              <strong>{item.name}</strong>
            </section>
          ))}
        </div>
        <section className="ending-credits__final" onAnimationEnd={() => setCreditsComplete(true)}>
          <figure className="ending-credits__photo-frame ending-credits__final-photo">
            <img src={endingImageUrl} alt={`${ending.rank}ランク ${ending.title}の思い出`} />
          </figure>
          <div className="ending-credits__final-copy">
            <span>Produce</span>
            <strong>やわらか図書館学</strong>
            <h1>Thank you for playing</h1>
            <small className="ending-credits__return">CLICK TO TITLE</small>
          </div>
        </section>
      </div>
    );
  }

  if (phase === "epilogue") {
    return (
      <div
        className={`screen ending-epilogue ending-epilogue--${rank}`}
        role="button"
        tabIndex={0}
        aria-label="エピローグ。クリックしてスタッフロールへ"
        onClick={() => setPhase("credits")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setPhase("credits");
          }
        }}
      >
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
          <span className="ending-epilogue__next">CLICK TO STAFF ROLL</span>
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
                  <span className="year-end-stat__bar" aria-hidden="true"><span style={{ width: `${getStatMeterPercent(key, stats[key])}%` }} /></span>
                </div>
              ))}
            </div>
          </section>

          <AnnualObjectiveResultPanel result={annualObjective} />

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
          <p>あなたと一緒に育てた図書館の、その後を見届けましょう。</p>
        </div>
        <button type="button" className="year-end-dialogue__button" onClick={() => setPhase("epilogue")}>
          <span>エピローグを見る</span>
          <span className="material-symbols-rounded" aria-hidden="true">auto_stories</span>
        </button>
      </footer>
    </div>
  );
};
