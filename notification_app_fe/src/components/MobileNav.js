import React from "react";
import { BottomNavigation, BottomNavigationAction, Paper, Badge } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNavigate, useLocation } from "react-router-dom";

export default function MobileNav({ unreadCount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const value = location.pathname === "/" ? 0 : 1;

  return (
    <Paper
      sx={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        zIndex: 100, display: { xs: "block", sm: "none" },
        borderTop: "1px solid #E5E7EB",
      }}
      elevation={0}
    >
      <BottomNavigation
        value={value}
        onChange={(_, v) => navigate(v === 0 ? "/" : "/all")}
        sx={{ "& .Mui-selected": { color: "#1A56DB" } }}
      >
        <BottomNavigationAction label="Priority" icon={<EmojiEventsIcon />} />
        <BottomNavigationAction
          label="All"
          icon={
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsIcon />
            </Badge>
          }
        />
      </BottomNavigation>
    </Paper>
  );
}
