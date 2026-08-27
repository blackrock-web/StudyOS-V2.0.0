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

### 🔒 Security, Zero Telemetry & Network Isolation

StudyOS Desktop is strictly architected under an **Offline-First and Network-Denied by Default** security model:

1. **Zero Background Telemetry**: Zero analytics trackers, zero telemetry beacons, zero crash pings, and zero remote configuration calls.
2. **Hardware & Socket Network Lock**: Network access is blocked by default. The only two operations permitted to initiate external connections are:
   - **Authorized Application Updates**: Verified against official GitHub Releases with SHA-256 binary validation and signature checks.
   - **Authorized Local AI Model Downloads**: Downloading open-weight GGUF / ONNX models directly to the user's machine with cryptographic hash enforcement.
3. **PIN-Authorized Access Gateway**: Any network operation requires explicit administrative PIN unlock, which automatically locks the network interface upon operation completion or timeout.
4. **Offline Local AI Execution**: Run quantized local models (SmolLM, Qwen 2.5, Phi-3.5) with zero internet access, zero API keys, and complete data privacy.
5. **Nuclear Application Destruction**: A complete, multi-step eradication engine that securely removes all binaries, SQLite databases, cached files, GGUF models, shortcuts, and configurations across Linux and Windows.

---

### 🚀 Cross-Platform Installation & Destruction Scripts

StudyOS provides native scripts for automated setup, sandboxing, and complete application removal:

#### Linux (`install.sh` & `destroy.sh`)
```bash
# Automated installation to ~/.local/share/studyos
chmod +x install.sh && ./install.sh

# Complete obliteration and purge
chmod +x destroy.sh && ./destroy.sh --force
```

#### Windows PowerShell (`install.ps1` & `destroy.ps1`)
```powershell
# Automated installation to %LOCALAPPDATA%\StudyOS
.\install.ps1

# Complete nuclear destruction
.\destroy.ps1 -Force
```

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
