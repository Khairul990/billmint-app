# BillQyro — Owner Control Room Architecture

## Phase 12: Control Room Preparation

### Overview
Architecture preparation for the Owner Control Room — a centralized admin dashboard for monitoring, managing, and analyzing the entire BillQyro platform.

### Architecture Components

#### 1. User Monitoring Service
- Real-time user activity tracking via Firestore listeners
- Session management with auth state persistence
- Usage metrics collection (invoices created, logins, features used)
- Geographic distribution tracking via IP-based location

#### 2. Support Requests System
- Ticket management with priority levels
- Chat-based support interface
- Email notification integration
- Ticket status workflow (Open → In Progress → Resolved → Closed)
- Attachment support for screenshots/files

#### 3. Feature Requests Pipeline
- User-submitted feature suggestions
- Voting/upvoting system
- Status tracking (Under Review → Planned → In Development → Shipped)
- Changelog integration

#### 4. Error Monitoring
- Client-side error capture via window.onerror
- API error logging to Firestore
- Error severity classification (Info, Warning, Critical)
- Stack trace collection and deduplication
- Error trend analysis

#### 5. Health Monitoring
- Firebase connection status
- Firestore read/write latency
- Storage quota monitoring
- Sync engine health checks
- PWA service worker status
- Real-time uptime dashboard

#### 6. Control Room Connection
- Secure WebSocket connection for real-time updates
- Admin authentication via Firebase Custom Claims
- Role-based access control (Owner, Admin, Support, Viewer)
- Event-driven data flow using Firestore onSnapshot

### Data Flow
```
User Action → Firestore → Cloud Functions → Control Room Dashboard
                    ↓
            Admin Notification
```

### Security
- All admin routes protected by Firebase Custom Claims
- Audit logging for all admin actions
- Rate limiting on admin API endpoints
- IP whitelist for sensitive operations

### File Structure
```
src/
  services/
    monitoringService.js    — User activity & error monitoring
    healthCheckService.js   — System health checks
    supportService.js       — Support ticket management
  pages/admin/
    ControlRoom.jsx         — Main control room dashboard
    UserMonitor.jsx         — User activity monitoring
    SupportManager.jsx      — Support ticket management
    FeatureRequests.jsx     — Feature request management
    SystemHealth.jsx        — System health dashboard
    ErrorLogs.jsx           — Error monitoring & logs
```
