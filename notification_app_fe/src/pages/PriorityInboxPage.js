import React, { useState } from "react";
import {
  Box, Typography, Stack, Slider, Card, CardContent,
  Alert, Skeleton, Button, Chip, Divider, Tooltip,
  Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import NotificationCard from "../components/NotificationCard";
import logger from "../utils/logger";

const TYPE_FILTERS = ["All", "Placement", "Result", "Event"];

export default function PriorityInboxPage({ notifications, loading, error, markAsRead, markAllRead, unreadCount }) {
  const [topN, setTopN] = useState(10);
  const [typeFilter, setTypeFilter] = useState("All");
  const [showScore, setShowScore] = useState(false);

  // Already sorted by priority from hook; apply type filter on top
  const filtered = notifications
    .filter((n) => typeFilter === "All" || n.Type === typeFilter)
    .slice(0, topN);

  const handleMarkAllRead = () => {
    markAllRead();
    logger.userAction("PRIORITY_INBOX_MARK_ALL_READ");
  };

  const handleTopNChange = (_, val) => {
    setTopN(val);
    logger.userAction("TOPN_CHANGED", { value: val });
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    logger.userAction("TYPE_FILTER_CHANGED", { filter: e.target.value });
  };

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: 2,
                background: "linear-gradient(135deg, #7C3AED, #1A56DB)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <EmojiEventsIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="#111827">
                Priority Inbox
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Top {topN} most important unread notifications
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Tooltip title="Toggle priority score display">
            <Chip
              label={showScore ? "Hide Scores" : "Show Scores"}
              size="small"
              variant="outlined"
              onClick={() => setShowScore((s) => !s)}
              sx={{ cursor: "pointer", fontWeight: 600 }}
            />
          </Tooltip>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllRead}
              variant="outlined"
              sx={{ borderColor: "#D1D5DB", color: "#374151" }}
            >
              Mark all read
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="flex-start">
            {/* Top-N slider */}
            <Box flex={1}>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  Show top
                </Typography>
                <Chip label={topN} size="small" sx={{ bgcolor: "#1A56DB", color: "#fff", fontWeight: 700, minWidth: 32 }} />
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  notifications
                </Typography>
                <Tooltip title="Adjust how many top-priority notifications to display. Uses Min-Heap algorithm for O(M log N) efficiency.">
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: "#9CA3AF", cursor: "help" }} />
                </Tooltip>
              </Stack>
              <Slider
                value={topN}
                onChange={handleTopNChange}
                min={5}
                max={20}
                step={5}
                marks={[
                  { value: 5, label: "5" },
                  { value: 10, label: "10" },
                  { value: 15, label: "15" },
                  { value: 20, label: "20" },
                ]}
                sx={{ color: "#1A56DB", maxWidth: 280 }}
              />
            </Box>

            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

            {/* Type filter */}
            <Box>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Filter by type</InputLabel>
                <Select value={typeFilter} onChange={handleTypeFilter} label="Filter by type">
                  {TYPE_FILTERS.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Algorithm info banner */}
      <Alert
        severity="info"
        icon={false}
        sx={{
          mb: 2, borderRadius: 2, fontSize: "0.8rem",
          bgcolor: "#EEF2FF", color: "#3730A3", border: "1px solid #C7D2FE",
        }}
      >
        <strong>Priority Algorithm:</strong> Placement (weight 3) › Result (2) › Event (1) · Recency as tiebreaker ·
        Min-Heap maintains top-{topN} in O(M log N) as new notifications arrive
      </Alert>

      {/* Loading skeletons */}
      {loading && (
        <Stack spacing={1.5}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      )}

      {/* Error */}
      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <Card sx={{ textAlign: "center", py: 6 }}>
          <EmojiEventsIcon sx={{ fontSize: 48, color: "#D1D5DB", mb: 1 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            All caught up!
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            No unread notifications matching the current filter.
          </Typography>
        </Card>
      )}

      {/* Notification list */}
      {!loading && !error && filtered.length > 0 && (
        <Box>
          {filtered.map((n) => (
            <NotificationCard
              key={n.ID}
              notification={n}
              onMarkRead={markAsRead}
              showPriorityScore={showScore}
            />
          ))}
          {filtered.length === topN && (
            <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
              Showing top {topN} — adjust slider to see more
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
