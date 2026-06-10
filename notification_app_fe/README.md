# CampusNotify - Frontend (notification_app_fe)

React + Material UI campus notification platform.

## Run

```bash
npm install
npm start   # http://localhost:3000
```

## Features

**Stage 1** — Priority Inbox: Min-Heap top-N, O(M log N), adjustable slider, type filter  
**Stage 2** — Full UI: Priority page + All Notifications page, read/unread distinction, responsive

## Structure

```
src/
├── utils/priorityInbox.js     # Min-Heap algorithm (Stage 1)
├── utils/logger.js            # Structured JSON logger
├── services/notificationService.js
├── hooks/useNotifications.js
├── pages/PriorityInboxPage.js
├── pages/AllNotificationsPage.js
└── components/ (Header, NotificationCard, MobileNav)
```
