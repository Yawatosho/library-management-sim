import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

const { commands } = await server.ssrLoadModule("/src/data/commands.ts");
const { policies } = await server.ssrLoadModule("/src/data/policies.ts");
const { annualObjectiveByYear } = await server.ssrLoadModule("/src/data/annualObjectives.ts");
const { initialStats, createInitialState } = await server.ssrLoadModule("/src/game/initialState.ts");
const { applyEffects, calculateScore, getYearMonth } = await server.ssrLoadModule("/src/game/calculations.ts");
const { resolveRandomEventChoice, resolveTurn } = await server.ssrLoadModule("/src/game/eventResolver.ts");

const trials = Math.max(1, Number(process.argv[2] ?? 250));
const requestedStrategyId = process.argv[3];
const scoreKeys = [
  "collection",
  "studentSatisfaction",
  "facultyTrust",
  "executiveTrust",
  "publicity",
  "facility",
  "researchSupport",
  "dx",
  "reputation",
];

const commandSets = [];
const collectCommandSets = (start, remainingAp, selected) => {
  if (remainingAp === 0) {
    commandSets.push([...selected]);
    return;
  }

  for (let index = start; index < commands.length; index += 1) {
    const command = commands[index];
    if (command.apCost <= remainingAp) {
      selected.push(command.id);
      collectCommandSets(index + 1, remainingAp - command.apCost, selected);
      selected.pop();
    }
  }
};
collectCommandSets(0, 3, []);

const actions = policies.flatMap((policy) =>
  commandSets.map((commandIds) => ({ policyId: policy.id, commandIds })),
);

const seededRandom = (seed) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

const lowerThreeAverage = (stats) => scoreKeys
  .map((key) => stats[key])
  .sort((a, b) => a - b)
  .slice(0, 3)
  .reduce((total, value) => total + value, 0) / 3;

const minimumOutcome = (stats) => Math.min(...scoreKeys.map((key) => stats[key]));

const objectiveProgress = (turn, stats) => {
  const { year } = getYearMonth(Math.min(turn, 36));
  const objective = annualObjectiveByYear[year];
  if (!objective) return 0;

  return objective.conditions.reduce((total, condition) => {
    const current = stats[condition.key];
    if (condition.comparison === "atMost") {
      return total + (current <= condition.target ? 1 : Math.max(0, 1 - (current - condition.target) / 30));
    }
    return total + Math.min(1, current / condition.target);
  }, 0);
};

const safetyValue = (stats) => {
  const budgetRisk = stats.budget < 0 ? stats.budget * 4 : Math.min(stats.budget, 25) * 0.08;
  const fatigueRisk = Math.max(0, stats.staffFatigue - 68) * 1.6;
  const moraleRisk = Math.max(0, 45 - stats.staffMorale) * 0.5;
  return budgetRisk - fatigueRisk - moraleRisk;
};

const strategies = [
  {
    id: "efficient",
    label: "高効率型",
    utility: (candidate) =>
      calculateScore(candidate.stats) * 3.2 +
      objectiveProgress(candidate.turn, candidate.stats) * 4 +
      candidate.completedObjectives * 10 +
      safetyValue(candidate.stats),
  },
  {
    id: "balanced",
    label: "バランス型",
    utility: (candidate) =>
      calculateScore(candidate.stats) * 1.8 +
      lowerThreeAverage(candidate.stats) * 1.5 +
      minimumOutcome(candidate.stats) * 0.45 +
      objectiveProgress(candidate.turn, candidate.stats) * 7 +
      candidate.completedObjectives * 14 +
      safetyValue(candidate.stats),
  },
  {
    id: "standard",
    label: "標準プレイヤー型",
    selectionPool: 360,
    selectionBias: 1.15,
    utility: (candidate) =>
      calculateScore(candidate.stats) * 2.1 +
      lowerThreeAverage(candidate.stats) * 0.35 +
      objectiveProgress(candidate.turn, candidate.stats) * 5 +
      candidate.completedObjectives * 8 +
      safetyValue(candidate.stats),
  },
  {
    id: "saving",
    label: "節約型",
    utility: (candidate) =>
      calculateScore(candidate.stats) * 1.35 +
      candidate.stats.budget * 0.75 +
      candidate.stats.executiveTrust * 0.2 +
      objectiveProgress(candidate.turn, candidate.stats) * 3 +
      candidate.completedObjectives * 5 +
      safetyValue(candidate.stats),
  },
];

const makeState = (candidate, action) => ({
  ...createInitialState("main"),
  turn: candidate.turn,
  stats: candidate.stats,
  yearStartStats: candidate.yearStartStats,
  selectedPolicyId: action.policyId,
  selectedCommandIds: action.commandIds,
});

const toCandidate = (candidate, resolved) => {
  if (resolved.gameOver) return null;
  const nextStats = resolved.pendingYearEnd?.statsAfter ?? resolved.stats;
  const objective = resolved.pendingYearEnd?.annualObjective ?? resolved.ending?.annualObjective;
  return {
    turn: candidate.turn + 1,
    stats: nextStats,
    yearStartStats: resolved.pendingYearEnd ? nextStats : candidate.yearStartStats,
    completedObjectives: candidate.completedObjectives + (objective?.completed ? 1 : 0),
  };
};

const forecastAction = (candidate, action) => {
  const resolved = resolveTurn(makeState(candidate, action), () => 1);
  return toCandidate(candidate, resolved);
};

const chooseAction = (candidate, strategy, decisionRng) => {
  const rankedActions = [];
  for (const action of actions) {
    const forecast = forecastAction(candidate, action);
    if (!forecast) continue;
    rankedActions.push({ action, value: strategy.utility(forecast) });
  }

  rankedActions.sort((a, b) => b.value - a.value);
  if (!strategy.selectionPool) return rankedActions[0]?.action ?? actions[0];

  const pool = rankedActions.slice(0, strategy.selectionPool);
  const bias = strategy.selectionBias ?? 1;
  const selectedIndex = Math.min(pool.length - 1, Math.floor(decisionRng() ** bias * pool.length));
  return pool[selectedIndex]?.action ?? rankedActions[0]?.action ?? actions[0];
};

const playTurn = (candidate, action, strategy, rng) => {
  const state = makeState(candidate, action);
  let resolved = resolveTurn(state, rng);
  const choices = resolved.result.randomEvent?.event.choices;

  if (choices?.length) {
    let bestResolved = null;
    let bestValue = -Infinity;
    for (const choice of choices) {
      const choiceResolved = resolveRandomEventChoice({
        ...state,
        stats: resolved.stats,
        lastResult: resolved.result,
      }, choice.id);
      if (!choiceResolved) continue;
      const choiceCandidate = toCandidate(candidate, choiceResolved);
      const value = choiceCandidate ? strategy.utility(choiceCandidate) : -Infinity;
      if (value > bestValue) {
        bestValue = value;
        bestResolved = choiceResolved;
      }
    }
    resolved = bestResolved ?? resolved;
  }

  return toCandidate(candidate, resolved);
};

const runStrategy = (strategy, seed) => {
  const eventRng = seededRandom(seed);
  const decisionRng = seededRandom(seed * 2654435761);
  const commandCounts = Object.fromEntries(commands.map((command) => [command.id, 0]));
  const policyCounts = Object.fromEntries(policies.map((policy) => [policy.id, 0]));
  let candidate = {
    turn: 1,
    stats: { ...initialStats },
    yearStartStats: { ...initialStats },
    completedObjectives: 0,
  };

  for (let turn = 1; turn <= 36; turn += 1) {
    const action = chooseAction(candidate, strategy, decisionRng);
    candidate = playTurn(candidate, action, strategy, eventRng);
    if (!candidate) return null;
    action.commandIds.forEach((commandId) => { commandCounts[commandId] += 1; });
    policyCounts[action.policyId] += 1;
  }

  return { ...candidate, commandCounts, policyCounts };
};

const getRank = (score) =>
  score >= 90 ? "S" : score >= 82 ? "A" : score >= 76 ? "B" : score >= 70 ? "C" : score >= 64 ? "D" : "E";

const percentile = (values, ratio) => values[Math.floor((values.length - 1) * ratio)];

const summarize = (strategy) => {
  const survivors = [];
  for (let seed = 1; seed <= trials; seed += 1) {
    const result = runStrategy(strategy, seed);
    if (result) survivors.push(result);
    if (seed % 25 === 0) process.stdout.write(`\r${strategy.label}: ${seed}/${trials}`);
  }
  process.stdout.write("\n");

  const scored = survivors
    .map((result) => ({ ...result, score: calculateScore(result.stats) }))
    .sort((a, b) => a.score - b.score);
  const scores = scored.map((result) => result.score);
  const meanScore = scores.reduce((total, score) => total + score, 0) / scores.length;
  const standardDeviation = Math.sqrt(
    scores.reduce((total, score) => total + (score - meanScore) ** 2, 0) / scores.length,
  );
  const rankCounts = { S: 0, A: 0, B: 0, C: 0, D: 0, E: 0 };
  scored.forEach((result) => { rankCounts[getRank(result.score)] += 1; });
  const scoreBands = {
    under50: 0,
    "50-59": 0,
    "60-69": 0,
    "70-79": 0,
    "80-84": 0,
    "85-89": 0,
    "90-94": 0,
    "95-100": 0,
  };
  scores.forEach((score) => {
    const band = score < 50 ? "under50"
      : score < 60 ? "50-59"
        : score < 70 ? "60-69"
          : score < 80 ? "70-79"
            : score < 85 ? "80-84"
              : score < 90 ? "85-89"
                : score < 95 ? "90-94" : "95-100";
    scoreBands[band] += 1;
  });
  const meanStats = Object.fromEntries(Object.keys(initialStats).map((key) => [
    key,
    Math.round(scored.reduce((total, result) => total + result.stats[key], 0) / scored.length * 10) / 10,
  ]));
  const topCommands = commands
    .map((command) => ({
      command: command.shortName,
      usesPerRun: Math.round(scored.reduce((total, result) => total + result.commandCounts[command.id], 0) / scored.length * 10) / 10,
    }))
    .sort((a, b) => b.usesPerRun - a.usesPerRun)
    .slice(0, 6);
  const policyUsage = policies
    .map((policy) => ({
      policy: policy.name,
      monthsPerRun: Math.round(scored.reduce((total, result) => total + result.policyCounts[policy.id], 0) / scored.length * 10) / 10,
    }))
    .sort((a, b) => b.monthsPerRun - a.monthsPerRun);

  return {
    strategy: strategy.label,
    attempts: trials,
    cleared: scored.length,
    gameOvers: trials - scored.length,
    scores: {
      min: scores[0],
      p10: percentile(scores, 0.1),
      median: percentile(scores, 0.5),
      mean: Math.round(meanScore * 10) / 10,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      p90: percentile(scores, 0.9),
      max: scores.at(-1),
    },
    rankCounts,
    scoreBands,
    meanCompletedObjectives: Math.round(scored.reduce((total, result) => total + result.completedObjectives, 0) / scored.length * 100) / 100,
    meanStats,
    topCommands,
    policyUsage,
  };
};

const selectedStrategies = requestedStrategyId
  ? strategies.filter((strategy) => strategy.id === requestedStrategyId)
  : strategies;

if (selectedStrategies.length === 0) {
  throw new Error(`Unknown strategy: ${requestedStrategyId}`);
}

const results = selectedStrategies.map(summarize);
console.dir({ trialsPerStrategy: trials, actionCandidatesPerMonth: actions.length, results }, { depth: null });

await server.close();
