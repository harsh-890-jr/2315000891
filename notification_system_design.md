# Notification System Design

---

## Stage 1

### Core Notification Actions

The notification platform must support the following core actions:
1. Send a notification to a user
2. Fetch all notifications for a logged-in user
3. Mark a notification as read
4. Delete a notification
5. Real-time push of new notifications to active users

---

### REST API Endpoints

#### 1. Create Notification
```
POST /api/v1/notifications
```
**Headers:**
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```
**Request Body:**
```json
{
  "studentId": "stu_1042",
  "type": "Placement",
  "message": "TCS is hiring – apply now!",
  "metadata": {
    "companyName": "TCS",
    "deadline": "2026-04-30"
  }
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "notification": {
    "id": "notif_abc123",
    "studentId": "stu_1042",
    "type": "Placement",
    "message": "TCS is hiring – apply now!",
    "isRead": false,
    "createdAt": "2026-04-22T17:51:30Z"
  }
}
```

---

#### 2. Get Notifications for Logged-In User
```
GET /api/v1/notifications?page=1&limit=20&isRead=false&type=Placement
```
**Headers:**
```
Authorization: Bearer <jwt_token>
```
**Response (200 OK):**
```json
{
  "success": true,
  "total": 50,
  "page": 1,
  "limit": 20,
  "notifications": [
    {
      "id": "notif_abc123",
      "studentId": "stu_1042",
      "type": "Placement",
      "message": "TCS is hiring – apply now!",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:30Z"
    }
  ]
}
```

---

#### 3. Mark Notification as Read
```
PATCH /api/v1/notifications/:notificationId/read
```
**Headers:**
```
Authorization: Bearer <jwt_token>
```
**Request Body:** *(empty)*

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "notificationId": "notif_abc123"
}
```

---

#### 4. Delete a Notification
```
DELETE /api/v1/notifications/:notificationId
```
**Headers:**
```
Authorization: Bearer <jwt_token>
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification deleted",
  "notificationId": "notif_abc123"
}
```

---

#### 5. Mark All as Read
```
PATCH /api/v1/notifications/read-all
```
**Headers:**
```
Authorization: Bearer <jwt_token>
```
**Response (200 OK):**
```json
{
  "success": true,
  "updatedCount": 15
}
```

---

### Real-Time Notification Mechanism: WebSockets (Socket.IO)

**Rationale:** Polling increases DB load with 50,000 students. WebSockets maintain a persistent connection and push events only when something happens.

**Architecture:**
```
Client (browser/app)
     |
     |--- WebSocket Handshake (ws://)
     |
Socket.IO Server (Node.js)
     |
     |--- Subscribes to Redis Pub/Sub channel: notify:<studentId>
     |
When a notification is created:
  - Server publishes to Redis channel notify:<studentId>
  - Socket.IO server receives event and pushes to connected client
```

**Socket.IO Event Contract:**

Client connects with JWT:
```javascript
const socket = io("ws://api.example.com", {
  auth: { token: "<jwt_token>" }
});

socket.on("new_notification", (data) => {
  // data: { id, type, message, createdAt }
  showToast(data.message);
});
```

Server emits:
```javascript
io.to(studentSocketId).emit("new_notification", {
  id: "notif_xyz",
  type: "Placement",
  message: "Google hiring starts today!",
  createdAt: "2026-04-22T18:00:00Z"
});
```

---

## Stage 2

### Database Choice: PostgreSQL (Relational)

**Why PostgreSQL over NoSQL:**
- Notifications have a fixed, well-defined schema (studentId, type, message, isRead, createdAt)
- We need strong consistency: marking as "read" must be immediately reflected
- Complex queries: filter by `type`, `isRead`, sort by `createdAt` — SQL handles this naturally
- PostgreSQL supports JSONB for `metadata`, giving flexibility without abandoning relational benefits

---

### DB Schema

```sql
CREATE TABLE students (
  id          VARCHAR(50)  PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE notifications (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      VARCHAR(50)     NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  message         TEXT            NOT NULL,
  is_read         BOOLEAN         DEFAULT FALSE,
  metadata        JSONB,
  created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
```

---

### Problems as Data Volume Increases

| Problem | Cause | Solution |
|---|---|---|
| Slow reads | Full table scan on `student_id`, `is_read` | Add composite index on `(student_id, is_read, created_at DESC)` |
| Huge storage | 50k students × 100 notifs = 5M rows growing daily | Archive old notifications to cold storage (S3 / separate table) |
| Write bottleneck | Bulk notifications (50k at once) overload DB | Use message queue (BullMQ / RabbitMQ) to batch inserts |
| Connection exhaustion | Too many concurrent DB connections | Use connection pooling (PgBouncer) |
| Notification bloat | Unread notifications pile up | Auto-expire notifications older than 90 days |

---

### SQL Queries

**Fetch all unread notifications for a student (from Stage 1 API):**
```sql
SELECT id, type, message, created_at
FROM notifications
WHERE student_id = 'stu_1042'
  AND is_read = FALSE
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

**Count unread notifications (badge count):**
```sql
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE student_id = 'stu_1042'
  AND is_read = FALSE;
```

**Mark all notifications as read:**
```sql
UPDATE notifications
SET is_read = TRUE
WHERE student_id = 'stu_1042'
  AND is_read = FALSE;
```

**Fetch notifications by type:**
```sql
SELECT id, message, created_at
FROM notifications
WHERE student_id = 'stu_1042'
  AND type = 'Placement'
ORDER BY created_at DESC;
```

---

## Stage 3

### Reviewing the Slow Query

**Original query:**
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

---

### Is the Query Accurate?

Mostly accurate in intent, but has issues:
1. `SELECT *` fetches all columns including heavy `metadata JSONB` — wasteful if frontend only needs `id, type, message, createdAt`
2. Column names `studentID`, `isRead`, `createdAt` use camelCase — in PostgreSQL, unquoted identifiers are lowercased. Use `student_id`, `is_read`, `created_at`
3. No `LIMIT` clause — at 5M rows, this could return tens of thousands of rows

**Fixed query:**
```sql
SELECT id, type, message, created_at
FROM notifications
WHERE student_id = 1042
  AND is_read = FALSE
ORDER BY created_at DESC
LIMIT 50;
```

---

### Why Is It Slow?

With 50,000 students and 5,000,000 notifications:
- Average 100 notifications per student
- Without an index, PostgreSQL does a **full sequential scan** of all 5M rows
- `ORDER BY created_at DESC` requires an additional sort on filtered results
- Estimated cost: O(N) scan + O(K log K) sort where N = 5M, K = unread count

---

### Fix: Composite Index

```sql
CREATE INDEX idx_notifications_student_unread
ON notifications (student_id, is_read, created_at DESC);
```

**Why this works:**
- Filters by `student_id` (high selectivity, narrows to ~100 rows)
- Then filters `is_read = FALSE` within that set
- `created_at DESC` is already ordered in the index → no sort needed
- Query cost goes from O(5M) to O(log N + K) ≈ microseconds

---

### Should We Add Indexes on Every Column?

**No. This is bad advice.**

Adding indexes on every column causes:
1. **Write penalty** — every INSERT/UPDATE/DELETE must update all indexes. With 50k bulk inserts, this becomes extremely slow
2. **Storage bloat** — each index is essentially a copy of the column's data
3. **Planner confusion** — the query planner may pick inefficient index combinations
4. **Rarely used indexes** — most columns are never filtered on; their indexes are pure overhead

**Good rule:** Index only columns that appear in `WHERE`, `ORDER BY`, or `JOIN` clauses with high query frequency.

---

### Query: Students Who Got Placement Notifications in Last 7 Days

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days';
```

**With proper index:**
```sql
CREATE INDEX idx_notifications_type_created
ON notifications (type, created_at DESC);
```

This index makes the above query efficient even at 5M rows.

---

## Stage 4

### Problem: DB Overwhelmed on Every Page Load

Fetching notifications from DB on every page load for 50,000 concurrent students creates:
- Massive read load (50k DB queries per page render cycle)
- Increased latency
- Poor user experience

---

### Solutions and Tradeoffs

#### Solution 1: Redis Cache (Recommended)

**How it works:**
- On first load, fetch from DB and store result in Redis with key `notifications:<studentId>` and TTL = 2 minutes
- Subsequent loads read from Redis (in-memory, sub-millisecond)
- On new notification creation: invalidate that student's cache key

```javascript
async function getNotifications(studentId) {
  const cacheKey = `notifications:${studentId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const data = await db.query(
    `SELECT * FROM notifications WHERE student_id = $1 
     AND is_read = FALSE ORDER BY created_at DESC LIMIT 20`,
    [studentId]
  );
  
  await redis.setex(cacheKey, 120, JSON.stringify(data.rows)); // 2 min TTL
  return data.rows;
}
```

**Tradeoffs:**
- ✅ Dramatically reduces DB load (cache-hit ratio ~90%+)
- ✅ Sub-millisecond response time
- ⚠️ Stale data for up to TTL duration (acceptable for notifications)
- ⚠️ Additional infrastructure (Redis server)

---

#### Solution 2: Pagination + Lazy Loading

Instead of loading all notifications, load only the first page (20 items) and lazy-load more on scroll.

**Tradeoffs:**
- ✅ Reduces bytes transferred per request
- ✅ No extra infrastructure
- ⚠️ Still hits DB on every initial load for 50k students

---

#### Solution 3: WebSocket Push + Local State (Best UX)

- Load notifications once on login and store in frontend state
- Use WebSocket (Stage 1) to push new notifications in real-time
- No re-fetch on page load — frontend state is source of truth during session

**Tradeoffs:**
- ✅ Near-zero DB load after initial load
- ✅ Best user experience — instant updates
- ⚠️ More complex state management on frontend
- ⚠️ State lost on tab refresh (mitigate with localStorage + revalidation)

---

#### Recommended Combination:
1. **Redis cache** for fast reads (reduces 90% of DB load)
2. **WebSocket push** to invalidate cache and push to UI in real-time
3. **Pagination** to limit data per request

---

## Stage 5

### Identifying Shortcomings in `notify_all`

**Original pseudocode:**
```
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)   # calls Email API
        save_to_db(student_id, message)   # DB insert
        push_to_app(student_id, message)  # real-time push
```

**Problems:**

1. **Synchronous loop over 50,000 students** — this will take hours. If `send_email` takes 200ms each, 50k × 200ms = ~10,000 seconds
2. **No error handling / retry logic** — 200 emails failed midway; the loop just crashes or skips silently
3. **All-or-nothing failure** — if `save_to_db` fails for student 25,000, no rollback mechanism
4. **DB write per student** — 50k individual inserts; no bulk insert optimization
5. **Tight coupling** — email, DB, and push happen in the same synchronous call chain; one failure blocks others
6. **No partial recovery** — no way to resume from where it failed

---

### What Happened: 200 Emails Failed at Student 25,000

The remaining ~24,800 students never got their email. The DB may have records for all 50k (if save_to_db ran first), creating a state mismatch — DB says "notified" but email never sent.

---

### Redesigned Architecture: Message Queue (BullMQ / RabbitMQ)

```
HR clicks "Notify All"
         |
  API enqueues one job per student
  into a "notification" queue
         |
  Multiple Worker processes (e.g., 10 workers)
  consume jobs in parallel:
    - send_email()   → retry up to 3 times on failure
    - save_to_db()   → bulk batch insert every 100 records
    - push_to_app()  → fire-and-forget (non-critical)
         |
  Failed jobs → Dead Letter Queue (DLQ)
  → Alert admin, retry later
```

**Key improvements:**
- Workers process jobs in parallel → 10 workers × 50k jobs ≈ 10x faster
- Each job is retried independently on failure (exponential backoff)
- Failed jobs go to DLQ; not lost
- DB insert batched (100 at a time) instead of 50k individual queries
- Email, DB, and push are decoupled — email failure does NOT block DB save

---

### Should DB Save and Email Happen Atomically?

**No — they should NOT be in the same transaction.** Email is an external side effect; you cannot roll back a sent email. The correct pattern is:

1. **Save to DB first** (as the source of truth)
2. **Mark email_sent = false** initially
3. **Send email** → on success, update `email_sent = true`
4. **If email fails**: the DB record still exists; a retry job can resend the email using the saved record

This is the **Outbox Pattern** — DB write and external call are decoupled but eventually consistent.

---

## Stage 6

### Priority Inbox: Top-N Notifications

**Approach:**

Priority is determined by:
1. **Type weight**: Placement (3) > Result (2) > Event (1)
2. **Recency** (timestamp) as tiebreaker — newer notifications rank higher within the same type

**Algorithm: Min-Heap of size N**

To efficiently maintain top-N as new notifications arrive:
- Maintain a min-heap of size N
- For each new notification:
  - If heap size < N: push directly
  - Else if new notification's priority > heap minimum: pop minimum, push new
- Final heap contains top-N; extract and sort descending

**Time complexity:** O(M log N) where M = total notifications, N = top count  
**Space complexity:** O(N)

This is far more efficient than sorting all M notifications when M >> N.

---

### Priority Score Formula

```
priorityScore = typeWeight + (timestamp_ms / 1e12)
```

- `typeWeight` dominates for cross-type comparison
- `timestamp_ms / 1e12` normalizes timestamp to [0, ~2] range, acting as tiebreaker

---

### Handling New Incoming Notifications in Real-Time

As new notifications arrive via WebSocket:
1. Compute `priorityScore` of the new notification
2. If `score > min(topN heap)`: replace the minimum, re-sort display
3. UI updates dynamically without full re-fetch

This keeps the Priority Inbox O(log N) per new notification — highly efficient.

---

### API Used

```
GET http://4.224.186.213/evaluation-service/notifications
```

Response shape:
```json
{
  "notifications": [
    {
      "ID": "d146095a-...",
      "Type": "Result",
      "Message": "mid-sem",
      "Timestamp": "2026-04-22 17:51:30"
    }
  ]
}
```

The `priorityInbox.js` module fetches this data and returns the top-N using the Min-Heap approach described above.

---

*Submitted as part of Affordmed Campus Hiring Evaluation*
