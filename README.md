# Campus Hiring Evaluation - Backend Track

## Repository Structure

```
.
├── logging_middleware/          # HTTP request/response logger middleware
├── vehicle_scheduling/          # Vehicle Maintenance Scheduler Microservice
├── notification_app_be/         # Notification App Backend (Priority Inbox)
├── notification_app_fe/         # Notification App Frontend (placeholder)
└── notification_system_design.md # System design (Stages 1–6)
```

---

## logging_middleware

Custom Express middleware that logs every HTTP request and response as structured JSON.

**Run:**
```bash
cd logging_middleware
npm install
npm start
# Server on http://localhost:3000
```

**Features:**
- Unique `requestId` (UUID) per request
- Logs: method, URL, IP, userAgent, statusCode, responseTimeMs
- Error logger middleware included

---

## vehicle_scheduling

Vehicle Maintenance Scheduler Microservice using 0/1 Knapsack algorithm.

**Run:**
```bash
cd vehicle_scheduling
npm install
npm start
# Server on http://localhost:3001
```

**Endpoints:**
- `GET /schedule?budget=8` — Fetches depot data from API, returns optimal task set
- `POST /schedule/custom` — Run scheduler on custom input
- `GET /health`

**Algorithm:** DP-based exact Knapsack for small inputs, greedy approximation for large scale.

---

## notification_app_be

Notification backend with Priority Inbox (Stage 6) using Min-Heap.

**Run:**
```bash
cd notification_app_be
npm install
npm start
# Server on http://localhost:3002
```

**Endpoints:**
- `GET /notifications/priority?n=10` — Top-N priority notifications
- `POST /notifications/priority/custom` — Test with custom data
- `GET /notifications/all` — Raw notifications from API
- `GET /health`

**Priority Logic:** Placement (3) > Result (2) > Event (1), with recency as tiebreaker. Min-Heap maintains top-N in O(M log N).

---

## notification_system_design.md

Full system design covering:
- Stage 1: REST API design + WebSocket real-time mechanism
- Stage 2: PostgreSQL schema + scaling strategies
- Stage 3: Query analysis, indexing, optimization
- Stage 4: Caching strategy (Redis + WebSocket push)
- Stage 5: Async queue architecture for bulk notifications
- Stage 6: Priority Inbox with Min-Heap algorithm

---

## Environment Variables

Create a `.env` file in each service folder:
```
API_TOKEN=<your_token_here>
PORT=3001
```
