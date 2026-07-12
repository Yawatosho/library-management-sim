import { commandById } from "../data/commands";
import { randomEvents } from "../data/randomEvents";
import { seasonalEventByMonth } from "../data/seasonalEvents";
import {
  applyEffects,
  calculateAppliedCommand,
  calculateEnding,
  calculateYearEnd,
  checkGameOver,
  formatEffect,
  getYearMonth,
} from "./calculations";
import type {
  Command,
  GameOverResult,
  GameState,
  RandomEventResult,
  StatKey,
  Stats,
  TurnResult,
  YearEndResult,
} from "./types";

export interface ResolvedTurn {
  result: TurnResult;
  stats: Stats;
  pendingYearEnd: YearEndResult | null;
  ending: ReturnType<typeof calculateEnding> | null;
  gameOver: GameOverResult | null;
}

const commandHasTag = (command: Command, tag: Command["tags"][number]) =>
  command.tags.includes(tag);

const selectedCommands = (state: GameState) =>
  state.selectedCommandIds.map((id) => commandById[id]);

const resolveMonthlySeasonalEffects = (
  month: number,
  commands: Command[],
  stats: Stats,
): Partial<Record<StatKey, number>> => {
  const effects: Partial<Record<StatKey, number>> = {};

  if (month === 6 && !commands.some((command) => commandHasTag(command, "publicity"))) {
    effects.reputation = -2;
  }

  if (month === 7) {
    effects.staffFatigue = (effects.staffFatigue ?? 0) + 3;
  }

  if (month === 12 && stats.budget >= 40) {
    effects.executiveTrust = (effects.executiveTrust ?? 0) - 3;
  }

  return effects;
};

const pickRandomEvent = (rng: () => number): RandomEventResult | null => {
  if (rng() >= 0.3) {
    return null;
  }

  const event = randomEvents[Math.floor(rng() * randomEvents.length)] ?? randomEvents[0]!;
  return {
    event,
    effects: event.effects,
  };
};

const getDebugRandomEvent = (state: GameState): RandomEventResult | null => {
  const event = randomEvents.find((candidate) => candidate.id === state.debugRandomEventId);
  return event ? { event, effects: event.effects } : pickRandomEvent(() => 0);
};

const createSummary = (
  statsBefore: Stats,
  statsAfter: Stats,
  randomEvent: RandomEventResult | null,
  seasonalEffects: Partial<Record<StatKey, number>>,
) => {
  const summary: string[] = [];
  const notableDiffs = (Object.keys(statsAfter) as StatKey[])
    .map((key) => ({ key, value: statsAfter[key] - statsBefore[key] }))
    .filter((diff) => Math.abs(diff.value) >= 4)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 4);

  for (const diff of notableDiffs) {
    summary.push(formatEffect(diff.key, diff.value));
  }

  if (Object.keys(seasonalEffects).length > 0) {
    summary.push("季節イベントの追加効果が発生");
  }

  if (randomEvent) {
    summary.push(`ランダムイベント: ${randomEvent.event.title}`);
  } else {
    summary.push("ランダムイベントは発生しませんでした");
  }

  return summary;
};

export const resolveTurn = (state: GameState, rng = Math.random): ResolvedTurn => {
  if (!state.selectedPolicyId) {
    throw new Error("Policy must be selected before resolving a turn.");
  }

  const statsBefore = { ...state.stats };
  const { year, month } = getYearMonth(state.turn);
  let monthlyStats = { ...state.stats };
  const commands = selectedCommands(state);
  const appliedCommands = state.selectedCommandIds.map((commandId) => {
    const applied = calculateAppliedCommand(
      commandId,
      state.selectedPolicyId!,
      month,
      state.stats.staffMorale,
      monthlyStats,
    );
    monthlyStats = applyEffects(monthlyStats, {
      budget: applied.budgetDelta,
      ...applied.effects,
    });
    return applied;
  });

  const seasonalEffects = resolveMonthlySeasonalEffects(month, commands, monthlyStats);
  monthlyStats = applyEffects(monthlyStats, seasonalEffects);

  const randomEvent =
    state.debugRandomEventMode === "disable"
      ? null
      : state.debugRandomEventMode === "force"
        ? getDebugRandomEvent(state)
        : pickRandomEvent(rng);
  if (randomEvent) {
    monthlyStats = applyEffects(monthlyStats, randomEvent.effects);
  }

  const result: TurnResult = {
    turn: state.turn,
    year,
    month,
    title: `${year}年目 ${month}月の結果`,
    appliedCommands,
    seasonalEffects,
    randomEvent,
    statsBefore,
    statsAfter: monthlyStats,
    summary: createSummary(statsBefore, monthlyStats, randomEvent, seasonalEffects),
  };

  let finalStats = monthlyStats;
  let pendingYearEnd: YearEndResult | null = null;
  let ending: ReturnType<typeof calculateEnding> | null = null;
  let gameOver = checkGameOver(monthlyStats);

  if (!gameOver && state.turn === 36) {
    ending = calculateEnding(monthlyStats);
  } else if (!gameOver && month === 3) {
    pendingYearEnd = calculateYearEnd(year, monthlyStats, state.yearStartStats ?? state.stats);
    finalStats = pendingYearEnd.statsAfter;
    gameOver = checkGameOver(finalStats);
  }

  const seasonalEvent = seasonalEventByMonth[month];
  if (seasonalEvent) {
    result.summary.unshift(`${seasonalEvent.title}: ${seasonalEvent.effectNote}`);
  }

  return {
    result,
    stats: finalStats,
    pendingYearEnd,
    ending,
    gameOver,
  };
};
