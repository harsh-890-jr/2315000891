const express = require("express");
const axios = require("axios");
const { schedule } = require("./scheduler");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const DEPOT_API = "http://4.224.186.213/evaluation-service/depots";

/**
 * GET /schedule
 * Fetches depot data from API and runs scheduler
 * Query params:
 *   - depot_id: (optional) filter by specific depot
 *   - budget: (required) mechanic-hour budget for the day
 */
app.get("/schedule", async (req, res) => {
  const { budget, depot_id } = req.query;

  if (!budget) {
    return res
      .status(400)
      .json({ error: "budget query parameter is required" });
  }

  const budgetNum = parseFloat(budget);
  if (isNaN(budgetNum) || budgetNum <= 0) {
    return res.status(400).json({ error: "budget must be a positive number" });
  }

  try {
    // Fetch depot and task data from protected API
    // NOTE: Add Authorization header if token is provided
    const headers = {};
    if (process.env.API_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.API_TOKEN}`;
    }

    const response = await axios.get(DEPOT_API, { headers });
    let depots = response.data.depots || response.data;

    // Filter by depot_id if provided
    if (depot_id) {
      depots = depots.filter((d) => String(d.id) === String(depot_id));
      if (depots.length === 0) {
        return res.status(404).json({ error: `Depot ${depot_id} not found` });
      }
    }

    // Process each depot
    const results = depots.map((depot) => {
      const tasks = (depot.tasks || depot.vehicles || []).map((t) => ({
        id: t.id || t.vehicle_id,
        name: t.name || t.vehicle_name || `Vehicle ${t.id}`,
        score: t.operational_impact_score || t.score || 0,
        duration: t.estimated_service_duration || t.duration || 0,
      }));

      const result = schedule(tasks, budgetNum);

      return {
        depotId: depot.id,
        depotName: depot.name,
        budget: budgetNum,
        ...result,
        selectedVehicleIds: result.selectedTasks.map((t) => t.id),
      };
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({
        error: "Failed to fetch depot data",
        details: err.response.data,
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /schedule/custom
 * Run scheduler on custom task input (for testing)
 * Body: { tasks: [{id, name, score, duration}], budget: number }
 */
app.post("/schedule/custom", (req, res) => {
  const { tasks, budget } = req.body;

  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "tasks array is required" });
  }
  if (!budget || budget <= 0) {
    return res.status(400).json({ error: "valid budget is required" });
  }

  try {
    const result = schedule(tasks, budget);
    res.json({
      success: true,
      budget,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "vehicle-maintenance-scheduler" })
);

app.listen(PORT, () => {
  console.log(`Vehicle Maintenance Scheduler running on port ${PORT}`);
});

module.exports = app;
