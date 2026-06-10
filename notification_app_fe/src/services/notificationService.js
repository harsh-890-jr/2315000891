import axios from "axios";
import logger from "../utils/logger";

const NOTIFICATION_API = "http://4.224.186.213/evaluation-service/notifications";

const apiClient = axios.create({ timeout: 10000 });

// Request interceptor - log every outgoing request
apiClient.interceptors.request.use((config) => {
  config._startTime = Date.now();
  logger.apiRequest(config.method?.toUpperCase(), config.url);
  return config;
});

// Response interceptor - log response + duration
apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config._startTime;
    logger.apiResponse(
      response.config.method?.toUpperCase(),
      response.config.url,
      response.status,
      duration
    );
    return response;
  },
  (error) => {
    logger.apiError(
      error.config?.method?.toUpperCase(),
      error.config?.url,
      error
    );
    return Promise.reject(error);
  }
);

/**
 * Fetch all notifications from the evaluation API
 * API is pre-authorised per evaluation constraints
 */
export async function fetchNotifications() {
  const response = await apiClient.get(NOTIFICATION_API);
  return response.data.notifications || response.data || [];
}
