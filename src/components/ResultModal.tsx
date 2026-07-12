import type { CSSProperties } from "react";
import { formatEffect, statKeys, statLabels } from "../game/calculations";
import type { StatKey, TurnResult } from "../game/types";

interface ResultModalProps {
  result: TurnResult | null;
  onClose: () => void;
}

const effectList = (effects: Partial<Record<StatKey, number>>) =>
  statKeys
    .filter((key) => effects[key] !== undefined && effects[key] !== 0)
    .map((key) => formatEffect(key, effects[key] ?? 0));

const EffectChips = ({ items }: { items: string[] }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <span className="result-effect-chips">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </span>
  );
};

interface StatDelta {
  key: StatKey;
  before: number;
  after: number;
  delta: number;
}

const formatDelta = (value: number) => (value > 0 ? `+${value}` : `${value}`);

const isFavorableDelta = (key: StatKey, delta: number) => {
  if (key === "staffFatigue") {
    return delta < 0;
  }

  return delta > 0;
};

const createStatDeltas = (result: TurnResult): StatDelta[] =>
  statKeys
    .map((key) => ({
      key,
      before: result.statsBefore[key],
      after: result.statsAfter[key],
      delta: result.statsAfter[key] - result.statsBefore[key],
    }))
    .filter((item) => item.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

const StatDeltaBoard = ({ items }: { items: StatDelta[] }) => {
  if (items.length === 0) {
    return (
      <div className="result-block result-delta-board">
        <h3>パラメータ変動</h3>
        <p>今月の数値変動はありません。</p>
      </div>
    );
  }

  const maxAbsDelta = Math.max(...items.map((item) => Math.abs(item.delta)), 1);

  return (
    <div className="result-block result-delta-board" aria-label="パラメータ変動グラフ">
      <div className="result-delta-board__header">
        <h3>パラメータ変動</h3>
        <span>月初 → 月末</span>
      </div>
      <div className="result-delta-list">
        {items.map((item, index) => {
          const barWidth = Math.max(5, (Math.abs(item.delta) / maxAbsDelta) * 50);
          const directionClass = item.delta > 0 ? "result-delta-row--positive" : "result-delta-row--negative";
          const toneClass = isFavorableDelta(item.key, item.delta)
            ? "result-delta-row--good"
            : "result-delta-row--bad";
          const rowStyle = {
            "--delta-width": `${barWidth}%`,
            "--delta-delay": `${index * 55}ms`,
          } as CSSProperties;

          return (
            <div key={item.key} className={`result-delta-row ${directionClass} ${toneClass}`} style={rowStyle}>
              <div className="result-delta-row__top">
                <span>{statLabels[item.key]}</span>
                <strong>{formatDelta(item.delta)}</strong>
              </div>
              <div
                className="result-delta-bar"
                aria-label={`${statLabels[item.key]} ${item.before}から${item.after}、${formatDelta(item.delta)}`}
              >
                <span />
              </div>
              <small>
                {item.before} → {item.after}
              </small>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ResultModal = ({ result, onClose }: ResultModalProps) => {
  if (!result) {
    return null;
  }

  const seasonalEffects = effectList(result.seasonalEffects);
  const randomEffects = result.randomEvent ? effectList(result.randomEvent.effects) : [];
  const statDeltas = createStatDeltas(result);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop result-backdrop"
      role="button"
      tabIndex={0}
      aria-label="月次結果を閉じて次の月へ進む"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <section className="modal result-modal" role="dialog" aria-modal="true" aria-labelledby="result-heading">
        <div className="modal__header">
          <div>
            <span className="result-kicker">今月の結果</span>
            <h2 id="result-heading">{result.title}</h2>
          </div>
          <span className="result-turn">Turn {result.turn} / 36</span>
        </div>

        <div className="result-report-grid">
          <StatDeltaBoard items={statDeltas} />

          <div className="result-block result-block--commands">
            <h3>実行コマンド</h3>
            {result.appliedCommands.length === 0 ? (
              <p>今月はコマンドを実行しませんでした。</p>
            ) : (
              <ul>
                {result.appliedCommands.map((command) => {
                  const commandEffects = [formatEffect("budget", command.budgetDelta), ...effectList(command.effects)];

                  return (
                    <li key={command.commandId}>
                      <strong>{command.commandName}</strong>
                      <EffectChips items={commandEffects} />
                      {command.notes.length > 0 && <small>{command.notes.join("、")}</small>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="result-block result-block--events">
            <h3>季節イベント</h3>
            {seasonalEffects.length > 0 ? <EffectChips items={seasonalEffects} /> : <p>追加効果はありません。</p>}
          </div>

          <div className="result-block result-block--events">
            <h3>ランダムイベント</h3>
            {result.randomEvent ? (
              <p>
                <strong>{result.randomEvent.event.title}</strong>
                <small>{result.randomEvent.event.description}</small>
                <EffectChips items={randomEffects} />
              </p>
            ) : (
              <p>発生しませんでした。</p>
            )}
          </div>
        </div>

        <p className="result-continue-hint">画面をクリックして次の月へ</p>
      </section>
    </div>
  );
};
