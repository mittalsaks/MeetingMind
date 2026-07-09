<div align="center">

<img src="./app/icon.png" alt="MeetingMind Logo" width="140"/>

# MeetingMind

### AI-Powered Mentor Accountability & Meeting Intelligence Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-meetingmind--frontend--45d3.onrender.com-6366F1?style=for-the-badge)](https://meetingmind-frontend-45d3.onrender.com)

<br/>

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000?style=flat-square&logo=next.js)
![Node](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome)
![AI](https://img.shields.io/badge/AI-Commitment%20Extraction-8B5CF6?style=flat-square&logo=OpenAI)

</div>

---

## 🚨 The Problem

A mentor managing 100–300 students across weekly sync calls ends up spending more time on **operational bookkeeping** than actual mentoring:

- Manually transcribing who said what, in an Excel sheet, live, during the call
- Guessing whether "joined the call" actually means "gave a real update"
- Remembering last week's commitments to check them against this week's
- Chasing daily updates, leave requests, and reminders by hand

None of this scales past a handful of people — and it's exactly the kind of repetitive tracking work that shouldn't need a human doing it in real time.

**MeetingMind removes the bookkeeping so mentors can focus on mentoring.**

---

## 💡 What MeetingMind Does

### Core Innovation: Live Meeting → Structured Accountability, Automatically

```mermaid
flowchart TD
    A["🗣️ Student speaks during Google Meet"] --> B["🎧 Chrome Extension captures<br/>live captions — speaker + text"]
    B --> C["📡 Transcript streamed<br/>to backend in real time"]
    C --> D["🤖 AI extracts commitment<br/>completed work · next task · deadline"]
    D --> E["📋 Task auto-created<br/>assigned to the right student"]
    D --> F["✅ Attendance marked<br/>only if they actually spoke"]
    E --> G["📊 Mentor dashboard updates instantly<br/>zero manual note-taking"]
    F --> G

    style A fill:#1a1a2e,stroke:#6366F1,color:#fff,stroke-width:2px
    style B fill:#1a1a2e,stroke:#6366F1,color:#fff,stroke-width:2px
    style C fill:#1a1a2e,stroke:#8B5CF6,color:#fff,stroke-width:2px
    style D fill:#2d1b4e,stroke:#A78BFA,color:#fff,stroke-width:3px
    style E fill:#0f2e23,stroke:#22C55E,color:#fff,stroke-width:2px
    style F fill:#0f2e23,stroke:#22C55E,color:#fff,stroke-width:2px
    style G fill:#1a1a2e,stroke:#6366F1,color:#fff,stroke-width:3px
```

Attendance in MeetingMind isn't "did you join the call" — it's **"did you actually give a spoken update."** Silent attendees are marked absent, exactly like a real mentor would judge it.

---

## 🧩 Features

| Feature | Description |
|---|---|
| 🎙 **Live Meet Transcript Capture** | Chrome extension listens to Google Meet captions per-speaker, in real time, with a Speech Recognition fallback |
| 🤖 **AI Commitment Extraction** | Turns raw spoken updates into structured "completed work" + "next commitment" + deadline |
| ✅ **Real Attendance Logic** | Marks presence only on a genuine spoken update — not just joining the call |
| 📋 **Auto-Generated Tasks** | Every commitment becomes a trackable task, assigned to the right student automatically |
| 🔁 **Maker–Checker Task Verification** | Students mark work done → mentor verifies → prevents false self-reporting |
| ⏰ **Automated Daily Reminders** | Nudges students who haven't logged a daily update by a set time |
| 📅 **Meeting Scheduling & Confirmation** | Mentor confirms weekly syncs, reminders go out automatically |
| 🌴 **Structured Leave Requests** | Replaces ad-hoc WhatsApp messages with a trackable approve/reject workflow |
| 🏢 **Workspace Isolation** | Multiple mentors, multiple cohorts, fully separated — students only see their own workspace |
| 🔐 **Role-Based Access Control** | Mentors see the full team; students see only their own tasks, attendance, and history |
| 📊 **Engagement Analytics** | Heatmaps and per-student trends to catch disengagement before it becomes a pattern |
| 🗂 **Permanent Meeting Archive** | Every transcript, commitment, and verification stored for full historical review |

---

## 🏗 System Architecture

```mermaid
flowchart TB
    subgraph EXT["🎥 Chrome Extension — Google Meet"]
        CAP[Caption Observer]
        SR[Speech Recognition Fallback]
        CAP --> BUF[Live Transcript Buffer]
        SR --> BUF
    end

    subgraph FE["🖥️ Frontend — Next.js"]
        DASH[Mentor Dashboard]
        STU[Student Dashboard]
        MEET[Weekly Meetings]
        TASK[Tasks & Verification]
        ATT[Attendance Heatmap]
    end

    subgraph BE["⚙️ Backend — Node.js + Express"]
        API[REST API Layer]
        AI[AI Commitment Extractor]
        AUTH[Auth + Role Middleware]
        SCHED[Reminder Scheduler]
    end

    subgraph EXTSVC["☁️ External Services"]
        MONGO[(MongoDB Atlas)]
    end

    BUF -->|transcript chunk| API
    API --> AI
    AI -->|tasks + attendance| MONGO
    API <--> AUTH
    SCHED -->|daily reminders| MONGO
    DASH <--> API
    STU <--> API
    MEET <--> API
    TASK <--> API
    ATT <--> API

    style EXT fill:#0d1117,stroke:#4285F4,color:#ffffff
    style FE fill:#0d1117,stroke:#6366F1,color:#ffffff
    style BE fill:#0d1117,stroke:#8B5CF6,color:#ffffff
    style EXTSVC fill:#0d1117,stroke:#47A248,color:#ffffff
```

### Live Transcript → Task Pipeline

```mermaid
sequenceDiagram
    participant Stu as Student
    participant Ext as Chrome Extension
    participant BE as Backend
    participant AI as AI Extractor
    participant DB as MongoDB

    Stu->>Ext: Speaks update in Google Meet
    Ext->>Ext: Capture caption (speaker + text)
    Ext->>BE: POST /meetings/:id/process-transcript-chunk
    BE->>AI: Extract commitment from transcript
    AI-->>BE: completed work, next commitment, deadline
    BE->>DB: Create task + mark attendance
    DB-->>BE: Confirmation
    BE-->>Ext: { tasksCreated, attendanceMarked }
    Note over BE,DB: Mentor dashboard reflects the update instantly
```

---

## 🔐 Access Control Design

MeetingMind separates mentor and student views at both the **UI and API level** — not just hidden menu items:

- **Mentors / Admins** — full workspace visibility: all students' tasks, attendance, leave requests, meeting scheduling, transcript processing, team management, and analytics
- **Students** — scoped strictly to their own data: their tasks, their attendance record, their leave requests, their meeting history — no visibility into other students or workspace-wide controls
- Role checks are enforced in the sidebar (so students never see admin-only navigation), the page level (direct URL access to an admin route redirects to the dashboard), and are designed to be enforced again at the API layer so scoping can't be bypassed by a direct request

---

## 🛠 Tech Stack

**Backend**
- Node.js + Express
- MongoDB Atlas — persistence
- JWT-based auth with Google OAuth
- AI-powered transcript-to-commitment extraction

**Frontend**
- Next.js (App Router)
- Tailwind CSS
- Framer Motion for UI transitions

**Chrome Extension**
- Manifest V3 service worker
- MutationObserver-based live caption capture
- Web Speech API fallback for redundancy

**Deployment**
- Backend → Render
- Frontend → Render
- Database → MongoDB Atlas

---

## 🌐 Live Demo

🔗 **[meetingmind-frontend-45d3.onrender.com](https://meetingmind-frontend-45d3.onrender.com)**

---

## 💻 Local Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
node server.js
```

### Frontend
```bash
cd app
npm install
npm run dev
```

### Chrome Extension
```bash
1. Open chrome://extensions
2. Enable Developer Mode
3. Click "Load unpacked" and select the /extension folder
4. Join a Google Meet call and click "Start Listening"
```

---

<div align="center">

*Turning spoken commitments into tracked accountability — automatically.*

</div>