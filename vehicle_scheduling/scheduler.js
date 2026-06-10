/**
 * Vehicle Maintenance Scheduler
 * Problem: 0/1 Knapsack - maximize operational_impact_score within mechanic-hour budget
 *
 * Approach:
 * - Since tasks can be large, use a greedy + DP hybrid
 * - For small budgets: classic DP O(n * W)
 * - For large budgets or float durations: fractional greedy by ratio (score/time)
 *   then force integer selection via sorted greedy
 */

/**
 * DP-based 0/1 Knapsack (works when budget is integer hours)
 * @param {Array} tasks - [{id, score, duration}]
 * @param {number} budget - total mechanic-hours available
 * @returns {object} - { selectedTasks, totalScore, totalTime }
 */
function knapsackDP(tasks, budget) {
  const n = tasks.length;
  // Scale durations to integers (multiply by 100 to handle decimals up to 2dp)
  const scale = 100;
  const W = Math.floor(budget * scale);

  // dp[i] = max score achievable with capacity i
  const dp = new Array(W + 1).fill(0);
  const selected = new Array(W + 1).fill(null).map(() => []);

  for (let i = 0; i < n; i++) {
    const task = tasks[i];
    const w = Math.round(task.duration * scale);
    const v = task.score;

    // Traverse backwards to avoid using same item twice
    for (let j = W; j >= w; j--) {
      if (dp[j - w] + v > dp[j]) {
        dp[j] = dp[j - w] + v;
        selected[j] = [...selected[j - w], task];
      }
    }
  }

  const result = selected[W];
  const totalScore = result.reduce((s, t) => s + t.score, 0);
  const totalTime = result.reduce((s, t) => s + t.duration, 0);

  return {
    selectedTasks: result,
    totalScore,
    totalTime: Math.round(totalTime * 100) / 100,
  };
}

/**
 * Greedy approximation by score/duration ratio
 * Use when DP is too slow (large budget)
 * @param {Array} tasks
 * @param {number} budget
 */
function greedySchedule(tasks, budget) {
  // Sort by efficiency: score per hour (descending)
  const sorted = [...tasks].sort(
    (a, b) => b.score / b.duration - a.score / a.duration
  );

  let remaining = budget;
  const selectedTasks = [];

  for (const task of sorted) {
    if (task.duration <= remaining) {
      selectedTasks.push(task);
      remaining -= task.duration;
    }
  }

  const totalScore = selectedTasks.reduce((s, t) => s + t.score, 0);
  const totalTime = selectedTasks.reduce((s, t) => s + t.duration, 0);

  return {
    selectedTasks,
    totalScore,
    totalTime: Math.round(totalTime * 100) / 100,
  };
}

/**
 * Auto-selects algorithm based on input size
 * DP for small inputs, greedy for large
 */
function schedule(tasks, budget) {
  const DP_THRESHOLD = 500; // tasks * budget scale

  if (tasks.length <= 50 && budget <= DP_THRESHOLD) {
    return { algorithm: "DP (exact)", ...knapsackDP(tasks, budget) };
  } else {
    return {
      algorithm: "Greedy (approximation)",
      ...greedySchedule(tasks, budget),
    };
  }
}

module.exports = { schedule, knapsackDP, greedySchedule };
