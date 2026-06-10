import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, Container } from "@mui/material";
import theme from "./theme";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";
import PriorityInboxPage from "./pages/PriorityInboxPage";
import AllNotificationsPage from "./pages/AllNotificationsPage";
import { useNotifications } from "./hooks/useNotifications";
import logger from "./utils/logger";

function AppInner() {
  const {
    allNotifications,
    priorityNotifications,
    unreadCount,
    loading,
    error,
    lastFetched,
    markAsRead,
    markAllRead,
    refresh,
  } = useNotifications(10);

  const handleRefresh = () => {
    logger.userAction("MANUAL_REFRESH");
    refresh();
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header unreadCount={unreadCount} onRefresh={handleRefresh} loading={loading} />
      <Container maxWidth="md" sx={{ py: { xs: 2.5, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
        <Routes>
          <Route
            path="/"
            element={
              <PriorityInboxPage
                notifications={priorityNotifications}
                loading={loading}
                error={error}
                markAsRead={markAsRead}
                markAllRead={markAllRead}
                unreadCount={unreadCount}
              />
            }
          />
          <Route
            path="/all"
            element={
              <AllNotificationsPage
                allNotifications={allNotifications}
                loading={loading}
                error={error}
                markAsRead={markAsRead}
                markAllRead={markAllRead}
                unreadCount={unreadCount}
                lastFetched={lastFetched}
              />
            }
          />
        </Routes>
      </Container>
      <MobileNav unreadCount={unreadCount} />
    </Box>
  );
}

export default function App() {
  logger.info("APP_INIT", { version: "1.0.0" });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </ThemeProvider>
  );
}
