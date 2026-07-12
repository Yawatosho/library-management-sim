import {
  commandAdvice,
  monthMessages,
  resultExpressions,
  warningMessages,
} from "../data/assistantMessages";
import { commandById } from "../data/commands";
import { policyById } from "../data/policies";
import { createInitialState } from "./initialState";
import { getYearMonth } from "./calculations";
import { resolveTurn } from "./eventResolver";
import type { CommandId, DebugRandomEventMode, GameState, LogEntry, PolicyId, RandomEventId, Screen, Stats } from "./types";

export type GameAction =
  | { type: "NEW_GAME" }
  | { type: "ADVANCE_INTRO" }
  | { type: "FINISH_INTRO" }
  | { type: "CONTINUE_GAME" }
  | { type: "GO_TITLE" }
  | { type: "OPEN_HELP" }
  | { type: "CLOSE_HELP" }
  | { type: "SELECT_POLICY"; policyId: PolicyId }
  | { type: "TOGGLE_COMMAND"; commandId: CommandId }
  | { type: "CLEAR_COMMANDS" }
  | { type: "EXECUTE_TURN" }
  | { type: "DISMISS_RESULT" }
  | { type: "CONTINUE_AFTER_YEAR_END" }
  | { type: "DELETE_SAVE" }
  | { type: "START_DEBUG_GAME"; turn: number; stats: Stats; randomEventMode: DebugRandomEventMode; randomEventId: RandomEventId };

const withTimestamp = (state: GameState): GameState => ({
  ...state,
  savedAt: new Date().toISOString(),
});

const pushLog = (state: GameState, entries: string[]): LogEntry[] => {
  const logEntries = entries.map((text) => ({ turn: state.turn, text }));
  return [...logEntries, ...state.log].slice(0, 80);
};

const resetMonthSelection = (state: GameState): GameState => {
  const { month } = getYearMonth(state.turn);

  return {
    ...state,
    apRemaining: 3,
    selectedPolicyId: null,
    selectedCommandIds: [],
    lastResult: null,
    assistant: {
      expression: "normal",
      message: getMonthMessage(month),
    },
  };
};

const getMonthMessage = (month: number) =>
  monthMessages[month] ?? "今月の状況を確認して、重点方針を選びましょう。";

const setScreen = (state: GameState, screen: Screen): GameState => ({
  ...state,
  screen,
});

const getWarningMessage = (state: GameState) => {
  if (state.stats.budget <= 5) {
    return warningMessages.budget;
  }
  if (state.stats.staffFatigue >= 80) {
    return warningMessages.fatigue;
  }
  if (state.stats.reputation <= 20) {
    return warningMessages.reputation;
  }
  if (state.stats.studentSatisfaction <= 20) {
    return warningMessages.student;
  }
  if (state.stats.facultyTrust <= 20) {
    return warningMessages.faculty;
  }
  return null;
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "NEW_GAME": {
      const next = createInitialState("intro");
      const { month } = getYearMonth(next.turn);
      return {
        ...next,
        assistant: {
          expression: "smile",
          message: getMonthMessage(month),
        },
        log: [{ turn: 1, text: "1年目4月、図書館運営が始まりました。" }],
      };
    }

    case "FINISH_INTRO":
      return withTimestamp({
        ...state,
        screen: "main",
        assistant: {
          expression: "smile",
          message: getMonthMessage(4),
        },
      });

    case "ADVANCE_INTRO":
      return withTimestamp({
        ...state,
        introMessageIndex: Math.min(4, (state.introMessageIndex ?? 0) + 1),
      });

    case "START_DEBUG_GAME": {
      const next = createInitialState("main");
      const turn = Math.max(1, Math.min(36, Math.round(action.turn)));
      const { year, month } = getYearMonth(turn);
      return withTimestamp({
        ...next,
        turn,
        stats: action.stats,
        yearStartStats: { ...action.stats },
        debugRandomEventMode: action.randomEventMode,
        debugRandomEventId: action.randomEventId,
        assistant: {
          expression: "explain",
          message: `デバッグモードで${year}年目${month}月を開始します。`,
        },
        log: [{ turn, text: `デバッグモード: ${year}年目${month}月から開始しました。` }],
      });
    }

    case "CONTINUE_GAME":
      return withTimestamp({
        ...state,
        screen: state.gameOver
          ? "gameOver"
          : state.ending
            ? "ending"
            : state.pendingYearEnd
              ? "yearEnd"
              : state.previousScreen === "intro"
                ? "intro"
                : "main",
        previousScreen: null,
        assistant: {
          expression: "smile",
          message: "続きから再開します。今月の方針とAPを確認しましょう。",
        },
      });

    case "GO_TITLE":
      return withTimestamp({
        ...state,
        screen: "title",
        previousScreen: state.screen === "intro" ? "intro" : null,
        lastResult: null,
        assistant: {
          expression: "normal",
          message: "タイトルに戻りました。続きから再開できます。",
        },
      });

    case "OPEN_HELP":
      return withTimestamp({
        ...state,
        previousScreen: state.screen,
        screen: "help",
      });

    case "CLOSE_HELP":
      return withTimestamp({
        ...state,
        screen: state.previousScreen ?? "title",
        previousScreen: null,
      });

    case "SELECT_POLICY": {
      const policy = policyById[action.policyId];
      return withTimestamp({
        ...state,
        selectedPolicyId: action.policyId,
        assistant: {
          expression: "explain",
          message: `今月の方針は「${policy.name}」ですね。${policy.description}`,
        },
      });
    }

    case "TOGGLE_COMMAND": {
      const command = commandById[action.commandId];
      const selected = state.selectedCommandIds.includes(action.commandId);

      if (selected) {
        const selectedCommandIds = state.selectedCommandIds.filter((id) => id !== action.commandId);
        return withTimestamp({
          ...state,
          selectedCommandIds,
          apRemaining: state.apRemaining + command.apCost,
          assistant: {
            expression: "normal",
            message: `「${command.shortName}」を選択から外しました。`,
          },
        });
      }

      if (command.apCost > state.apRemaining) {
        return withTimestamp({
          ...state,
          assistant: {
            expression: "worried",
            message: `APが足りません。「${command.shortName}」には${command.apCost}AP必要です。`,
          },
        });
      }

      return withTimestamp({
        ...state,
        selectedCommandIds: [...state.selectedCommandIds, action.commandId],
        apRemaining: state.apRemaining - command.apCost,
        assistant: {
          expression: "explain",
          message: commandAdvice[action.commandId],
        },
      });
    }

    case "CLEAR_COMMANDS":
      return withTimestamp({
        ...state,
        selectedCommandIds: [],
        apRemaining: 3,
        assistant: {
          expression: "normal",
          message: "コマンド選択を解除しました。今月の組み立てを考え直しましょう。",
        },
      });

    case "EXECUTE_TURN": {
      if (!state.selectedPolicyId) {
        return withTimestamp({
          ...state,
          assistant: {
            expression: "worried",
            message: "先に今月の重点方針を選びましょう。",
          },
        });
      }

      const resolved = resolveTurn(state);
      const randomTone = resolved.result.randomEvent?.event.tone ?? "normal";
      const warning = getWarningMessage({ ...state, stats: resolved.stats });
      const logLines = [
        `${resolved.result.year}年目${resolved.result.month}月を処理しました。`,
        ...resolved.result.summary,
      ];

      if (resolved.gameOver) {
        logLines.unshift(`ゲームオーバー: ${resolved.gameOver.reason}`);
      } else if (resolved.ending) {
        logLines.unshift(`最終評価: ${resolved.ending.rank} ${resolved.ending.title}`);
      } else if (resolved.pendingYearEnd) {
        logLines.unshift(`${resolved.pendingYearEnd.year}年目の年度末評価を行いました。`);
      }

      return withTimestamp({
        ...state,
        stats: resolved.stats,
        lastResult: resolved.result,
        pendingYearEnd: resolved.pendingYearEnd,
        ending: resolved.ending,
        gameOver: resolved.gameOver,
        log: pushLog(state, logLines),
        assistant: {
          expression: warning ? "worried" : resultExpressions[randomTone],
          message:
            warning ??
            (resolved.gameOver
              ? resolved.gameOver.comment
              : resolved.ending
                ? `3年間おつかれさまでした。評価は${resolved.ending.rank}です。`
                : resolved.pendingYearEnd
                  ? resolved.pendingYearEnd.comment
                  : "今月の処理が終わりました。結果を確認しましょう。"),
        },
      });
    }

    case "DISMISS_RESULT": {
      if (state.gameOver) {
        return withTimestamp(setScreen({ ...state, lastResult: null }, "gameOver"));
      }

      if (state.ending) {
        return withTimestamp(setScreen({ ...state, lastResult: null }, "ending"));
      }

      if (state.pendingYearEnd) {
        return withTimestamp(setScreen({ ...state, lastResult: null }, "yearEnd"));
      }

      const advanced = resetMonthSelection({
        ...state,
        turn: Math.min(36, state.turn + 1),
      });
      return withTimestamp(advanced);
    }

    case "CONTINUE_AFTER_YEAR_END": {
      const nextYearStartStats = { ...(state.pendingYearEnd?.statsAfter ?? state.stats) };
      const advanced = resetMonthSelection({
        ...state,
        screen: "main",
        pendingYearEnd: null,
        yearStartStats: nextYearStartStats,
        turn: Math.min(36, state.turn + 1),
      });
      return withTimestamp({
        ...advanced,
        assistant: {
          expression: "cheer",
          message: "新年度です。予算が更新されました。ここからまた立て直せます。",
        },
      });
    }

    case "DELETE_SAVE":
      return createInitialState("title");

    default:
      return state;
  }
};
