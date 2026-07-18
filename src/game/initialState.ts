import { titleMessage } from "../data/assistantMessages";
import type { GameState, Screen, Stats } from "./types";

export const initialStats: Stats = {
  budget: 100,
  collection: 50,
  studentSatisfaction: 50,
  facultyTrust: 50,
  executiveTrust: 45,
  publicity: 40,
  staffMorale: 55,
  staffFatigue: 20,
  facility: 45,
  researchSupport: 40,
  dx: 35,
  reputation: 50,
};

export const createInitialState = (screen: Screen = "title"): GameState => ({
  screen,
  previousScreen: null,
  introMessageIndex: 0,
  turn: 1,
  apRemaining: 3,
  stats: { ...initialStats },
  yearStartStats: { ...initialStats },
  selectedPolicyId: null,
  selectedCommandIds: [],
  log: [],
  lastResult: null,
  pendingYearEnd: null,
  ending: null,
  gameOver: null,
  pendingMilestoneEventId: null,
  seenMilestoneEventIds: [],
  assistant: {
    expression: "normal",
    message: titleMessage,
  },
  savedAt: new Date().toISOString(),
});
