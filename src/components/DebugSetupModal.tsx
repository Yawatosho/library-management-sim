import { useState } from "react";
import { randomEvents } from "../data/randomEvents";
import { initialStats } from "../game/initialState";
import { calculateEnding, formatEffect, statKeys, statLabels } from "../game/calculations";
import { RANDOM_EVENT_RATE } from "../game/eventResolver";
import type { DebugRandomEventMode, RandomEventId, Stats } from "../game/types";

export interface DebugGameConfig {
  turn: number;
  stats: Stats;
  randomEventMode: DebugRandomEventMode;
  randomEventId: RandomEventId;
}

interface DebugSetupModalProps {
  onClose: () => void;
  onStart: (config: DebugGameConfig) => void;
}

const dates = Array.from({ length: 36 }, (_, index) => {
  const year = Math.floor(index / 12) + 1;
  const month = ((index + 3) % 12) + 1;
  return { turn: index + 1, label: `${year}年目 ${month}月` };
});

const rankPresets = [
  { rank: "S", score: 114, label: "伝説" },
  { rank: "A", score: 103, label: "信頼" },
  { rank: "B", score: 95, label: "堅実" },
  { rank: "C", score: 88, label: "継続" },
  { rank: "D", score: 80, label: "要改革" },
  { rank: "E", score: 66, label: "危機" },
] as const;

const createRankPresetStats = (score: number): Stats => ({
  budget: 100,
  collection: score,
  studentSatisfaction: score,
  facultyTrust: score,
  executiveTrust: score,
  publicity: score,
  staffMorale: 80,
  staffFatigue: 30,
  facility: score,
  researchSupport: score,
  dx: score,
  reputation: score,
});

const gameOverPresets = [
  { key: "budget", value: -20, icon: "payments", label: "財政破綻", note: "予算 -20" },
  { key: "staffFatigue", value: 100, icon: "battery_alert", label: "職員崩壊", note: "疲労 100" },
  { key: "reputation", value: 0, icon: "stars", label: "信頼喪失", note: "評判 0" },
  { key: "studentSatisfaction", value: 0, icon: "school", label: "学生離れ", note: "満足度 0" },
  { key: "facultyTrust", value: 0, icon: "groups", label: "教員信頼喪失", note: "教員信頼 0" },
] as const satisfies ReadonlyArray<{ key: keyof Stats; value: number; icon: string; label: string; note: string }>;

export const DebugSetupModal = ({ onClose, onStart }: DebugSetupModalProps) => {
  const [turn, setTurn] = useState(1);
  const [stats, setStats] = useState<Stats>({ ...initialStats });
  const [randomEventMode, setRandomEventMode] = useState<DebugRandomEventMode>("normal");
  const [randomEventId, setRandomEventId] = useState<RandomEventId>(randomEvents[0]!.id);
  const selectedRandomEvent = randomEvents.find((event) => event.id === randomEventId) ?? randomEvents[0]!;
  const previewEnding = calculateEnding(stats);

  const updateStat = (key: keyof Stats, value: number) => {
    const normalized = key === "budget"
      ? Math.max(-50, Math.min(300, value))
      : key === "staffFatigue"
        ? Math.max(0, Math.min(100, value))
        : Math.max(0, Math.min(300, value));
    setStats((current) => ({ ...current, [key]: normalized }));
  };

  const applyRankPreset = (score: number) => {
    setTurn(36);
    setStats(createRankPresetStats(score));
    setRandomEventMode("disable");
  };

  const applyGameOverPreset = (key: keyof Stats, value: number) => {
    setTurn(1);
    setStats({ ...initialStats, [key]: value });
    setRandomEventMode("disable");
  };

  return (
    <div className="modal-backdrop debug-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal debug-modal" role="dialog" aria-modal="true" aria-labelledby="debug-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal__header">
          <div>
            <span>DEVELOPMENT TOOLS</span>
            <h2 id="debug-title">デバッグモード</h2>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>閉じる</button>
        </header>

        <div className="debug-section">
          <label htmlFor="debug-date">開始年月</label>
          <select id="debug-date" value={turn} onChange={(event) => setTurn(Number(event.target.value))}>
            {dates.map((date) => <option key={date.turn} value={date.turn}>{date.label}</option>)}
          </select>
        </div>

        <div className="debug-section debug-rank-section">
          <div className="debug-section__heading">
            <span>クリアランク確認</span>
            <small>現在の予測: {previewEnding.rank} / {previewEnding.score}点</small>
          </div>
          <p>ランクを選ぶと、3年目3月・イベントなしの確認用パラメータを設定します。</p>
          <div className="debug-rank-presets" aria-label="クリアランクのプリセット">
            {rankPresets.map((preset) => (
              <button
                key={preset.rank}
                type="button"
                className={previewEnding.rank === preset.rank && turn === 36 && randomEventMode === "disable" ? "is-active" : ""}
                onClick={() => applyRankPreset(preset.score)}
              >
                <strong>{preset.rank}</strong>
                <span>{preset.label}</span>
                <small>{preset.score}点</small>
              </button>
            ))}
          </div>
        </div>

        <div className="debug-section debug-game-over-section">
          <div className="debug-section__heading">
            <span>ゲームオーバー確認</span>
            <small>メイン画面で次月へ進めると表示</small>
          </div>
          <div className="debug-game-over-presets" aria-label="ゲームオーバー条件のプリセット">
            {gameOverPresets.map((preset) => (
              <button key={preset.key} type="button" onClick={() => applyGameOverPreset(preset.key, preset.value)}>
                <span className="material-symbols-rounded" aria-hidden="true">{preset.icon}</span>
                <strong>{preset.label}</strong>
                <small>{preset.note}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="debug-section">
          <div className="debug-section__heading"><span>パラメータ</span><button type="button" className="text-button" onClick={() => setStats({ ...initialStats })}>初期値に戻す</button></div>
          <div className="debug-stat-grid">
            {statKeys.map((key) => (
              <label key={key}>
                <span>{statLabels[key]}</span>
                <input type="number" min={key === "budget" ? -50 : 0} max={key === "staffFatigue" ? 100 : 300} value={stats[key]} onChange={(event) => updateStat(key, Number(event.target.value))} />
              </label>
            ))}
          </div>
        </div>

        <fieldset className="debug-section debug-event-mode">
          <legend>ランダムイベント</legend>
          <label><input type="radio" name="random-event" checked={randomEventMode === "normal"} onChange={() => setRandomEventMode("normal")} />通常抽選（{Math.round(RANDOM_EVENT_RATE * 100)}%）</label>
          <label><input type="radio" name="random-event" checked={randomEventMode === "force"} onChange={() => setRandomEventMode("force")} />必ず発生</label>
          <label><input type="radio" name="random-event" checked={randomEventMode === "disable"} onChange={() => setRandomEventMode("disable")} />発生しない</label>
          {randomEventMode === "force" && (
            <div className="debug-event-picker">
              <label htmlFor="debug-random-event">発生イベント</label>
              <select id="debug-random-event" value={randomEventId} onChange={(event) => setRandomEventId(event.target.value as RandomEventId)}>
                {randomEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.tone === "good" ? "GOOD" : event.tone === "bad" ? "BAD" : "CHOICE"}｜{event.title}
                  </option>
                ))}
              </select>
              <p>{selectedRandomEvent.description}</p>
              <div className="debug-event-effects">
                {selectedRandomEvent.choices
                  ? selectedRandomEvent.choices.map((choice) => <span key={choice.id}>{choice.label}</span>)
                  : Object.entries(selectedRandomEvent.effects).map(([key, value]) => (
                      <span key={key}>{formatEffect(key as keyof Stats, value ?? 0)}</span>
                    ))}
              </div>
            </div>
          )}
        </fieldset>

        <button type="button" className="primary-button debug-start" onClick={() => onStart({ turn, stats, randomEventMode, randomEventId })}>この設定で開始</button>
      </section>
    </div>
  );
};
