import { createInitialState } from "./initialState";
import type { GameState } from "./types";

const STORAGE_KEY = "library-management-sim.save.v1";

export const loadGame = (): GameState => {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }

    return JSON.parse(raw) as GameState;
  } catch {
    return createInitialState();
  }
};

export const saveGame = (state: GameState) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const deleteGame = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

export const hasSavedGame = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) !== null;
};
