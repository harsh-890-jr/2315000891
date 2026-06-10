const express = require("express");
const axios = require("axios");
const { getTopNNotifications } = require("./priorityInbox");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// CORS for frontend
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

const NOTIFICATION_API =
  "http://4.224.186.213/evaluation-service/notifications";

/**
 * GET /notifications/priority
 * Fetches notifications from API and returns top-N by priority
 * Query: ?n=10 (default 10)
 */
app.get("/notifications/priority", async (req, res) => {
  const n = parseInt(req.query.n) || 10;

  if (n < 1 || n > 100) {
    return res.status(400).json({ error: "n must be between 1 and 100" });
  }

  try {
    const headers = {};
    if (process.env.API_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.API_TOKEN}`;
    }

    const response = await axios.get(NOTIFICATION_API, { headers });
    const notifications = response.data.notifications || response.data;

    const topN = getTopNNotifications(notifications, n);

    res.json({
      success: true,
      requestedTop: n,
      total: notifications.length,
      priorityNotifications: topN,
    });
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({
        error: "Failed to fetch notifications",
        details: err.response.data,
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /notifications/priority/custom
 * Test priority engine with custom notification data
 */
app.post("/notifications/priority/custom", (req, res) => {
  const { notifications, n = 10 } = req.body;

  if (!notifications || !Array.isArray(notifications)) {
    return res.status(400).json({ error: "notifications array required" });
  }

  const topN = getTopNNotifications(notifications, n);
  res.json({
    success: true,
    requestedTop: n,
    total: notifications.length,
    priorityNotifications: topN,
  });
});

/**
 * GET /notifications/all
 * Fetch raw notifications from API
 */
app.get("/notifications/all", async (req, res) => {
  try {
    const headers = {};
    if (process.env.API_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.API_TOKEN}`;
    }

    const response = await axios.get(NOTIFICATION_API, { headers });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "notification-app-backend" })
);

app.listen(PORT, () => {
  console.log(`Notification App Backend running on port ${PORT}`);
});

module.exports = app;
