# Preproute — Test Management Application
 
A 5-page test management web application built as part of the Preproute Frontend Developer task. Allows admins to create tests, add MCQ questions, and publish them — with full API integration.
 
---
 
## Tech Stack
 
| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS v3 |
| State Management | Zustand |
| API Client | Axios |
| Forms & Validation | React Hook Form |
| Select Inputs | React Select |
| Routing | React Router DOM v6 |
| Notifications | React Hot Toast |
| Icons | Lucide React |
 
---
 
## Application Flow
 
### Page 1 — Login
- userId + password form with validation
- JWT token stored in `localStorage` via Zustand auth store
- Auto-redirect to dashboard if already authenticated
- Handles Railway staging cold-start with a DB warmup step before submitting credentials
### Page 2 — Dashboard
- Fetches and displays all tests in a sortable table
- Shows test name, subject, topics, status badge, and created date
- **Edit** → goes to Create/Edit page pre-filled with test data
- **Preview** → goes directly to Preview & Publish page
- **Delete** → soft-deletes by updating status
- **Add Questions** → jumps to the questions page for that test
- Search/filter tests by name or subject
- Stats bar showing total / published / draft counts
### Page 3 — Create / Edit Test
- Cascading dropdowns: Subject → Topics (multi) → Sub-topics (multi)
  - Topics fetched from `/topics/subject/:id` on subject change
  - Sub-topics fetched from `/sub-topics/multi-topics` on topic change
  - Guards prevent API calls with empty/null IDs
- Marking scheme fields: correct marks, wrong marks, unattempted marks
- Test config: total time, total marks, total questions
- **Save as Draft** — saves without navigating
- **Next: Add Questions** — saves and advances to Page 4
- Same page handles both create (`POST /tests`) and edit (`PUT /tests/:id`)
### Page 4 — Add Questions
- Inline form to add MCQ questions one at a time
- Fields: question text, 4 options, correct option, difficulty, topic, sub-topic, explanation, media URL
- Added questions shown as a live list below the form with edit/delete per question
- Edit existing question loads it back into the form
- Questions stored in Zustand (`testStore`) until submitted
- **Save & Preview** — bulk submits all questions via `POST /questions/bulk` then navigates to Page 5
### Page 5 — Preview & Publish
- Full test overview: name, subject, duration, marks, difficulty, marking scheme
- All questions rendered with colour-coded correct option (green) and other options (muted)
- Explanation shown if present
- **Edit Details** → back to Page 3
- **Edit Questions** → back to Page 4
- **Publish Test** → `PUT /tests/:id` with `{ status: "live" }`
- Animated success state on publish, then auto-redirects to dashboard
---
 
## Project Structure
 
```
src/
├── api/
│   ├── client.ts          # Axios instance — attaches Bearer token, handles 401 redirect
│   └── endpoints.ts       # All 12 API functions (login, subjects, topics, tests, questions)
├── store/
│   ├── authStore.ts       # Zustand — token + user, persisted in localStorage
│   └── testStore.ts       # Zustand — current test + questions list for multi-step flow
├── types/
│   └── index.ts           # TypeScript interfaces for all entities
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       # Sidebar nav + user info + logout
│   │   └── ProtectedRoute.tsx  # Redirects to /login if unauthenticated
│   └── ui/
│       └── index.tsx           # Spinner, EmptyState, StatusBadge, StepIndicator, PageHeader, Field
└── pages/
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── CreateTestPage.tsx
    ├── AddQuestionsPage.tsx
    └── PreviewPublishPage.tsx
```
 
---
 
## State Management Decisions
 
**Zustand over Redux** — the app has two isolated slices of state (auth and test creation flow). Zustand handles both without boilerplate and keeps the stores readable in under 30 lines each.
 
**Multi-step form state** — questions added on Page 4 are held in `testStore.questions[]` and only sent to the API when the user clicks "Save & Preview". This avoids partial saves and keeps the bulk create call atomic.
 
**Auth persistence** — token and user are written to `localStorage` on login and read back on page load, so refresh doesn't log the user out.
 
---
 
## API Notes
 
Base URL: `https://admin-moderator-backend-staging.up.railway.app/api`
 
All endpoints except `/auth/login` require:
```
Authorization: Bearer <token>
```
 
**Known staging behaviour:** The Railway PostgreSQL database enters a sleep state after inactivity. The login page sends a lightweight warmup request (intentionally invalid payload → instant 400 from validation layer) before submitting real credentials, which wakes the DB connection pool. This reduces cold-start login time from 30s+ to ~3–5 seconds.
 
**Valid enum values** (confirmed from live DB):
- `type`: `mock` | `chapterwise` | `pyq`
- `difficulty`: `easy` | `medium` | `hard`
- `status`: `draft` | `live` | `unpublished` | `scheduled` | `expired`
---
 
## Local Setup
 
```bash
# 1. Clone and install
git clone <your-repo-url>
cd preproute
npm install
 
# 2. Start dev server
npm start
# Opens at http://localhost:3000
 
# 3. Build for production
npm run build
```
 
No `.env` file needed — the API base URL is hardcoded to the provided staging server.
 
**Test credentials:**
```
userId:   vedant-admin
password: vedant123
```
 
---