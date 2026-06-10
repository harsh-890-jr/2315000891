import React, { useState, useMemo } from "react";
import {
  Box, Typography, Stack, Tabs, Tab,
  Alert, Skeleton, Chip, Card,
  FormControl, InputLabel, Select, MenuItem,
  Button,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import NotificationCard from "../components/NotificationCard";
import logger from "../utils/logger";

const TYPE_FILTERS = ["All", "Placement", "Result", "Event"];

export default function AllNotificationsPage({
  allNotifications, loading, error, markAsRead, markAllRead, unreadCount, lastFetched
}) {
  const [tab, setTab] = useState(0); // 0=All, 1=Unread, 2=Read
  const [typeFilter, setTypeFilter] = useState("All");

  const handleTabChange = (_, val) => {
    setTab(val);
    logger.userAction("ALL_NOTIFS_TAB_CHANGED", { tab: val });
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    logger.userAction("ALL_NOTIFS_FILTER_CHANGED", { filter: e.target.value });
  };

  const displayed = useMemo(() => {
    let list = [...allNotifications];
    // Sort by timestamp (newest first)
    list.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
    // Tab filter
    if (tab === 1) list = list.filter((n) => !n.isRead);
    if (tab === 2) list = list.filter((n) => n.isRead);
    // Type filter
    if (typeFilter !== "All") list = list.filter((n) => n.Type === typeFilter);
    return list;
  }, [allNotifications, tab, typeFilter]);

  const totalUnread = allNotifications.filter((n) => !n.isRead).length;
  const totalRead = allNotifications.filter((n) => n.isRead).length;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: 2,
                background: "linear-gradient(135deg, #1A56DB, #0E9F6E)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <NotificationsIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="#111827">
                All Notifications
              </Typography>
              {lastFetched && (
                <Typography variant="caption" color="text.secondary">
                  Updated {lastFetched.toLocaleTimeString("en-IN")}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        {totalUnread > 0 && (
          <Button
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={markAllRead}
            variant="outlined"
            sx={{ borderColor: "#D1D5DB", color: "#374151" }}
          >
            Mark all read
          </Button>
        )}
      </Stack>

      {/* Stats row */}
      {!loading && !error && (
        <Stack direction="row" spacing={1.5} mb={3} flexWrap="wrap">
          <Chip
            label={`${allNotifications.length} total`}
            sx={{ bgcolor: "#F3F4F6", color: "#374151", fontWeight: 700 }}
          />
          <Chip
            label={`${totalUnread} unread`}
            sx={{ bgcolor: "#FEF2F2", color: "#E02424", fontWeight: 700, border: "1px solid #FECACA" }}
          />
          <Chip
            label={`${totalRead} read`}
            sx={{ bgcolor: "#F0FDF4", color: "#0E9F6E", fontWeight: 700, border: "1px solid #A7F3D0" }}
          />
        </Stack>
      )}

      {/* Filter bar */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3} alignItems="flex-start">
        <Tabs
          value={tab}
          onChange={handleTabChange}
          sx={{
            bgcolor: "#F3F4F6", borderRadius: 2, p: 0.5, minHeight: 38,
            "& .MuiTab-root": { minHeight: 32, py: 0.5, px: 1.5, borderRadius: 1.5, fontSize: "0.82rem" },
            "& .Mui-selected": { bgcolor: "#fff", color: "#1A56DB !important", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
            "& .MuiTabs-indicator": { display: "none" },
          }}
        >
          <Tab label="All" />
          <Tab label={`Unread${totalUnread > 0 ? ` (${totalUnread})` : ""}`} />
          <Tab label={`Read${totalRead > 0 ? ` (${totalRead})` : ""}`} />
        </Tabs>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} onChange={handleTypeFilter} label="Type">
            {TYPE_FILTERS.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Loading */}
      {loading && (
        <Stack spacing={1.5}>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      )}

      {/* Error */}
      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      )}

      {/* Empty state */}
      {!loading && !error && displayed.length === 0 && (
        <Card sx={{ textAlign: "center", py: 6 }}>
          <NotificationsIcon sx={{ fontSize: 48, color: "#D1D5DB", mb: 1 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            No notifications found
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Try changing the filter or check back later.
          </Typography>
        </Card>
      )}

      {/* List */}
      {!loading && !error && displayed.length > 0 && (
        <Box>
          {displayed.map((n) => (
            <NotificationCard
              key={n.ID}
              notification={n}
              onMarkRead={markAsRead}
              showPriorityScore={false}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
