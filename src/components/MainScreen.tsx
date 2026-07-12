import type { CSSProperties, Dispatch } from "react";
import { useEffect, useState } from "react";
import { commandById } from "../data/commands";
import { policyById } from "../data/policies";
import { seasonalEventByMonth } from "../data/seasonalEvents";
import { calculateAppliedCommand, formatEffect, getYearMonth, statKeys } from "../game/calculations";
import type { GameAction } from "../game/reducer";
import { getSeason, seasonMeta } from "../game/seasons";
import type { CommandId, GameState, StatKey } from "../game/types";
import { CommandPanel } from "./CommandPanel";
import { PolicyModal } from "./PolicyModal";
import { ResultModal } from "./ResultModal";
import { SeasonalBgm } from "./SeasonalBgm";
import { StatsPanel } from "./StatsPanel";

interface MainScreenProps {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

interface StatusPillProps {
  icon: string;
  label: string;
  value: string | number;
  className?: string;
  meterValue?: number;
  previewDelta?: number;
  previewTone?: "good" | "bad";
  onClick?: () => void;
  disabled?: boolean;
}

const getStatusClass = (value: number, dangerPoint: number, warningPoint: number, inverse = false) => {
  if (inverse) {
    if (value >= dangerPoint) return "status-pill status-pill--danger";
    if (value >= warningPoint) return "status-pill status-pill--warn";
    return "status-pill";
  }

  if (value <= dangerPoint) return "status-pill status-pill--danger";
  if (value <= warningPoint) return "status-pill status-pill--warn";
  return "status-pill";
};

const meterWidth = (value: number) => Math.max(0, Math.min(100, value));

const formatPreviewDelta = (value: number) => `${value > 0 ? "+" : ""}${value}`;

const getHudPreviewTone = (key: "budget" | "staffFatigue", value?: number) => {
  if (value === undefined || value === 0) {
    return undefined;
  }

  if (key === "budget") {
    return value > 0 ? "good" : "bad";
  }

  return value < 0 ? "good" : "bad";
};

const effectList = (effects: Partial<Record<StatKey, number>>) =>
  statKeys
    .filter((key) => effects[key] !== undefined && effects[key] !== 0)
    .map((key) => formatEffect(key, effects[key] ?? 0));

const StatusPill = ({
  icon,
  label,
  value,
  className = "status-pill",
  meterValue,
  previewDelta,
  previewTone,
  onClick,
  disabled,
}: StatusPillProps) => {
  const content = (
    <>
      <span className="status-pill__label">
        <span className="material-symbols-rounded status-pill__icon" aria-hidden="true">
          {icon}
        </span>
        {label}
      </span>
      <span className="status-pill__value">
        <strong>{value}</strong>
        {previewDelta !== undefined && previewDelta !== 0 && previewTone && (
          <span className={`status-pill__preview status-pill__preview--${previewTone}`}>
            {formatPreviewDelta(previewDelta)}
          </span>
        )}
      </span>
      {meterValue !== undefined && (
        <span className="status-pill__meter" aria-hidden="true">
          <span style={{ width: `${meterWidth(meterValue)}%` }} />
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={`${className} status-pill--button`} onClick={onClick} disabled={disabled}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
};

export const MainScreen = ({ state, dispatch }: MainScreenProps) => {
  const [librarianImageFailed, setLibrarianImageFailed] = useState(false);
  const [randomEventImageFailed, setRandomEventImageFailed] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [previewCommandId, setPreviewCommandId] = useState<CommandId | null>(null);
  const [viewedRandomEventKey, setViewedRandomEventKey] = useState<string | null>(null);
  const { year, month } = getYearMonth(state.turn);
  const seasonalEvent = seasonalEventByMonth[month];
  const season = getSeason(month);
  const seasonInfo = seasonMeta[season];
  const selectedPolicyName = state.selectedPolicyId ? policyById[state.selectedPolicyId].name : "未選択";
  const resultOpen = state.lastResult !== null;
  const randomEventKey = state.lastResult?.randomEvent
    ? `${state.lastResult.turn}:${state.lastResult.randomEvent.event.id}`
    : null;
  const showRandomEventScene =
    state.lastResult?.randomEvent !== null &&
    state.lastResult?.randomEvent !== undefined &&
    randomEventKey !== null &&
    viewedRandomEventKey !== randomEventKey;
  const activeRandomEvent = showRandomEventScene ? state.lastResult?.randomEvent : null;
  const activeRandomEventEffects = activeRandomEvent ? effectList(activeRandomEvent.effects) : [];
  const previewEffects: Partial<Record<StatKey, number>> = (() => {
    if (previewCommandId === null) {
      return {};
    }

    if (state.selectedPolicyId) {
      const applied = calculateAppliedCommand(
        previewCommandId,
        state.selectedPolicyId,
        month,
        state.stats.staffMorale,
        state.stats,
      );
      return { budget: applied.budgetDelta, ...applied.effects };
    }

    const command = commandById[previewCommandId];
    return { budget: -command.budgetCost, ...command.effects };
  })();
  const backgroundUrl = `${import.meta.env.BASE_URL}assets/images/background.png`;
  const librarianImageName =
    season === "summer"
      ? "librarian_summer.png"
      : season === "winter"
        ? "librarian_winter.png"
        : "librarian.png";
  const librarianUrl = `${import.meta.env.BASE_URL}assets/images/${librarianImageName}`;
  const randomEventImageUrl = activeRandomEvent
    ? `${import.meta.env.BASE_URL}assets/images/random-events/${activeRandomEvent.event.id}.png`
    : "";
  const screenStyle = {
    "--game-background": `url(${backgroundUrl})`,
  } as CSSProperties;

  useEffect(() => {
    setLibrarianImageFailed(false);
  }, [librarianUrl]);

  useEffect(() => {
    setRandomEventImageFailed(false);
  }, [randomEventKey]);

  return (
    <div className={`screen main-screen sim-screen sim-screen--${season}`} style={screenStyle}>
      <header className="sim-topbar">
        <div className={`sim-title-block sim-calendar sim-calendar--${season}`} aria-label={`${year}年目${month}月`}>
          <div className="sim-calendar__leaf" aria-hidden="true">
            <span className="material-symbols-rounded">{seasonInfo.icon}</span>
          </div>
          <div className="sim-calendar__body">
            <span className="eyebrow">University Library Maker</span>
            <h1>
              {year}年目 {month}月
            </h1>
            <div className="sim-calendar__season">
              <span className="material-symbols-rounded" aria-hidden="true">
                {seasonInfo.icon}
              </span>
              <strong>{seasonInfo.label}</strong>
              <small>
                {seasonInfo.range} / {seasonInfo.term}
              </small>
            </div>
          </div>
        </div>

        <section className="status-strip sim-hud" aria-label="運営状況">
          <StatusPill
            icon="flag"
            label="重点方針"
            value={selectedPolicyName}
            className="status-pill status-pill--wide"
            onClick={() => setPolicyModalOpen(true)}
            disabled={resultOpen}
          />
          <StatusPill
            icon="account_balance_wallet"
            label="予算"
            value={state.stats.budget}
            meterValue={state.stats.budget}
            previewDelta={previewEffects.budget}
            previewTone={getHudPreviewTone("budget", previewEffects.budget)}
            className={`${getStatusClass(state.stats.budget, 5, 20)} status-pill--meter`}
          />
          <StatusPill
            icon="battery_alert"
            label="職員疲労"
            value={state.stats.staffFatigue}
            meterValue={state.stats.staffFatigue}
            previewDelta={previewEffects.staffFatigue}
            previewTone={getHudPreviewTone("staffFatigue", previewEffects.staffFatigue)}
            className={`${getStatusClass(state.stats.staffFatigue, 80, 60, true)} status-pill--meter`}
          />
          <StatusPill
            icon="volunteer_activism"
            label="職員士気"
            value={state.stats.staffMorale}
            meterValue={state.stats.staffMorale}
            previewDelta={previewEffects.staffMorale}
            previewTone={
              previewEffects.staffMorale === undefined || previewEffects.staffMorale === 0
                ? undefined
                : previewEffects.staffMorale > 0
                  ? "good"
                  : "bad"
            }
            className={`${getStatusClass(state.stats.staffMorale, 20, 40)} status-pill--meter`}
          />
        </section>

        <div className="topbar__actions">
          <SeasonalBgm season={season} />
          <button type="button" className="ghost-button" onClick={() => dispatch({ type: "OPEN_HELP" })}>
            ヘルプ
          </button>
          <button type="button" className="ghost-button" onClick={() => dispatch({ type: "GO_TITLE" })}>
            タイトル
          </button>
        </div>
      </header>

      <main className="sim-layout">
        <aside className="sim-side sim-side--left">
          <CommandPanel
            selectedCommandIds={state.selectedCommandIds}
            apRemaining={state.apRemaining}
            selectedPolicyId={state.selectedPolicyId}
            onToggle={(commandId) => dispatch({ type: "TOGGLE_COMMAND", commandId })}
            onExecute={() => dispatch({ type: "EXECUTE_TURN" })}
            onClear={() => dispatch({ type: "CLEAR_COMMANDS" })}
            onPreviewChange={setPreviewCommandId}
            disabled={resultOpen}
          />
        </aside>

        <section className="sim-stage" aria-label="図書館ロビー">
          <div className="sim-stage__shade" aria-hidden="true" />
          {seasonalEvent && (
            <section className="month-event sim-stage__event">
              <div>
                <span>月次レポート</span>
                <h2>{seasonalEvent.title}</h2>
              </div>
              <p>{seasonalEvent.description}</p>
              <strong>{seasonalEvent.effectNote}</strong>
            </section>
          )}

          {activeRandomEvent ? (
            <div
              className={`sim-stage__random-event sim-stage__random-event--${activeRandomEvent.event.tone}`}
              aria-label={activeRandomEvent.event.title}
            >
              {!randomEventImageFailed ? (
                <img
                  src={randomEventImageUrl}
                  alt={activeRandomEvent.event.title}
                  onError={() => setRandomEventImageFailed(true)}
                />
              ) : (
                <div className="sim-stage__random-placeholder">
                  <span className="material-symbols-rounded" aria-hidden="true">
                    {activeRandomEvent.event.tone === "good" ? "auto_awesome" : "warning"}
                  </span>
                  <strong>{activeRandomEvent.event.title}</strong>
                  <small>assets/images/random-events/{activeRandomEvent.event.id}.png</small>
                </div>
              )}
            </div>
          ) : (
            <div className="sim-stage__character" aria-label="司書さん">
              {!librarianImageFailed ? (
                <img src={librarianUrl} alt="司書さん" onError={() => setLibrarianImageFailed(true)} />
              ) : (
                <div className="sim-stage__placeholder">
                  <span>司書さん</span>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="sim-side sim-side--right">
          <StatsPanel
            stats={state.stats}
            title="育成パラメータ"
            excludeKeys={["budget", "staffFatigue", "staffMorale"]}
            previewEffects={previewEffects}
          />
        </aside>

        <footer
          className={`dialogue-window ${
            activeRandomEvent
              ? `dialogue-window--event dialogue-window--event-${activeRandomEvent.event.tone}`
              : `dialogue-window--${state.assistant.expression}`
          }`}
        >
          <div className="dialogue-window__name">{activeRandomEvent ? "ランダムイベント" : "司書さん"}</div>
          {activeRandomEvent ? (
            <div className="dialogue-window__event-content">
              <div className="dialogue-window__event-text">
                <span>{activeRandomEvent.event.title}</span>
                <p>{activeRandomEvent.event.description}</p>
                {activeRandomEventEffects.length > 0 && (
                  <div className="dialogue-window__event-effects" aria-label="イベント効果">
                    {activeRandomEventEffects.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="primary-button dialogue-window__event-button"
                onClick={() => {
                  setViewedRandomEventKey(randomEventKey);
                }}
              >
                月次レポートへ
              </button>
            </div>
          ) : (
            <p>{state.assistant.message}</p>
          )}
        </footer>
      </main>

      {policyModalOpen && (
        <PolicyModal
          selectedPolicyId={state.selectedPolicyId}
          onSelect={(policyId) => dispatch({ type: "SELECT_POLICY", policyId })}
          onClose={() => setPolicyModalOpen(false)}
        />
      )}
      <ResultModal result={showRandomEventScene ? null : state.lastResult} onClose={() => dispatch({ type: "DISMISS_RESULT" })} />
    </div>
  );
};
