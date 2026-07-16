import type { CSSProperties, Dispatch } from "react";
import { useEffect, useRef, useState } from "react";
import { commandById } from "../data/commands";
import { policyById } from "../data/policies";
import { seasonalEventByMonth } from "../data/seasonalEvents";
import { calculateAppliedCommand, finalEvaluationTarget, formatEffect, getYearMonth, statKeys } from "../game/calculations";
import { evaluateAnnualObjective } from "../game/annualObjectives";
import type { GameAction } from "../game/reducer";
import { getSeason, seasonMeta } from "../game/seasons";
import { playSoundEffect } from "../game/soundEffects";
import type { CommandId, GameState, StatKey } from "../game/types";
import { CommandPanel } from "./CommandPanel";
import { AnnualObjectiveBadge, AnnualObjectiveModal } from "./AnnualObjectivePanel";
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
  const [librarianExpressionImageFailed, setLibrarianExpressionImageFailed] = useState(false);
  const [randomEventImageFailed, setRandomEventImageFailed] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [objectiveModalOpen, setObjectiveModalOpen] = useState(false);
  const [previewCommandId, setPreviewCommandId] = useState<CommandId | null>(null);
  const [viewedRandomEventKey, setViewedRandomEventKey] = useState<string | null>(null);
  const [isMonthTransitioning, setIsMonthTransitioning] = useState(false);
  const monthTransitionTimerRef = useRef<number | null>(null);
  const announcedResultKeyRef = useRef<string | null>(null);
  const { year, month } = getYearMonth(state.turn);
  const annualObjective = evaluateAnnualObjective(year, state.stats);
  const seasonalEvent = seasonalEventByMonth[month];
  const season = getSeason(month);
  const seasonInfo = seasonMeta[season];
  const selectedPolicyName = state.selectedPolicyId ? policyById[state.selectedPolicyId].name : "方針を選択";
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
  const activeRandomEventChoices =
    activeRandomEvent?.event.choices && !activeRandomEvent.choiceId
      ? activeRandomEvent.event.choices
      : null;
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
  const librarianImagePrefix =
    season === "summer"
      ? "librarian_summer"
      : season === "winter"
        ? "librarian_winter"
        : "librarian";
  const librarianExpression = ["cheer", "worried", "explain"].includes(state.assistant.expression)
    ? state.assistant.expression
    : null;
  const librarianImageName = librarianExpression
    ? `${librarianImagePrefix}_${librarianExpression}.png`
    : `${librarianImagePrefix}.png`;
  const librarianUrl = `${import.meta.env.BASE_URL}assets/images/${librarianImageName}`;
  const librarianFallbackUrl = `${import.meta.env.BASE_URL}assets/images/${librarianImagePrefix}.png`;
  const displayedLibrarianUrl = librarianExpressionImageFailed ? librarianFallbackUrl : librarianUrl;
  const randomEventImageUrl = activeRandomEvent
    ? `${import.meta.env.BASE_URL}assets/images/random-events/${activeRandomEvent.event.imageId ?? activeRandomEvent.event.id}.png`
    : "";
  const screenStyle = {
    "--game-background": `url(${backgroundUrl})`,
  } as CSSProperties;
  const nextTurn = Math.min(36, state.turn + 1);
  const nextDate = getYearMonth(nextTurn);
  const nextSeason = getSeason(nextDate.month);
  const nextSeasonInfo = seasonMeta[nextSeason];
  const monthTransition = state.gameOver
    ? {
        currentLabel: `${year}年目 ${month}月`,
        nextLabel: "運営記録へ",
        icon: "menu_book",
        season,
        progress: state.turn,
      }
    : state.ending
      ? {
          currentLabel: `${year}年目 ${month}月`,
          nextLabel: "最終評価へ",
          icon: "workspace_premium",
          season,
          progress: 36,
        }
      : state.pendingYearEnd
        ? {
            currentLabel: `${year}年目 ${month}月`,
            nextLabel: `${year}年目 年度末評価`,
            icon: "fact_check",
            season,
            progress: state.turn,
          }
        : {
            currentLabel: `${year}年目 ${month}月`,
            nextLabel: `${nextDate.year}年目 ${nextDate.month}月`,
            icon: nextSeasonInfo.icon,
            season: nextSeason,
            progress: nextTurn,
          };

  useEffect(() => {
    setLibrarianImageFailed(false);
    setLibrarianExpressionImageFailed(false);
  }, [librarianUrl, librarianFallbackUrl]);

  useEffect(() => {
    setRandomEventImageFailed(false);
  }, [randomEventKey]);

  useEffect(() => {
    if (!state.lastResult) {
      announcedResultKeyRef.current = null;
      return;
    }

    const resultKey = `${state.lastResult.turn}:${state.lastResult.randomEvent?.event.id ?? "report"}`;
    if (announcedResultKeyRef.current === resultKey) return;

    announcedResultKeyRef.current = resultKey;
    playSoundEffect(state.lastResult.randomEvent ? "event" : "report_open");
  }, [state.lastResult]);

  useEffect(() => {
    if (resultOpen) setObjectiveModalOpen(false);
  }, [resultOpen]);

  useEffect(() => () => {
    if (monthTransitionTimerRef.current !== null) {
      window.clearTimeout(monthTransitionTimerRef.current);
    }
  }, []);

  const dismissResultWithMonthTransition = () => {
    if (isMonthTransitioning || state.lastResult === null) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    playSoundEffect("calendar_advance");
    setIsMonthTransitioning(true);
    monthTransitionTimerRef.current = window.setTimeout(() => {
      monthTransitionTimerRef.current = null;
      setIsMonthTransitioning(false);
      dispatch({ type: "DISMISS_RESULT" });
    }, reduceMotion ? 40 : 1540);
  };

  return (
    <div className={`screen main-screen sim-screen sim-screen--${season}`} style={screenStyle}>
      <header className="sim-topbar">
        <div className={`sim-title-block sim-calendar sim-calendar--${season}`} aria-label={`${year}年目${month}月`}>
          <div className="sim-calendar__leaf" aria-hidden="true">
            <span className="material-symbols-rounded">{seasonInfo.icon}</span>
          </div>
          <div className="sim-calendar__body">
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
            className={`status-pill status-pill--wide ${state.selectedPolicyId ? "" : "status-pill--prompt"}`}
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
            meterValue={state.stats.staffMorale / finalEvaluationTarget * 100}
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

        <div className="sim-topbar-tools">
          <AnnualObjectiveBadge
            result={annualObjective}
            onOpen={() => setObjectiveModalOpen(true)}
            disabled={resultOpen}
            variant="topbar"
          />
          <div className="topbar__actions">
            <SeasonalBgm season={season} />
            <button type="button" className="ghost-button sim-utility-button" onClick={() => dispatch({ type: "OPEN_HELP" })}>
              <span className="material-symbols-rounded" aria-hidden="true">menu_book</span>
              <span>ヘルプ</span>
            </button>
            <button type="button" className="ghost-button sim-utility-button" onClick={() => dispatch({ type: "GO_TITLE" })}>
              <span className="material-symbols-rounded" aria-hidden="true">home</span>
              <span>タイトル</span>
            </button>
          </div>
        </div>
      </header>

      <main className="sim-layout">
        <aside className="sim-side sim-side--left">
          <CommandPanel
            selectedCommandIds={state.selectedCommandIds}
            apRemaining={state.apRemaining}
            selectedPolicyId={state.selectedPolicyId}
            onToggle={(commandId) => {
              playSoundEffect(state.selectedCommandIds.includes(commandId) ? "ui_cancel" : "ui_select");
              dispatch({ type: "TOGGLE_COMMAND", commandId });
            }}
            onExecute={() => dispatch({ type: "EXECUTE_TURN" })}
            onClear={() => {
              playSoundEffect("ui_cancel");
              dispatch({ type: "CLEAR_COMMANDS" });
            }}
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
                    {activeRandomEvent.event.tone === "good"
                      ? "auto_awesome"
                      : activeRandomEvent.event.tone === "choice"
                        ? "multiple_stop"
                        : "warning"}
                  </span>
                  <strong>{activeRandomEvent.event.title}</strong>
                  <small>assets/images/random-events/{activeRandomEvent.event.id}.png</small>
                </div>
              )}
            </div>
          ) : (
            <div className="sim-stage__character" aria-label="司書さん">
              {!librarianImageFailed ? (
                <img
                  src={displayedLibrarianUrl}
                  alt="司書さん"
                  onError={() => {
                    if (displayedLibrarianUrl !== librarianFallbackUrl) {
                      setLibrarianExpressionImageFailed(true);
                    } else {
                      setLibrarianImageFailed(true);
                    }
                  }}
                />
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
            <div className={`dialogue-window__event-content ${activeRandomEventChoices ? "dialogue-window__event-content--choice" : ""}`}>
              <div className="dialogue-window__event-text">
                {!activeRandomEvent.choiceId && <span>{activeRandomEvent.event.title}</span>}
                <p>{activeRandomEvent.choiceResultMessage ?? activeRandomEvent.event.description}</p>
                {!activeRandomEventChoices && activeRandomEventEffects.length > 0 && (
                  <div className="dialogue-window__event-effects" aria-label="イベント効果">
                    {activeRandomEventEffects.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                )}
              </div>
              {activeRandomEventChoices ? (
                <div className="dialogue-window__choices" aria-label="対応を選択">
                  {activeRandomEventChoices.map((choice) => (
                    <button
                      type="button"
                      key={choice.id}
                      className="dialogue-window__choice"
                      onClick={() => {
                        playSoundEffect("ui_select");
                        dispatch({ type: "RESOLVE_RANDOM_EVENT_CHOICE", choiceId: choice.id });
                      }}
                    >
                      <span className="dialogue-window__choice-heading">
                        <strong>{choice.label}</strong>
                        <span className="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
                      </span>
                      <span className="dialogue-window__choice-description">{choice.description}</span>
                      <span className="dialogue-window__choice-effects">
                        {effectList(choice.effects).map((item) => <small key={item}>{item}</small>)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  className="primary-button dialogue-window__event-button"
                  onClick={() => {
                    playSoundEffect("report_open");
                    setViewedRandomEventKey(randomEventKey);
                  }}
                >
                  月次レポートへ
                </button>
              )}
            </div>
          ) : (
            <p>{state.assistant.message}</p>
          )}
        </footer>
      </main>

      {policyModalOpen && (
        <PolicyModal
          selectedPolicyId={state.selectedPolicyId}
          onSelect={(policyId) => {
            playSoundEffect("ui_select");
            dispatch({ type: "SELECT_POLICY", policyId });
          }}
          onClose={() => setPolicyModalOpen(false)}
        />
      )}

      {objectiveModalOpen && (
        <AnnualObjectiveModal result={annualObjective} onClose={() => setObjectiveModalOpen(false)} />
      )}
      <ResultModal
        result={showRandomEventScene ? null : state.lastResult}
        transition={monthTransition}
        isClosing={isMonthTransitioning}
        onClose={dismissResultWithMonthTransition}
      />
    </div>
  );
};
