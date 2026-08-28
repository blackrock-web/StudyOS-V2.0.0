# StudyOS Desktop

> A 100% offline, local-first Electron + React + TypeScript study and exam-preparation operating system designed for serious learners. Zero cloud dependencies, zero external AI APIs, zero tracking telemetry.

StudyOS Desktop combines exam planning, dynamic syllabus tracking, lecture management, tasks, focus sessions, Pomodoro, SRS flashcards, notes, PDF reading, practice management, analytics, and **offline local LLM inference (GGUF / llama.cpp)** into a single self-contained desktop operating system.

All student data, notes, flashcards, and models reside strictly on your local machine.

---

## ✨ Key Capabilities & Systems

### 🤖 1. Local AI & GGUF Model Management
StudyOS includes a complete offline AI inference engine running on local CPU/GPU:
- **Embedded Local Models**: Supports GGUF models (SmolLM2 135M, Qwen 2.5 0.5B, TinyLlama 1.1B, Phi-3.5 Mini 3.8B).
- **One-Click Model Switching**: Switch active inference models instantly in the **Settings Hub → Local AI & Models Hub**; previous model memory is automatically released.
- **PIN-Authorized Model Downloads**: Download vetted GGUF weights directly from Hugging Face with real-time download speed/progress meters and SHA-256 checksum validation.
- **Automatic Network Auto-Lock**: The network is unlocked only during the active download and is instantly re-locked upon completion.
- **Custom Model Import**: Register custom local `.gguf` or `.onnx` model files directly into your workspace.
- **100% Offline AI Study Tools**: Generates study notes, flashcards, multiple-choice quizzes, mind maps, formula sheets, and single-day focus plans with zero network calls.

### 🎯 2. Subject-Based Focus Planning & Dynamic Syllabus Engine
- **Dynamic Subject Switching**: Switch between subjects (Algorithms, Operating Systems, DBMS, Computer Networks, Theory of Computation, Discrete Math, etc.) with instant, live synchronization.
- **Zero Stale Data**: Dynamically reads from your syllabus registry and lecture planner to display exact topics, completion percentage, and confidence scores.
- **AI Single Day Focus Engine**:
  - Automatically identifies high-priority topics and explains why to focus on them today.
  - Generates step-by-step actionable checklists with estimated times.
  - Formulates chapter-specific core revision concepts and formulas.
  - Recommends target Previous Year Questions (PYQs) and Daily Practice Problems (DPPs).
  - One-click launch of continuous focus timer sessions.

### 📚 3. Academic Planning & Exam Management
- **Multi-Exam Management**: Support for GATE CS & DA, UPSC, Engineering Semesters, and Custom Competitive Exams.
- **Lecture Planner Queue**: Track lecture watch status, duration, DPPs, mistakes, revision count, and confidence.
- **Spaced Repetition (SRS)**: Built-in active recall and flashcard review intervals.
- **Pomodoro Break Kiosk & Brain Games**: Offline mental refresh games (2048, Memory Match, Sudoku) during study breaks.
- **Isolated Study Browser**: Sandboxed local browser with bookmarking and capture tools.

---

## 🔒 Security & Network Isolation Invariants

StudyOS enforces strict network denial policies:
1. **Network Locked by Default**: All outgoing HTTP/HTTPS/WebSocket sockets are closed.
2. **Zero Cloud Inference**: No requests to OpenAI, Google Gemini, Anthropic, or remote AI servers.
3. **PIN-Controlled Gateway**: Network access requires an explicit user PIN and automatically relocks when the task finishes.
4. **Content-Security-Policy (CSP)**: Strict `script-src 'self'` and `connect-src 'self'` headers.
5. **Nuclear Eradication (Danger Zone)**: Comprehensive, multi-stage purge scripts that completely remove binaries, databases, models, and caches.

---

## 💻 Installation & Setup Guide

### System Requirements
- **Node.js**: v18.0.0 or higher
- **RAM**: Minimum 4 GB RAM (8 GB+ recommended for 3B+ parameter GGUF models)
- **Disk Space**: ~500 MB for base app + space for downloaded GGUF models (80 MB – 2.2 GB)
- **Supported Platforms**: Linux (Ubuntu, Debian, Fedora, Arch), Windows 10/11 (64-bit), macOS (Intel & Apple Silicon)

---

### Method A: Development & Web Execution

```bash
# 1. Clone the repository
git clone https://github.com/studyos/studyos-desktop.git
cd studyos-desktop

# 2. Install dependencies
npm install

# 3. Launch development server (Runs on port 3000)
npm run dev

# 4. Build production bundle
npm run build

# 5. Run automated security & air-gap test suite
npm run test:security
```

---

### Method B: Linux Desktop Installation

StudyOS provides an automated installation script (`install.sh`):

```bash
# Make installer executable
chmod +x install.sh

# Run installation (Installs to ~/.local/share/studyos and creates desktop launcher)
./install.sh
```

**Manual Linux Setup:**
1. Download the latest `StudyOS-Linux-x86_64.AppImage` or `.deb` from official releases.
2. Grant execution permissions: `chmod +x StudyOS-Linux-x86_64.AppImage`
3. Launch StudyOS: `./StudyOS-Linux-x86_64.AppImage`

**Complete Linux Uninstallation / Purge:**
```bash
chmod +x destroy.sh
./destroy.sh --force
```

---

### Method C: Windows 10 / 11 Installation (PowerShell)

StudyOS provides an automated PowerShell installation script (`install.ps1`):

```powershell
# 1. Open PowerShell as Administrator
# 2. Run the automated installer
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install.ps1
```

**Complete Windows Uninstallation / Purge:**
```powershell
.\destroy.ps1 -Force
```

---

### Method D: macOS Installation

1. Download the latest `StudyOS-macOS-Universal.dmg` from official releases.
2. Open the `.dmg` file and drag `StudyOS` to your `/Applications` directory.
3. If prompted by macOS Gatekeeper: Go to **System Settings → Privacy & Security** and click **Open Anyway**.

---

## 🔄 Updating StudyOS Desktop

StudyOS supports verified application updates:

1. **Check for Updates**:
   - Open **Settings Hub → Version Management**.
   - Click **Check for Updates** (Requires Network PIN).
2. **Download & Verify**:
   - The update package is downloaded from official GitHub Releases.
   - The SHA-256 binary checksum is automatically validated before installation.
   - Network access is immediately locked upon update verification.
3. **Restart & Apply**:
   - Click **Restart to Apply Update** to boot into the updated version with all local SQLite data preserved.

---

## 🛠️ Verification & Test Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite development server on port 3000 |
| `npm run build` | Builds production client and bundled server |
| `npm run test:security` | Runs all 23 network isolation & zero-cloud compliance tests |
| `npm run lint` | Runs TypeScript & ESLint validation |

---

## 📄 License & Copyright

**StudyOS Desktop is proprietary software.**

Copyright © 2026 StudyOS Project. All rights reserved.

The source code is publicly accessible for development transparency, auditability, and official distribution. See [LICENSE.md](./LICENSE.md) for full terms.
