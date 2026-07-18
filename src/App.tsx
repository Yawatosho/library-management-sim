import { useEffect, useReducer } from "react";
import { EndingScreen } from "./components/EndingScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { HelpScreen } from "./components/HelpScreen";
import { IntroScreen } from "./components/IntroScreen";
import { MainScreen } from "./components/MainScreen";
import { playScreenBgm, stopSeasonalBgm } from "./components/SeasonalBgm";
import { TitleScreen } from "./components/TitleScreen";
import { YearEndScreen } from "./components/YearEndScreen";
import { trackScreenView } from "./game/analytics";
import { saveMemoryCollection, unlockEndingMemory, unlockRandomEventMemory } from "./game/memoryCollection";
import { gameReducer } from "./game/reducer";
import { deleteGame, downloadGameSaveBackup, loadGame, saveGame, type GameSaveBackup } from "./game/storage";

const isBlankTitleState = (screen: string, turn: number, logLength: number) =>
  screen === "title" && turn === 1 && logLength === 0;

export const App = () => {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGame);
  const canContinue = state.turn > 1 || state.log.length > 0 || state.ending !== null || state.gameOver !== null;

  useEffect(() => {
    trackScreenView(state.screen);
  }, [state.screen]);

  useEffect(() => {
    if (!isBlankTitleState(state.screen, state.turn, state.log.length)) {
      saveGame(state);
    }
  }, [state]);

  useEffect(() => {
    const eventId = state.lastResult?.randomEvent?.event.id;
    if (eventId) {
      unlockRandomEventMemory(eventId);
    }

    if (state.ending) {
      unlockEndingMemory(state.ending.rank);
    }
  }, [state.lastResult?.randomEvent?.event.id, state.ending]);

  useEffect(() => {
    if (state.screen === "yearEnd") {
      playScreenBgm("report");
    } else if (state.screen === "ending") {
      playScreenBgm("ending");
    } else if (state.screen === "gameOver") {
      playScreenBgm("gameover");
    } else if (state.screen === "title") {
      stopSeasonalBgm();
    }
  }, [state.screen]);

  const handleDeleteSave = () => {
    deleteGame();
    dispatch({ type: "DELETE_SAVE" });
  };

  const handleImportSave = (backup: GameSaveBackup) => {
    saveMemoryCollection(backup.memoryCollection);
    dispatch({ type: "IMPORT_SAVE", state: backup.gameState });
  };

  if (state.screen === "help") {
    return <HelpScreen onBack={() => dispatch({ type: "CLOSE_HELP" })} />;
  }

  if (state.screen === "intro") {
    return (
      <IntroScreen
        messageIndex={state.introMessageIndex ?? 0}
        onAdvance={() => dispatch({ type: "ADVANCE_INTRO" })}
        onComplete={() => dispatch({ type: "FINISH_INTRO" })}
        onHelp={() => dispatch({ type: "OPEN_HELP" })}
        onTitle={() => dispatch({ type: "GO_TITLE" })}
      />
    );
  }

  if (state.screen === "yearEnd" && state.pendingYearEnd) {
    return (
      <YearEndScreen
        result={state.pendingYearEnd}
        onContinue={() => dispatch({ type: "CONTINUE_AFTER_YEAR_END" })}
      />
    );
  }

  if (state.screen === "ending" && state.ending) {
    return (
      <EndingScreen
        ending={state.ending}
        stats={state.stats}
        onTitle={() => dispatch({ type: "GO_TITLE" })}
      />
    );
  }

  if (state.screen === "gameOver" && state.gameOver) {
    return (
      <GameOverScreen
        gameOver={state.gameOver}
        stats={state.stats}
        onNewGame={() => dispatch({ type: "NEW_GAME" })}
        onTitle={() => dispatch({ type: "GO_TITLE" })}
      />
    );
  }

  if (state.screen === "main") {
    return <MainScreen state={state} dispatch={dispatch} />;
  }

  return (
    <TitleScreen
      canContinue={canContinue}
      onNewGame={() => dispatch({ type: "NEW_GAME" })}
      onContinue={() => dispatch({ type: "CONTINUE_GAME" })}
      onHelp={() => dispatch({ type: "OPEN_HELP" })}
      onDeleteSave={handleDeleteSave}
      onExportSave={() => downloadGameSaveBackup(state)}
      onImportSave={handleImportSave}
      onStartDebug={(config) => dispatch({ type: "START_DEBUG_GAME", ...config })}
    />
  );
};
