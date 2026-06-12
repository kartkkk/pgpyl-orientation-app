# Attendance System — End-to-End Flow

## Architecture

```
Admin Phone                    Supabase                     Student Phone
============                   ========                     =============

[Attendance Page]              [PostgreSQL]                 [Scan Page]
      |                             |                            |
      |-- openSession() ----------->|                            |
      |   INSERT attendance_sessions|                            |
      |<-- session.id -------------|                            |
      |                             |                            |
      |== QR Rotation Loop ========================================
      |                             |                            |
      | generateQRToken()           |                            |
      |-- INSERT qr_tokens ------->|                            |
      |<-- { token, valid_until }--|                            |
      |                             |                            |
      |-- broadcast(new_token) --->| [Supabase Realtime]        |
      |                            |--- push to subscribers --->|
      |                            |                            |
      |   (repeats every 30s)      |                            |
      |============================|============================|
      |                            |                            |
      |                            |     [Student scans QR]     |
      |                            |                            |
      |                            |<-- mark-attendance --------|
      |                            |    (Edge Function)         |
      |                            |    1. Auth via GoTrue      |
      |                            |    2. Validate QR token    |
      |                            |    3. Check session open   |
      |                            |    4. INSERT attendance    |
      |                            |--- 200 OK --------------->|
      |                            |                            |
      | useSessionAttendance()     |                            |
      |-- SELECT attendance ------>|                            |
      |<-- records[] -------------|                            |
      |   (polls every 10s)        |                            |
      |                            |                            |
      |-- closeSession() -------->|                            |
      |   UPDATE is_open=false     |                            |
```

## Detailed Flow

### 1. Admin Opens Attendance Session

```
Admin clicks "Start Attendance"
    |
    v
openSession(eventId, userId)
    |
    v
INSERT INTO attendance_sessions (event_id, opened_by, is_open=true)
    |
    |-- DB Constraint: EXCLUDE ensures only ONE open session per event
    |-- RLS: is_admin() required
    |
    v
Fire-and-forget: writeAttendanceAudit("session_opened")
    |
    v
React Query invalidates → page re-renders with session
```

### 2. QR Token Rotation (Admin Device)

```
useQRRotation(sessionId, role="admin")
    |
    v
Subscribe to Realtime channel: "attendance:{sessionId}"
    |
    v
On SUBSCRIBED:
    |
    +-- Immediately: generateQRToken(sessionId)
    |       |
    |       v
    |   INSERT INTO qr_tokens (
    |       session_id,
    |       token = crypto.randomUUID(),
    |       valid_from = now,
    |       valid_until = now + 35s    ← 30s rotation + 5s buffer
    |   )
    |       |
    |       +-- RLS: is_admin() required for INSERT
    |       |
    |       v
    |   Broadcast to channel: { event: "new_token", payload: { token } }
    |       |
    |       v
    |   QRCodeSVG renders token as QR code
    |
    +-- Every 30s: repeat generateQRToken + broadcast
    |
    +-- On CHANNEL_ERROR / TIMED_OUT:
            Retry up to 3x with 2s delay
```

### 3. Student Scans QR Code

```
Student opens /scan → clicks "Open Scanner"
    |
    v
html5-qrcode camera @ 10fps, 250x250 box
    |
    v
QR decoded → decodedText (UUID token string)
    |
    +-- Guard: scannedRef prevents duplicate decode callbacks
    +-- Guard: pendingRef prevents concurrent network calls
    |
    v
markAttendance(token) via supabase.functions.invoke
    |
    v
POST /functions/v1/mark-attendance
    |
    v
Edge Function (verify_jwt=false, handles own auth):
    |
    +-- 1. CORS: OPTIONS → return early
    |
    +-- 2. Auth: GET /auth/v1/user with Bearer JWT
    |       |
    |       +-- No header → 401 "Unauthorized"
    |       +-- Invalid JWT → 401 "Invalid token"
    |       +-- Valid → extract userId
    |
    +-- 3. Parse body → extract { token }
    |       |
    |       +-- Missing → 400 "token is required"
    |
    +-- 4. Validate QR token:
    |       SELECT FROM qr_tokens WHERE token = ?
    |       |
    |       +-- Not found → 400 "Invalid QR code"
    |       +-- valid_until < now() → 400 "QR code has expired"
    |       +-- Valid → get session_id
    |
    +-- 5. Validate session:
    |       SELECT FROM attendance_sessions WHERE id = session_id
    |       |
    |       +-- Not found → 404 "Session not found"
    |       +-- is_open = false → 400 "Session is closed"
    |       +-- Open → continue
    |
    +-- 6. Insert attendance record:
            INSERT INTO attendance_records (
                session_id, profile_id, qr_token_id, scanned_at
            )
            |
            +-- UNIQUE(session_id, profile_id) violation (23505)
            |       → 200 { message, already_recorded: true }
            |
            +-- Success → 200 { message, event_title }
```

### 4. Client Handles Response

```
Edge function response
    |
    +-- 200 + already_recorded: true
    |       → Amber info card: "Already checked in"
    |       → Light haptic
    |
    +-- 200 (first time)
    |       → Green success card: "Attendance marked"
    |       → Success haptic
    |
    +-- 4xx error:
    |       → FunctionsHttpError → extract error.context body
    |       → getScanErrorBody() maps keywords:
    |           "already"  → "Attendance is already marked for this session."
    |           "expired"  → "This QR code is no longer active."
    |           "invalid"  → "This QR code is no longer active."
    |           "closed"   → "This QR code is no longer active."
    |           default    → "Use the latest QR code and try again."
    |       → Red error card with message
    |       → Error haptic
```

### 5. Admin Sees Live Attendance

```
useSessionAttendance(sessionId) — polls every 10s
    |
    v
SELECT *, profile:profiles!profile_id(*, section:sections(*))
FROM attendance_records
WHERE session_id = ?
ORDER BY scanned_at ASC
    |
    +-- RLS: is_admin() allows SELECT on all records
    |
    v
AttendanceList renders: avatar initials, name, time ago, section badge
```

### 6. Admin Exports Attendance

```
exportAttendanceReport(eventId)
    |
    v
1. Fetch event + assignments → determine audience scope
   |   visibility = "all"        → all active students
   |   visibility = "section"    → students in assigned sections
   |   visibility = "individual" → specifically assigned students
   |
2. Fetch latest session for event
   |
3. Fetch attendance_records for that session
   |
4. Build map: profile_id → scanned_at
   |
5. For each student in audience:
   |   In map → Status: "Present", Scanned At: timestamp
   |   Not in map → Status: "Absent", Scanned At: "—"
   |
6. CSV via papaparse → browser download
```

### 7. Admin Closes Session

```
Admin clicks "Close Session" → Confirm dialog → Confirm
    |
    v
closeSession(sessionId, userId)
    |
    v
UPDATE attendance_sessions SET is_open=false, closed_at=now()
    |
    +-- RLS: is_admin() required
    |
    v
Fire-and-forget: broadcast "session_closed" on separate channel
Fire-and-forget: writeAttendanceAudit("session_closed")
    |
    v
React Query invalidates → page re-renders → QR rotation stops
```

## Database Constraints

| Constraint | Table | What it prevents |
|---|---|---|
| `EXCLUDE (event_id WITH =) WHERE (is_open)` | attendance_sessions | Two open sessions for same event |
| `UNIQUE (session_id, profile_id)` | attendance_records | Student scanning twice in same session |
| `CHECK (valid_until > valid_from)` | qr_tokens | Invalid token validity windows |
| `CHECK (closed_at IS NULL OR closed_at > opened_at)` | attendance_sessions | Closing before opening |
| `FK profile_id → profiles(id)` | attendance_records | Non-existent student |
| `FK qr_token_id → qr_tokens(id) ON DELETE RESTRICT` | attendance_records | Deleting tokens still referenced |
| `FK session_id → attendance_sessions(id) ON DELETE CASCADE` | attendance_records | Cascades on session delete |

## RLS Policy Summary

| Table | Operation | Who | Condition |
|---|---|---|---|
| attendance_sessions | ALL | Admin | `is_admin()` |
| attendance_sessions | SELECT | Student | Event is visible to them |
| qr_tokens | SELECT | Admin | `is_admin()` |
| qr_tokens | INSERT | Admin | `is_admin()` |
| attendance_records | ALL | Admin | `is_admin()` |
| attendance_records | INSERT | Student | Own profile + valid token + open session |
| attendance_records | SELECT | Student | Own records only |

## Edge Cases Handled

| Scenario | Where | How |
|---|---|---|
| Student scans twice (same session) | DB UNIQUE + edge fn 23505 handler | Returns "already recorded" with amber UI |
| Student scans expired QR | Edge fn: `valid_until < now()` | Returns "QR code has expired" |
| Student scans after session closed | Edge fn: `is_open = false` | Returns "Session is closed" |
| Student scans random/invalid QR | Edge fn: token not found | Returns "Invalid QR code" |
| Admin opens 2nd session for same event | DB EXCLUDE constraint | INSERT fails |
| html5-qrcode fires callback twice | `scannedRef` in scanner + `pendingRef` in page | Second call blocked |
| Phone sleeps during QR rotation | Realtime reconnect + retry (3x) | Auto-recovers on wake |
| Admin JWT expires during session | `autoRefreshToken: true` in SSR client | Silent refresh |
| Network timeout on attendance poll | SW uses NetworkOnly for /rest/ | No stale cache served |

## Performance Notes

| Area | Current | Optimization opportunity |
|---|---|---|
| Attendance list polling | 10s interval via React Query | Could use Realtime subscription for instant updates (like QR broadcast) |
| QR token table growth | New row every 30s per session | `rotate-qr-token` cron prunes old tokens (keeps last 3) |
| Export audience query | Fetches ALL students for visibility="all" | Paginate for very large cohorts |
| PostgREST join | `profiles!profile_id(*, section:sections(*))` | Consider selecting only needed columns |
| Edge function cold start | ~100-150ms per invocation | Acceptable for scan latency |
