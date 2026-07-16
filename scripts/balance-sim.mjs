import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

const { commands } = await server.ssrLoadModule("/src/data/commands.ts");
const { policies } = await server.ssrLoadModule("/src/data/policies.ts");
const { initialStats, createInitialState } = await server.ssrLoadModule("/src/game/initialState.ts");
const { calculateScore } = await server.ssrLoadModule("/src/game/calculations.ts");
const { resolveRandomEventChoice, resolveTurn } = await server.ssrLoadModule("/src/game/eventResolver.ts");

const commandSets = [];
const collectCommandSets = (start, remainingAp, selected) => {
  if (selected.length > 0) commandSets.push([...selected]);
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

const playTurn = (candidate, action, rng = () => 1) => {
  const state = {
    ...createInitialState("main"),
    turn: candidate.turn,
    stats: candidate.stats,
    yearStartStats: candidate.yearStartStats,
    selectedPolicyId: action.policyId,
    selectedCommandIds: action.commandIds,
  };
  let resolved = resolveTurn(state, rng);
  const eventChoices = resolved.result.randomEvent?.event.choices;
  if (eventChoices?.length) {
    const choiceIndex = Math.min(eventChoices.length - 1, Math.floor(rng() * eventChoices.length));
    const choice = eventChoices[choiceIndex];
    resolved = resolveRandomEventChoice({
      ...state,
      stats: resolved.stats,
      lastResult: resolved.result,
    }, choice.id) ?? resolved;
  }
  if (resolved.gameOver) return null;
  const nextStats = resolved.pendingYearEnd?.statsAfter ?? resolved.stats;
  return {
    turn: candidate.turn + 1,
    stats: nextStats,
    yearStartStats: resolved.pendingYearEnd ? nextStats : candidate.yearStartStats,
    path: [...candidate.path, action],
  };
};

const stateKey = (candidate) => Object.values(candidate.stats).join(",");
const searchValue = (candidate) => {
  const budgetValue = Math.max(-20, Math.min(35, candidate.stats.budget)) * 0.08;
  return calculateScore(candidate.stats) + budgetValue;
};

const beamSearch = (beamWidth = Number(process.argv[2] ?? 500)) => {
  let beam = [{ turn: 1, stats: { ...initialStats }, yearStartStats: { ...initialStats }, path: [] }];
  for (let turn = 1; turn <= 36; turn += 1) {
    const nextByStats = new Map();
    for (const candidate of beam) {
      for (const action of actions) {
        const next = playTurn(candidate, action);
        if (!next) continue;
        const key = stateKey(next);
        const previous = nextByStats.get(key);
        if (!previous || searchValue(next) > searchValue(previous)) nextByStats.set(key, next);
      }
    }
    beam = [...nextByStats.values()]
      .sort((a, b) => searchValue(b) - searchValue(a))
      .slice(0, beamWidth);
    process.stdout.write(`\rbeam turn ${turn}: ${beam.length}`);
  }
  process.stdout.write("\n");
  return beam.sort((a, b) => calculateScore(b.stats) - calculateScore(a.stats))[0];
};

const seededRandom = (seed) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

const randomRun = (seed) => {
  const rng = seededRandom(seed);
  let candidate = { turn: 1, stats: { ...initialStats }, yearStartStats: { ...initialStats }, path: [] };
  for (let turn = 1; turn <= 36; turn += 1) {
    const viable = actions.filter((action) => {
      const cost = action.commandIds.reduce((total, id) => total + commands.find((item) => item.id === id).budgetCost, 0);
      const hasRest = action.commandIds.includes("rest") || action.commandIds.includes("workflow_review");
      if (candidate.stats.budget - cost <= -15) return false;
      if (candidate.stats.staffFatigue >= 75 && !hasRest) return false;
      return true;
    });
    const action = viable[Math.floor(rng() * viable.length)] ?? actions[0];
    const next = playTurn(candidate, action, rng);
    if (!next) return null;
    candidate = next;
  }
  return candidate;
};

const percentile = (values, ratio) => values[Math.floor((values.length - 1) * ratio)];
const randomRuns = Array.from({ length: 1000 }, (_, index) => randomRun(index + 1))
  .filter(Boolean)
  .sort((a, b) => calculateScore(a.stats) - calculateScore(b.stats));
const randomScores = randomRuns.map((run) => calculateScore(run.stats));
const medianRun = randomRuns[Math.floor(randomRuns.length / 2)];
const best = process.argv.includes("--random-only") ? null : beamSearch();
const rankCounts = randomScores.reduce(
  (counts, score) => {
    const rank = score >= 90 ? "S" : score >= 82 ? "A" : score >= 76 ? "B" : score >= 70 ? "C" : score >= 64 ? "D" : "E";
    counts[rank] += 1;
    return counts;
  },
  { S: 0, A: 0, B: 0, C: 0, D: 0, E: 0 },
);
const meanScore = randomScores.reduce((total, score) => total + score, 0) / randomScores.length;
const scoreBands = randomScores.reduce(
  (bands, score) => {
    const label =
      score < 50 ? "under50" :
        score < 55 ? "50-54" :
          score < 60 ? "55-59" :
            score < 65 ? "60-64" :
              score < 70 ? "65-69" :
                score < 75 ? "70-74" :
                  score < 80 ? "75-79" :
                    score < 85 ? "80-84" :
                      score < 90 ? "85-89" : "90plus";
    bands[label] += 1;
    return bands;
  },
  { under50: 0, "50-54": 0, "55-59": 0, "60-64": 0, "65-69": 0, "70-74": 0, "75-79": 0, "80-84": 0, "85-89": 0, "90plus": 0 },
);

console.log({
  actionCount: actions.length,
  initialScore: calculateScore(initialStats),
  randomAttempts: 1000,
  randomSurvivors: randomScores.length,
  randomGameOvers: 1000 - randomScores.length,
  randomScores: {
    min: randomScores[0],
    p10: percentile(randomScores, 0.1),
    p25: percentile(randomScores, 0.25),
    p50: percentile(randomScores, 0.5),
    mean: Math.round(meanScore * 10) / 10,
    p75: percentile(randomScores, 0.75),
    p90: percentile(randomScores, 0.9),
    max: randomScores.at(-1),
  },
  rankCounts,
  scoreBands,
  medianStats: medianRun?.stats,
  best: best
    ? {
        score: calculateScore(best.stats),
        stats: best.stats,
        actions: best.path.map((action, index) => ({ month: index + 1, ...action })),
      }
    : null,
});

await server.close();
