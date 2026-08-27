# StudyOS Desktop

> A local-first Electron + React + TypeScript study and exam-preparation operating system designed for serious learners.

StudyOS Desktop combines exam planning, syllabus tracking, lecture management, tasks, focus sessions, Pomodoro, SRS flashcards, notes, PDF reading and annotation, practice management, analytics, and AI-assisted study tools into a single desktop application.

The application is designed to remain **local-first and offline-capable**. In the current version, user data and study data are stored locally on the user's machine. Internet access is used only for application updates through public GitHub Releases.

---

## ✨ Core Features

### 📚 Study & Exam Management

- Multi-exam study management
- Syllabus management
- Subject and topic tracking
- Topic weightage
- Difficulty tracking
- Confidence tracking
- Target hours vs completed hours
- Exam-specific planning
- Study roadmap

### 🗓️ Planning

- Planner Hub
- Daily study planning
- Roadmap Tree
- Routine scheduling
- Task templates
- AI-assisted schedule planning
- Unified syllabus coverage

### 🎥 Lecture Tracking

Track lecture-level progress including:

- Watch progress
- Watch speed
- DPP completion
- Weekly tests
- Mistakes
- Revision count
- Confidence
- Lecture completion

### ✅ Task Management

Supported task types include:

- Lecture
- Revision
- Practice
- Mock Test
- DPP
- Assignment
- Pomodoro
- Custom Tasks

Tasks can support:

- Recurrence
- SRS intervals
- Pinning
- Color tags
- Linked focus sessions

### 🎯 Focus & Productivity

- Single-Subject Focus Mode
- Global Focus Timer
- Pomodoro Timer
- Focus Sessions
- Study Streaks
- Study Flame
- Focus Leaderboard
- Brain Game / Break System
- Victory Celebrations

### 📖 PDF Knowledge Engine

- PDF reader
- Text selection
- Annotations
- Bookmarks
- PDF search
- Thumbnails
- Selection toolbar
- PDF workspace
- Study-guide export

The PDF architecture is designed to eventually integrate **RAGBook Studio** for citation-aware "Chat with your book" functionality.

### 📝 Notes

- Long-form notes
- Scratchpad
- Quick capture
- Structured study notes

### 🧠 Spaced Repetition

Built-in SRS flashcard system for long-term retention and revision.

### 📝 Practice

- Question importing
- Practice workspace
- Test generation
- Test-taking sessions
- Test results
- Mistake review

### 🤖 AI-Assisted Learning

StudyOS uses an AI provider abstraction so different AI providers can be used without tightly coupling the application to one vendor.

Potential providers include:

- OpenAI
- Google Gemini
- Anthropic
- Ollama
- Local AI models

AI can assist with:

- Notes
- Flashcards
- Quizzes
- Mind maps
- Study resources
- Study planning

### 📊 Analytics

- Study overview
- Study statistics
- Performance analytics
- Syllabus coverage
- Focus statistics
- Reports
- Study history

### 👨‍👩‍👧 Parent View

The current application includes a local Parent role designed to provide a read-only view of student progress.

Future versions can extend this to cross-device parent/student accounts through a backend.

---
### License & Copyright

**StudyOS Desktop is proprietary software.**

Copyright © 2026 StudyOS Project. All rights reserved.

The source code is publicly available for development transparency,
documentation, feedback, and official release distribution.

Public availability does not mean that StudyOS is open-source software.
No permission is granted to copy, modify, redistribute, repackage,
sublicense, sell, or create derivative works from the proprietary
portions of StudyOS unless expressly permitted by the license.

See [LICENSE.md](./LICENSE.md) for the complete license.

# 🏗️ Architecture

StudyOS is intentionally designed around a **local-first architecture**.
```text
┌──────────────────────────────────────────────────────────┐
│                    StudyOS Desktop                       │
│                                                          │
│              Electron + React + TypeScript               │
│                                                          │
│  ┌────────────────┐       ┌──────────────────────────┐  │
│  │ React Renderer │◄─────►│ Secure Preload / IPC     │  │
│  └────────────────┘       └────────────┬─────────────┘  │
│                                       │                 │
│                         ┌─────────────▼──────────────┐  │
│                         │       Service Layer        │  │
│                         │                            │  │
│                         │ AuthProvider               │  │
│                         │ StorageProvider            │  │
│                         │ SyncProvider               │  │
│                         │ AIProvider                 │  │
│                         │ UpdateProvider             │  │
│                         │ RAGProvider (future)       │  │
│                         └─────────────┬──────────────┘  │
│                                       │                 │
│                     ┌─────────────────┼──────────────┐  │
│                     │                 │              │  │
│                     ▼                 ▼              ▼  │
│                Local Data        Local AI        Updates│
│                     │                                │  │
│                     ▼                                │  │
│               User's Machine                         │  │
└──────────────────────────────────────────────────────┼──┘
                                                       │
                                                       │ HTTPS
                                                       ▼
                                              Public GitHub Releases
