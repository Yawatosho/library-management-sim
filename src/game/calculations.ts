import { commandById } from "../data/commands";
import { getEndingByScore } from "../data/endings";
import { policyById } from "../data/policies";
import type {
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

export const clampMetric = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

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

const getGrowthMultiplier = (currentValue: number) => {
  if (currentValue >= 95) return 0.2;
  if (currentValue >= 85) return 0.4;
  if (currentValue >= 70) return 0.7;
  return 1;
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
  currentStats?: Stats,
): AppliedCommandResult => {
  const command = commandById[commandId];
  const baseEffects: Partial<Record<StatKey, number>> = { ...command.effects };
  const policyResult = applyPolicyModifiers(command, policyId, baseEffects, command.budgetCost);
  const seasonalResult = applySeasonalModifiers(command, month, policyResult.effects);
  const moraleResult = applyMoraleModifiers(seasonalResult.effects, staffMorale);

  const roundedEffects: Partial<Record<StatKey, number>> = {};
  let growthWasLimited = false;
  for (const [rawKey, rawValue] of Object.entries(moraleResult.effects)) {
    const key = rawKey as StatKey;
    const roundedValue = roundDelta(rawValue ?? 0);
    if (currentStats && key !== "budget" && key !== "staffFatigue" && roundedValue > 0) {
      const multiplier = getGrowthMultiplier(currentStats[key]);
      roundedEffects[key] = Math.round(roundedValue * multiplier);
      growthWasLimited ||= multiplier < 1;
    } else {
      roundedEffects[key] = roundedValue;
    }
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
      ...(growthWasLimited ? ["高水準の項目は成果が緩やかになります"] : []),
    ],
  };
};

export const calculateScore = (stats: Stats) => {
  const weightedScore =
    stats.collection * 0.1 +
    stats.studentSatisfaction * 0.15 +
    stats.facultyTrust * 0.15 +
    stats.executiveTrust * 0.1 +
    stats.publicity * 0.08 +
    stats.staffMorale * 0.1 +
    (100 - stats.staffFatigue) * 0.1 +
    stats.facility * 0.08 +
    stats.researchSupport * 0.1 +
    stats.dx * 0.07 +
    stats.reputation * 0.12;

  // The original weights total 1.15, so normalize the result to a true 100-point scale.
  const score = weightedScore / 1.15;
  return Math.round(score * 10) / 10;
};

export const calculateEnding = (stats: Stats) => getEndingByScore(calculateScore(stats));

const addStatChange = (
  changes: Partial<Record<StatKey, number>>,
  key: StatKey,
  delta: number,
) => {
  changes[key] = (changes[key] ?? 0) + delta;
};

export const calculateYearEnd = (year: number, stats: Stats, statsBefore: Stats = stats): YearEndResult => {
  const baseBudget =
    100 +
    Math.floor((stats.executiveTrust - 50) / 5) +
    Math.floor((stats.reputation - 50) / 5) +
    Math.floor((stats.studentSatisfaction - 50) / 10) +
    Math.floor((stats.facultyTrust - 50) / 10);

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
      ? "次年度はかなり動きやすい予算です。攻めの年にできます。"
      : nextBudget >= 95
        ? "次年度予算はおおむね安定しています。焦らず積み上げましょう。"
        : "次年度予算は厳しめです。優先順位を絞る運営が必要です。";

  return {
    year,
    statsBefore: { ...statsBefore },
    nextBudget,
    baseBudget,
    budgetBonuses,
    statChanges,
    statsAfter,
    comment,
  };
};

export const checkGameOver = (stats: Stats) => {
  if (stats.budget <= -20) {
    return {
      reason: "財政破綻",
      comment: "予算が底を抜けました。大学から緊急の運営停止判断が出ています。",
    };
  }

  if (stats.staffFatigue >= 100) {
    return {
      reason: "職員崩壊",
      comment: "職員の疲労が限界に達しました。サービス継続ができません。",
    };
  }

  if (stats.reputation <= 0) {
    return {
      reason: "信頼喪失",
      comment: "図書館への評判が失われ、学内の支持を保てなくなりました。",
    };
  }

  if (stats.studentSatisfaction <= 0) {
    return {
      reason: "学生離れ",
      comment: "学生が図書館を使わなくなりました。学修支援の役割を果たせません。",
    };
  }

  if (stats.facultyTrust <= 0) {
    return {
      reason: "教員からの信頼喪失",
      comment: "教員からの信頼を失い、研究教育支援の基盤が崩れました。",
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
