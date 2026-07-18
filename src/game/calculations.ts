import { commandById } from "../data/commands";
import { getEndingByScore } from "../data/endings";
import { policyById } from "../data/policies";
import { evaluateAnnualObjective } from "./annualObjectives";
import type {
  AnnualObjectiveResult,
  AppliedCommandResult,
  Command,
  CommandId,
  MetricKey,
  PolicyId,
  StatKey,
  Stats,
  YearEndResult,
} from "./types";

export const metricKeys: MetricKey[] = [
  "collection",
  "studentSatisfaction",
  "facultyTrust",
  "executiveTrust",
  "publicity",
  "staffMorale",
  "staffFatigue",
  "facility",
  "researchSupport",
  "dx",
  "reputation",
];

export const statKeys: StatKey[] = ["budget", ...metricKeys];

export const statLabels: Record<StatKey, string> = {
  budget: "予算",
  collection: "蔵書・電子資料",
  studentSatisfaction: "学生満足度",
  facultyTrust: "教員信頼",
  executiveTrust: "執行部信頼",
  publicity: "広報力",
  staffMorale: "職員士気",
  staffFatigue: "職員疲労",
  facility: "施設快適度",
  researchSupport: "研究支援力",
  dx: "DX",
  reputation: "評判",
};

export const isMetricKey = (key: StatKey): key is MetricKey => key !== "budget";

export const clampMetric = (value: number) => Math.max(0, Math.round(value));

export const clampStats = (stats: Stats): Stats => {
  const next = { ...stats };

  for (const key of metricKeys) {
    next[key] = clampMetric(next[key]);
  }

  next.budget = Math.round(next.budget);
  return next;
};

export const applyEffects = (
  stats: Stats,
  effects: Partial<Record<StatKey, number>>,
): Stats => {
  const next = { ...stats };

  for (const [rawKey, rawDelta] of Object.entries(effects)) {
    const key = rawKey as StatKey;
    const delta = rawDelta ?? 0;
    next[key] = (next[key] ?? 0) + delta;
  }

  return clampStats(next);
};

const roundDelta = (value: number) => {
  if (value === 0) {
    return 0;
  }

  const rounded = Math.round(value);
  return rounded === 0 ? (value > 0 ? 1 : -1) : rounded;
};

const isBeneficialEffect = (key: StatKey, value: number) => {
  if (key === "budget") {
    return value > 0;
  }

  if (key === "staffFatigue") {
    return value < 0;
  }

  return value > 0;
};

const multiplyEffect = (
  effects: Partial<Record<StatKey, number>>,
  key: StatKey,
  multiplier: number,
) => {
  const value = effects[key];
  if (value === undefined || value === 0) {
    return;
  }

  effects[key] = value * multiplier;
};

interface MoraleModifiers {
  outcome: number;
  penalty: number;
  fatigueIncrease: number;
  label: string;
}

const getMoraleModifiers = (staffMorale: number): MoraleModifiers => {
  if (staffMorale < 25) {
    return { outcome: 0.8, penalty: 1.2, fatigueIncrease: 1.25, label: "士気低迷" };
  }
  if (staffMorale < 45) {
    return { outcome: 0.9, penalty: 1.1, fatigueIncrease: 1.1, label: "士気不足" };
  }
  if (staffMorale < 70) {
    return { outcome: 1, penalty: 1, fatigueIncrease: 1, label: "士気安定" };
  }
  if (staffMorale < 85) {
    return { outcome: 1.1, penalty: 0.9, fatigueIncrease: 0.9, label: "士気良好" };
  }
  return { outcome: 1.2, penalty: 0.8, fatigueIncrease: 0.8, label: "士気充実" };
};

const applyMoraleModifiers = (
  effects: Partial<Record<StatKey, number>>,
  staffMorale: number,
) => {
  const modifiers = getMoraleModifiers(staffMorale);
  if (modifiers.outcome === 1) {
    return { effects, notes: [] as string[] };
  }

  for (const [rawKey, rawValue] of Object.entries(effects)) {
    const key = rawKey as StatKey;
    const value = rawValue ?? 0;
    if (value === 0 || key === "budget" || key === "staffMorale") {
      continue;
    }

    if (key === "staffFatigue") {
      effects[key] = value * (value > 0 ? modifiers.fatigueIncrease : modifiers.outcome);
    } else {
      effects[key] = value * (value > 0 ? modifiers.outcome : modifiers.penalty);
    }
  }

  const outcomePercent = Math.round(Math.abs(modifiers.outcome - 1) * 100);
  const fatiguePercent = Math.round(Math.abs(modifiers.fatigueIncrease - 1) * 100);
  const direction = modifiers.outcome > 1 ? "+" : "-";
  const fatigueDirection = modifiers.fatigueIncrease < 1 ? "-" : "+";
  return {
    effects,
    notes: [`${modifiers.label}: 成果${direction}${outcomePercent}%、疲労負担${fatigueDirection}${fatiguePercent}%`],
  };
};

const applyPolicyModifiers = (
  command: Command,
  policyId: PolicyId,
  effects: Partial<Record<StatKey, number>>,
  budgetCost: number,
) => {
  const policy = policyById[policyId];
  const notes: string[] = [];
  let nextBudgetCost = budgetCost;

  if (policyId === "student_first") {
    const value = effects.studentSatisfaction;
    if (value !== undefined && value > 0) {
      multiplyEffect(effects, "studentSatisfaction", 1.2);
      notes.push(`${policy.name}: 学生満足度効果+20%`);
    }
  }

  if (policyId === "research_focus") {
    let applied = false;
    for (const key of ["facultyTrust", "researchSupport"] as const) {
      const value = effects[key];
      if (value !== undefined && value > 0) {
        multiplyEffect(effects, key, 1.2);
        applied = true;
      }
    }
    if (applied) {
      notes.push(`${policy.name}: 教員信頼・研究支援効果+20%`);
    }
  }

  if (policyId === "publicity_focus") {
    let applied = false;
    for (const key of ["publicity", "reputation"] as const) {
      const value = effects[key];
      if (value !== undefined && value > 0) {
        multiplyEffect(effects, key, 1.2);
        applied = true;
      }
    }
    if (applied) {
      notes.push(`${policy.name}: 広報・評判効果+20%`);
    }
  }

  if (policyId === "staff_care") {
    const value = effects.staffFatigue;
    if (value !== undefined && value > 0) {
      multiplyEffect(effects, "staffFatigue", 0.7);
      notes.push(`${policy.name}: 疲労増加30%軽減`);
    }
  }

  if (policyId === "reform_push") {
    let applied = false;
    for (const key of ["dx", "facility", "researchSupport"] as const) {
      const value = effects[key];
      if (value !== undefined && value > 0) {
        multiplyEffect(effects, key, 1.15);
        applied = true;
      }
    }

    const fatigue = effects.staffFatigue;
    if (fatigue !== undefined && fatigue > 0) {
      multiplyEffect(effects, "staffFatigue", 1.1);
      applied = true;
    }

    if (applied) {
      notes.push(`${policy.name}: 改革効果+15%、疲労増加+10%`);
    }
  }

  if (policyId === "budget_saving") {
    if (nextBudgetCost > 0) {
      nextBudgetCost *= 0.8;
      notes.push(`${policy.name}: 予算消費-20%`);
    }

    const satisfaction = effects.studentSatisfaction;
    if (satisfaction !== undefined && satisfaction > 0) {
      multiplyEffect(effects, "studentSatisfaction", 0.9);
      notes.push(`${policy.name}: 満足度上昇-10%`);
    }
  }

  return { effects, budgetCost: nextBudgetCost, notes, command };
};

const seasonalMultiplierFor = (command: Command, key: StatKey, month: number) => {
  const beneficial = isBeneficialEffect(key, command.effects[key] ?? 0);
  if (!beneficial) {
    return 1;
  }

  const commandMatches = (ids: CommandId[]) => ids.includes(command.id);
  const hasTag = (...tags: Command["tags"][number][]) =>
    tags.some((tag) => command.tags.includes(tag));

  if (month === 4 && commandMatches(["guidance", "sns", "signage"])) {
    return 1.2;
  }

  if (month === 5 && commandMatches(["reference_boost", "buy_books"])) {
    return 1.1;
  }

  if (month === 8 && (hasTag("facility") || command.id === "workflow_review")) {
    return 1.15;
  }

  if (month === 9 && commandMatches(["buy_books", "guidance"])) {
    return 1.1;
  }

  if (month === 10 && commandMatches(["seasonal_exhibit", "sns"])) {
    return 1.2;
  }

  if (month === 11 && (hasTag("research") || command.id === "reference_boost")) {
    return 1.15;
  }

  if (month === 1 && hasTag("facility")) {
    return 1.1;
  }

  if (month === 2 && (hasTag("publicity", "facility") || command.id === "workflow_review")) {
    return 1.1;
  }

  return 1;
};

const applySeasonalModifiers = (
  command: Command,
  month: number,
  effects: Partial<Record<StatKey, number>>,
) => {
  const notes: string[] = [];
  let applied = false;

  for (const key of statKeys) {
    const value = effects[key];
    if (value === undefined || value === 0) {
      continue;
    }

    const multiplier = seasonalMultiplierFor(command, key, month);
    if (multiplier !== 1) {
      effects[key] = value * multiplier;
      applied = true;
    }
  }

  if (applied) {
    notes.push("季節イベント補正あり");
  }

  return { effects, notes };
};

export const calculateAppliedCommand = (
  commandId: CommandId,
  policyId: PolicyId,
  month: number,
  staffMorale = 50,
  _currentStats?: Stats,
): AppliedCommandResult => {
  const command = commandById[commandId];
  const baseEffects: Partial<Record<StatKey, number>> = { ...command.effects };
  const policyResult = applyPolicyModifiers(command, policyId, baseEffects, command.budgetCost);
  const seasonalResult = applySeasonalModifiers(command, month, policyResult.effects);
  const moraleResult = applyMoraleModifiers(seasonalResult.effects, staffMorale);

  const roundedEffects: Partial<Record<StatKey, number>> = {};
  for (const [rawKey, rawValue] of Object.entries(moraleResult.effects)) {
    const key = rawKey as StatKey;
    roundedEffects[key] = roundDelta(rawValue ?? 0);
  }

  const roundedBudgetCost =
    policyResult.budgetCost > 0
      ? Math.max(0, Math.round(policyResult.budgetCost))
      : Math.round(policyResult.budgetCost);

  return {
    commandId,
    commandName: command.name,
    apCost: command.apCost,
    budgetDelta: -roundedBudgetCost,
    effects: roundedEffects,
    notes: [
      ...policyResult.notes,
      ...seasonalResult.notes,
      ...moraleResult.notes,
    ],
  };
};

const finalScoreKeys = [
  "collection",
  "studentSatisfaction",
  "facultyTrust",
  "executiveTrust",
  "publicity",
  "facility",
  "researchSupport",
  "dx",
  "reputation",
] as const satisfies readonly MetricKey[];

const finalScoreWeights: Record<(typeof finalScoreKeys)[number], number> = {
  collection: 0.1,
  studentSatisfaction: 0.15,
  facultyTrust: 0.15,
  executiveTrust: 0.1,
  publicity: 0.08,
  facility: 0.08,
  researchSupport: 0.1,
  dx: 0.07,
  reputation: 0.12,
};

export const finalEvaluationTarget = 120;

export const getStatMeterPercent = (key: StatKey, value: number) => {
  const target = key === "budget" || key === "staffFatigue" ? 100 : finalEvaluationTarget;
  return Math.max(0, Math.min(100, value / target * 100));
};

const toEvaluationValue = (value: number) =>
  Math.min(110, Math.max(0, value) / finalEvaluationTarget * 100);

export const calculateScore = (stats: Stats) => {
  const evaluationValues = finalScoreKeys.map((key) => ({
    key,
    value: toEvaluationValue(stats[key]),
  }));
  const outcomeScore = evaluationValues.reduce(
    (total, item) => total + item.value * finalScoreWeights[item.key],
    0,
  ) / 0.95;
  const lowerThreeAverage = evaluationValues
    .map((item) => item.value)
    .sort((a, b) => a - b)
    .slice(0, 3)
    .reduce((total, value) => total + value, 0) / 3;
  const completedTargetRatio = finalScoreKeys.filter(
    (key) => stats[key] >= finalEvaluationTarget,
  ).length / finalScoreKeys.length * 100;

  // Reaching the top rank requires broad results, care for weak areas, and completed fields.
  const score = outcomeScore * 0.65 + lowerThreeAverage * 0.25 + completedTargetRatio * 0.1;
  return Math.round(Math.min(100, score) * 10) / 10;
};

export const calculateEnding = (stats: Stats, annualObjective?: AnnualObjectiveResult) => ({
  ...getEndingByScore(calculateScore(stats)),
  annualObjective,
});

const addStatChange = (
  changes: Partial<Record<StatKey, number>>,
  key: StatKey,
  delta: number,
) => {
  changes[key] = (changes[key] ?? 0) + delta;
};

export const calculateYearEnd = (year: number, stats: Stats, statsBefore: Stats = stats): YearEndResult => {
  const annualObjective = evaluateAnnualObjective(year, stats);
  const budgetReference = (value: number) => Math.min(finalEvaluationTarget, value);
  const baseBudget =
    100 +
    Math.floor((budgetReference(stats.executiveTrust) - 50) / 5) +
    Math.floor((budgetReference(stats.reputation) - 50) / 5) +
    Math.floor((budgetReference(stats.studentSatisfaction) - 50) / 10) +
    Math.floor((budgetReference(stats.facultyTrust) - 50) / 10);

  let nextBudget = baseBudget;
  const budgetBonuses: string[] = [];
  const statChanges: Partial<Record<StatKey, number>> = {};

  if (stats.reputation >= 70) {
    nextBudget += 5;
    budgetBonuses.push("評判70以上: 次年度予算+5");
  }

  if (stats.executiveTrust >= 70) {
    nextBudget += 8;
    budgetBonuses.push("執行部信頼70以上: 次年度予算+8");
  }

  if (annualObjective.completed) {
    const { budgetBonus, effects } = annualObjective.objective.reward;
    if (budgetBonus > 0) {
      nextBudget += budgetBonus;
      budgetBonuses.push(`重点課題達成: 次年度予算+${budgetBonus}`);
    }
    for (const [rawKey, value] of Object.entries(effects)) {
      if (value !== undefined && value !== 0) {
        addStatChange(statChanges, rawKey as StatKey, value);
      }
    }
  }

  if (stats.staffFatigue >= 80) {
    addStatChange(statChanges, "staffMorale", -8);
  }

  if (stats.budget >= 40) {
    addStatChange(statChanges, "executiveTrust", -3);
  }

  if (stats.budget <= 5) {
    addStatChange(statChanges, "executiveTrust", -5);
  }

  if (stats.studentSatisfaction >= 75) {
    addStatChange(statChanges, "reputation", 5);
  }

  if (stats.facultyTrust >= 75) {
    addStatChange(statChanges, "executiveTrust", 4);
  }

  const adjustedStats = applyEffects(stats, statChanges);
  const statsAfter = clampStats({ ...adjustedStats, budget: nextBudget });
  const comment =
    nextBudget >= 110
      ? "次年度は選べることがたくさんありそうです。どんな図書館にしていくか、一緒に考えるのが楽しみですね。"
      : nextBudget >= 95
        ? "次年度予算はおおむね安定しています。私たちのペースで、ひとつずつ育てていきましょう。"
        : "次年度予算は少し控えめです。大切にしたいことから、私と一緒に選んでいきましょう。";

  return {
    year,
    statsBefore: { ...statsBefore },
    nextBudget,
    baseBudget,
    budgetBonuses,
    statChanges,
    statsAfter,
    comment,
    annualObjective,
  };
};

export const checkGameOver = (stats: Stats) => {
  if (stats.budget <= -20) {
    return {
      reason: "財政破綻",
      comment: "今回は、予算の都合でここまでとなりました。次は早めに残額を確かめながら、また一緒に歩んでいきましょう。",
    };
  }

  if (stats.staffFatigue >= 100) {
    return {
      reason: "職員崩壊",
      comment: "職員のみなさんの休息が必要になり、今回はここまでとなりました。次は私も一緒に、無理のない歩み方を考えますね。",
    };
  }

  if (stats.reputation <= 0) {
    return {
      reason: "信頼喪失",
      comment: "図書館への信頼を立て直す時間が必要になりました。次は小さな声にも耳を傾けながら、一緒に歩み直しましょう。",
    };
  }

  if (stats.studentSatisfaction <= 0) {
    return {
      reason: "学生離れ",
      comment: "学生のみなさんとの距離が広がり、今回はここまでとなりました。次は一人ひとりの声を大切に、一緒に迎えられる場所を作りましょう。",
    };
  }

  if (stats.facultyTrust <= 0) {
    return {
      reason: "教員からの信頼喪失",
      comment: "先生方との信頼を育て直す時間が必要になりました。次はお話しする機会を少しずつ増やして、一緒に関係を結び直しましょう。",
    };
  }

  return null;
};

export const getYearMonth = (turn: number) => {
  const monthSequence = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  const month = monthSequence[(turn - 1) % monthSequence.length] ?? 4;
  const year = Math.floor((turn - 1) / 12) + 1;
  return { year, month };
};

export const formatEffect = (key: StatKey, value: number) => {
  const label = statLabels[key];
  const sign = value > 0 ? "+" : "";
  return `${label}${sign}${value}`;
};
