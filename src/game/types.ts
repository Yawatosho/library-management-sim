export type Screen =
  | "title"
  | "intro"
  | "main"
  | "help"
  | "yearEnd"
  | "ending"
  | "gameOver";

export type StatKey =
  | "budget"
  | "collection"
  | "studentSatisfaction"
  | "facultyTrust"
  | "executiveTrust"
  | "publicity"
  | "staffMorale"
  | "staffFatigue"
  | "facility"
  | "researchSupport"
  | "dx"
  | "reputation";

export type MetricKey = Exclude<StatKey, "budget">;

export type Stats = Record<StatKey, number>;

export type DebugRandomEventMode = "normal" | "force" | "disable";

export type PolicyId =
  | "student_first"
  | "research_focus"
  | "publicity_focus"
  | "staff_care"
  | "reform_push"
  | "budget_saving";

export type CommandId =
  | "buy_books"
  | "trial_database"
  | "review_journals"
  | "guidance"
  | "reference_boost"
  | "long_loan"
  | "sns"
  | "seasonal_exhibit"
  | "poster"
  | "seats"
  | "signage"
  | "air_conditioning"
  | "staff_training"
  | "workflow_review"
  | "faculty_visit"
  | "student_survey"
  | "oa_workshop"
  | "repository"
  | "opac"
  | "automation"
  | "rest";

export type RandomEventId =
  | "viral_post"
  | "faculty_praise"
  | "student_volunteers"
  | "local_news"
  | "donation"
  | "price_hike"
  | "ac_trouble"
  | "system_down"
  | "complaint"
  | "staff_absence"
  | "wet_books";

export type AssistantExpression =
  | "normal"
  | "smile"
  | "worried"
  | "surprised"
  | "explain"
  | "cheer";

export type CommandTag =
  | "collection"
  | "student"
  | "research"
  | "publicity"
  | "facility"
  | "staff"
  | "relationship"
  | "dx"
  | "savings";

export interface Command {
  id: CommandId;
  name: string;
  shortName: string;
  description: string;
  apCost: number;
  budgetCost: number;
  effects: Partial<Record<StatKey, number>>;
  tags: CommandTag[];
}

export interface Policy {
  id: PolicyId;
  name: string;
  tagline: string;
  description: string;
}

export interface SeasonalEvent {
  month: number;
  title: string;
  description: string;
  effectNote: string;
}

export interface RandomEvent {
  id: RandomEventId;
  title: string;
  description: string;
  tone: "good" | "bad";
  effects: Partial<Record<StatKey, number>>;
}

export interface LogEntry {
  turn: number;
  text: string;
}

export interface AppliedCommandResult {
  commandId: CommandId;
  commandName: string;
  apCost: number;
  budgetDelta: number;
  effects: Partial<Record<StatKey, number>>;
  notes: string[];
}

export interface RandomEventResult {
  event: RandomEvent;
  effects: Partial<Record<StatKey, number>>;
}

export interface TurnResult {
  turn: number;
  year: number;
  month: number;
  title: string;
  appliedCommands: AppliedCommandResult[];
  seasonalEffects: Partial<Record<StatKey, number>>;
  randomEvent: RandomEventResult | null;
  statsBefore: Stats;
  statsAfter: Stats;
  summary: string[];
}

export interface YearEndResult {
  year: number;
  statsBefore?: Stats;
  nextBudget: number;
  baseBudget: number;
  budgetBonuses: string[];
  statChanges: Partial<Record<StatKey, number>>;
  statsAfter: Stats;
  comment: string;
}

export interface EndingResult {
  score: number;
  rank: string;
  title: string;
  comment: string;
}

export interface GameOverResult {
  reason: string;
  comment: string;
}

export interface AssistantState {
  expression: AssistantExpression;
  message: string;
}

export interface GameState {
  screen: Screen;
  previousScreen: Screen | null;
  introMessageIndex: number;
  turn: number;
  apRemaining: number;
  stats: Stats;
  yearStartStats?: Stats;
  selectedPolicyId: PolicyId | null;
  selectedCommandIds: CommandId[];
  log: LogEntry[];
  lastResult: TurnResult | null;
  pendingYearEnd: YearEndResult | null;
  ending: EndingResult | null;
  gameOver: GameOverResult | null;
  assistant: AssistantState;
  debugRandomEventMode?: DebugRandomEventMode;
  debugRandomEventId?: RandomEventId;
  savedAt: string;
}
