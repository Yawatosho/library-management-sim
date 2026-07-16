import { annualObjectiveByYear } from "../data/annualObjectives";
import type { AnnualObjective, AnnualObjectiveResult, Stats } from "./types";

export const getAnnualObjective = (year: number): AnnualObjective =>
  annualObjectiveByYear[year] ?? annualObjectiveByYear[3]!;

export const evaluateAnnualObjective = (year: number, stats: Stats): AnnualObjectiveResult => {
  const objective = getAnnualObjective(year);
  const conditions = objective.conditions.map((condition) => {
    const current = stats[condition.key];
    const completed = condition.comparison === "atMost"
      ? current <= condition.target
      : current >= condition.target;

    return { ...condition, current, completed };
  });
  const completedCount = conditions.filter((condition) => condition.completed).length;

  return {
    objective,
    conditions,
    completedCount,
    completed: completedCount === conditions.length,
  };
};
