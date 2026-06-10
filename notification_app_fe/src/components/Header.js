import React from "react";
import {
  AppBar, Toolbar, Typography, Box, Badge,
  IconButton, Chip, Tooltip, Stack,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header({ unreadCount, onRefresh, loading }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Logo / Brand */}
        <Stack direction="row" alignItems="center" spacing={1.5} flex={1}>
          <Box
            sx={{
              width: 34, height: 34, borderRadius: 2,
              background: "linear-gradient(135deg, #1A56DB 0%, #7C3AED 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <NotificationsIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#111827" lineHeight={1}>
              CampusNotify
            </Typography>
            <Typography variant="caption" color="text.secondary" lineHeight={1}>
              Stay ahead of what matters
            </Typography>
          </Box>
        </Stack>

        {/* Nav Links */}
        <Stack direction="row" spacing={0.5} mr={2} sx={{ display: { xs: "none", sm: "flex" } }}>
          {[
            { label: "Priority Inbox", path: "/" },
            { label: "All Notifications", path: "/all" },
          ].map(({ label, path }) => (
            <Chip
              key={path}
              label={label}
              onClick={() => navigate(path)}
              variant={location.pathname === path ? "filled" : "outlined"}
              size="small"
              sx={{
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
                bgcolor: location.pathname === path ? "#1A56DB" : "transparent",
                color: location.pathname === path ? "#fff" : "#6B7280",
                borderColor: location.pathname === path ? "#1A56DB" : "#D1D5DB",
                "&:hover": { bgcolor: location.pathname === path ? "#1240AA" : "#F3F4F6" },
              }}
            />
          ))}
        </Stack>

        {/* Unread badge + refresh */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} unread`}
              size="small"
              sx={{ bgcolor: "#FEF2F2", color: "#E02424", fontWeight: 700, fontSize: "0.75rem", border: "1px solid #FECACA" }}
            />
          )}
          <Tooltip title="Refresh notifications">
            <IconButton
              size="small"
              onClick={onRefresh}
              disabled={loading}
              sx={{
                color: "#6B7280",
                animation: loading ? "spin 1s linear infinite" : "none",
                "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
