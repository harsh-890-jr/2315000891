import { useState, useEffect, useCallback, useRef } from "react";
import { fetchNotifications } from "../services/notificationService";
import { getTopNNotifications } from "../utils/priorityInbox";
import logger from "../utils/logger";

export function useNotifications(topN = 10) {
  const [allNotifications, setAllNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem("readIds") || "[]"));
    } catch { return new Set(); }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const pollingRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchNotifications();
      setAllNotifications(data);
      setLastFetched(new Date());
      logger.info("NOTIFICATIONS_LOADED", { count: data.length });
    } catch (err) {
      setError("Failed to load notifications. Please try again.");
      logger.error("NOTIFICATIONS_LOAD_FAILED", { error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    load();
    // Poll every 30 seconds to simulate real-time
    pollingRef.current = setInterval(load, 30000);
    return () => clearInterval(pollingRef.current);
  }, [load]);

  // Persist read state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("readIds", JSON.stringify([...readIds]));
  }, [readIds]);

  const markAsRead = useCallback((id) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      logger.userAction("MARK_READ", { notificationId: id });
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    const ids = allNotifications.map((n) => n.ID);
    setReadIds(new Set(ids));
    logger.userAction("MARK_ALL_READ", { count: ids.length });
  }, [allNotifications]);

  // Enrich notifications with isRead flag
  const enriched = allNotifications.map((n) => ({
    ...n,
    isRead: readIds.has(n.ID),
  }));

  const unread = enriched.filter((n) => !n.isRead);
  const priorityNotifications = getTopNNotifications(unread, topN);

  return {
    allNotifications: enriched,
    priorityNotifications,
    unreadCount: unread.length,
    loading,
    error,
    lastFetched,
    markAsRead,
    markAllRead,
    refresh: load,
  };
}
