import React from "react";
import {
  Card, CardContent, Box, Typography, Chip,
  IconButton, Tooltip, Stack,
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import EventIcon from "@mui/icons-material/Event";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

const TYPE_CONFIG = {
  Placement: {
    color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
    Icon: WorkIcon, label: "Placement",
  },
  Result: {
    color: "#1A56DB", bg: "#EBF5FB", border: "#BFDBFE",
    Icon: SchoolIcon, label: "Result",
  },
  Event: {
    color: "#0E9F6E", bg: "#ECFDF5", border: "#A7F3D0",
    Icon: EventIcon, label: "Event",
  },
};

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts.replace(" ", "T"));
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)  return `${diffHrs}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationCard({ notification, onMarkRead, showPriorityScore }) {
  const cfg = TYPE_CONFIG[notification.Type] || TYPE_CONFIG.Event;
  const { Icon } = cfg;
  const isNew = !notification.isRead;

  return (
    <Card
      sx={{
        mb: 1.5,
        borderLeft: `4px solid ${cfg.color}`,
        background: isNew ? cfg.bg : "#FAFAFA",
        opacity: notification.isRead ? 0.75 : 1,
        transition: "all 0.2s ease",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.10)", transform: "translateY(-1px)" },
        cursor: "default",
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          {/* Type icon */}
          <Box
            sx={{
              mt: 0.3,
              width: 36, height: 36, borderRadius: 2,
              background: cfg.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>

          {/* Content */}
          <Box flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.3}>
              <Chip
                label={cfg.label}
                size="small"
                sx={{ bgcolor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, height: 20 }}
              />
              {isNew && (
                <FiberManualRecordIcon sx={{ color: cfg.color, fontSize: 8 }} />
              )}
              {showPriorityScore && notification.priorityScore !== undefined && (
                <Chip
                  label={`Score: ${notification.priorityScore.toFixed(2)}`}
                  size="small"
                  sx={{ height: 18, fontSize: "0.65rem", bgcolor: "#F3F4F6", color: "#6B7280" }}
                />
              )}
            </Stack>

            <Typography
              variant="body2"
              fontWeight={isNew ? 600 : 400}
              color="text.primary"
              sx={{ lineHeight: 1.4, mb: 0.2 }}
              noWrap
            >
              {notification.Message}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {formatTime(notification.Timestamp)}
            </Typography>
          </Box>

          {/* Mark read */}
          {isNew && (
            <Tooltip title="Mark as read">
              <IconButton
                size="small"
                onClick={() => onMarkRead(notification.ID)}
                sx={{ color: "#9CA3AF", "&:hover": { color: cfg.color } }}
              >
                <DoneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
