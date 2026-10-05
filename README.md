# DevTwin 🌌
### AI Digital Twin for your Codebase

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org)
[![Vite](https://img.shields.io/badge/Vite-v8.3-646CFF.svg)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini%20%7C%20OpenAI%20%7C%20Zero--Key%20Offline-orange.svg)]()
[![Local-First](https://img.shields.io/badge/Execution-100%25%20Local%20%26%20Private-emerald.svg)]()

> **DevTwin** is an in-memory AI Digital Twin of your software codebase. It indexes repository topology, models multi-language dependency graphs, diagnoses defect root causes, predicts change impact blast radius, detects architectural drift, and verifies fixes with automated tests — all running local-first with zero cloud dependencies.

---

## ⚡ The 10-Second Judge Experience

DevTwin is designed for developer velocity. In less than 10 seconds, any engineer or hackathon judge can answer the 5 critical software engineering questions:

```
1. WHAT PROJECT IS LOADED?   ──►  Shop-API / Polyglot microservices (Files, Components, APIs, Tests)
2. IS THERE A PROBLEM?       ──►  500 Internal Server Error in /api/login endpoint
3. WHAT IS THE ROOT CAUSE?   ──►  🔴 Database query uses wrong key in UserService (user_service.py:42)
4. WHAT SHOULD I DO?         ──►  One-click unified diff patch provided (replace 'user_id' with 'id')
5. IS THE FIX VERIFIED?      ──►  🟢 4/4 test suites passing (Authentication, User, API, Integration)
```

---

## 🖥️ Grand Finale UI Architecture

DevTwin features a **cosmic developer-tool interface** inspired by modern high-density environments like Linear and Cursor:

```
┌───────┬────────────────────────────────────────────────────────────────────────────────────────┐
│ [ D ] │ DEVTWIN · SHOP-API                                                                    │
│       │ Why is login failing?                              [Debug] [Impact] [Verify] ● Local  │
│  [≡]  │ POST /api/login returned 500 — traced across 5 layers of your codebase.               │
│       ├────────────────────────────────────────────┬───────────────────────────────────────────┤
│  [⑂]  │ DEPENDENCY TRACE                           │ ROOT CAUSE                                │
│       │                                            │ Incorrect database key used by UserService│
│  [✓]  │                  Frontend                  │ user_service.py · line 42                 │
│       │                     │                      │ ┌───────────────────────────────────────┐ │
│  [<>] │                  Auth API                  │ │ - return db.get("user_id", uid)       │ │
│       │                     │                      │ │ + return db.get("users:id", uid)      │ │
│       │                Auth Service                │ └───────────────────────────────────────┘ │
│       │                /     │     \               │ [ Apply patch ]   [ Run recommended tests ]│
│       │            Cache     │    Logger           │ RECOMMENDED TESTS:                        │
│       │                      │                     │ [test_auth] [test_user_service] [test_api]│
│       │              🔴 User Service ●             │ CONFIDENCE: [████████████████████░] 94%   │
│       │                      │                     ├─────────────────────┬─────────────────────┤
│       │                   Database                 │ CHANGE IMPACT       │ VERIFICATION        │
│       │                                            │ Risk: HIGH          │      ╭───╮          │
│       │  Failure originates in User Service —      │ 17 files            │      │4/4│          │
│       │  everything above inherits the error.      │ 3 APIs · 2 services │      ╰───╯          │
│       │                                            │ Know what breaks.   │ ✓ 4/4 Suites Green  │
└───────┴────────────────────────────────────────────┴─────────────────────┴─────────────────────┘
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**

### 2. Clone & Install
```bash
git clone https://github.com/viswanath006/DevTwin.git
cd DevTwin

# Install all dependencies (root, server, and client)
npm run install:all
```

### 3. Launch Development Server
```bash
npm run dev
```

Both services will spin up concurrently:
- 🌐 **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- ⚙️ **Backend API**: [http://localhost:5000](http://localhost:5000)
- 🩺 **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

*(Optional) Configure Gemini / OpenAI in `server/.env` — by default, DevTwin runs on a built-in zero-key heuristic AI twin engine requiring **no external API keys**.*

---

## 🎯 1-Click Grand Finale Demo Journey

Experience the complete end-to-end twin workflow in 60 seconds:

1. **Load Project**: Open [http://localhost:5173](http://localhost:5173). DevTwin auto-mounts the SaaS Demo microservice.
2. **Inspect the Trace**: Observe the `DEPENDENCY TRACE` card. The visual graph highlights `User Service ●` with a glowing crimson aura as the failure origin.
3. **Review Root Cause**: In `ROOT CAUSE`, examine the detected schema key mismatch at `user_service.py:42`.
4. **Apply Fix**: Click **`[ Apply patch ]`** to stage the unified git diff replacement.
5. **Verify Fix**: Click **`[ Run recommended tests ]`** to execute the test runner. Observe the `VERIFICATION` score gauge update to `4/4` green.
6. **Evaluate Blast Radius**: Check the `CHANGE IMPACT` card to understand affected callers (3 APIs, 2 services, 17 files) before committing.

---

## 🏗️ Repository Structure

```
DevTwin/
├── package.json                   # Root orchestrator (scripts: dev, build, install:all)
├── .env.example                   # Environment configuration template
├── server/                        # Express Backend API
│   └── src/
│       ├── index.js               # Entry point & API route registration
│       ├── config.js              # Environment & AI provider options
│       ├── routes/                # REST endpoints
│       │   ├── health.js          # Server & AI engine health
│       │   ├── codebase.js        # File scanning & AST querying
│       │   ├── debug.js           # Root-cause analysis & diff patcher
│       │   ├── impact.js          # Blast radius & change impact analyzer
│       │   ├── verify.js          # Test runner & verification engine
│       │   ├── security.js        # Vulnerability & secret scanner
│       │   ├── review.js          # Automated pull-request code reviewer
│       │   ├── ask.js             # Grounded codebase natural language Q&A
│       │   ├── git.js             # Git history & hotspot intelligence
│       │   └── architecture.js    # Architecture drift & layer validator
│       └── services/              # Core Twin Engines
│           ├── codebaseScanner.js # Local repository AST & symbol indexing
│           ├── dependencyGraph.js # Call graph & blast radius calculation
│           ├── testRunner.js      # Safe subprocess test execution
│           ├── securityScanner.js # OWASP & static code security auditing
│           ├── codeReviewer.js    # Multi-dimensional code review engine
│           ├── askCodebase.js     # Semantic & symbol-grounded search
│           ├── gitIntelligence.js # Churn, hotspot & author ownership analysis
│           ├── architectureDrift.js# Expected vs. actual architecture drift detector
│           ├── whatIfSimulator.js # Speculative architectural change simulator
│           ├── healthScore.js     # Codebase stability & technical debt metric
│           └── ai/                # Modular AI adapter layer
│               ├── mockProvider.js    # Zero-key offline heuristic engine
│               ├── geminiProvider.js  # Google Gemini 2.5 Flash / Pro
│               └── openaiProvider.js  # OpenAI GPT-4o / OpenRouter
├── client/                        # Modern React Frontend (Vite)
│   └── src/
│       ├── index.css              # Obsidian cosmic design system & animations
│       ├── App.jsx                # Layout orchestrator & router
│       ├── api/client.js          # Typed Axios/Fetch backend bridge
│       └── components/            # UI Views & Panels
│           ├── MasterReferenceView.jsx # Grand Finale cosmic twin workspace
│           ├── DashboardView.jsx       # Streamlined overview & architecture flow
│           ├── AIDebuggerView.jsx      # Root cause diagnosis & diff verification
│           ├── ImpactAnalyzerView.jsx  # Multi-modal blast radius predictor
│           ├── SecurityScannerView.jsx # Vulnerability audit & remediation
│           ├── ArchitectureView.jsx    # Drift detection & layer dependency graph
│           ├── CodeReviewView.jsx      # PR code review with security/quality tags
│           ├── AskCodebaseView.jsx     # Grounded natural language codebase Q&A
│           ├── GitIntelligenceView.jsx # Git churn, hotspots & risk heatmaps
│           └── WhatIfAnalysisView.jsx  # Speculative architectural change simulation
└── sample-projects/               # Bundled evaluation codebases
    ├── demo-cloud-app/            # Express SaaS app with realistic DB defect
    └── demo-polyglot/             # Multi-language app (Java, Python, TS, Go)
```

---

## 🌟 Comprehensive Capability Catalog

### 1. 🔍 Polyglot AST Codebase Indexing
- **Supported Languages**: Python (`.py`, `requirements.txt`), JavaScript/TypeScript (`.js`, `.jsx`, `.ts`, `.tsx`, `package.json`), Java (`.java`, `pom.xml`, `build.gradle`), Go, JSON, and YAML.
- **Symbol & Route Extraction**: Maps controllers, route decorators (`@app.get`, `router.post`, `@GetMapping`), models, repositories, and unit tests with exact file and line references.

### 2. 🧠 AI Root-Cause Debugger
- **Grounded Defect Diagnosis**: Ingests error traces, stack dumps, and local source files to localize defects without hallucinating non-existent modules.
- **Evidence-Based Confidence**: Confidence strictly mirrors physical code matches (e.g. 94% when target function and table column match).
- **Unified Diff Patching**: Emits standard git unified diffs ready for review or automatic verification.

### 3. 💥 Change Impact & Blast Radius Analysis
- **3-Tier Dependency Tiers**: Categorizes blast radius into **Confirmed** (direct callers/importers), **Likely** (transitive callers), and **Possible** (domain co-located modules).
- **Multi-Modal Inputs**: Accepts Git Diffs, changed code snippets, or natural language intent descriptions.

### 4. 🛡️ OWASP AI Security Scanner
- Audits code against 10 critical vulnerability vectors:
  1. Hardcoded API keys, JWT secrets, and credentials
  2. SQL & Command injection vectors
  3. Unsanitized user input & XSS vulnerabilities
  4. Broken authentication & weak hashing (MD5/SHA1)
  5. Vulnerable third-party package dependencies
  6. Permissive CORS & unencrypted transports
  7. Sensitive information leaking into logs
  8. Missing rate limiting & broken access control

### 5. 🏗️ Architecture Drift Detection
- Compares declared/expected architectural contracts (`Controller ──► Service ──► Repository ──► Database`) against actual physical dependency imports.
- Flags illegal architectural drift (e.g. Controllers directly executing queries against Database, bypassing Service business logic).

### 6. 🔮 What-If Architectural Simulation
- Predicts systemic blast radius of speculative high-level technical decisions:
  - Migrating authentication from JWT to OAuth2
  - Swapping persistence from SQLite to PostgreSQL with connection pooling
  - Introducing Redis caching layers in front of repositories
  - Enforcing multi-tenant Organization ID partition filters

### 7. 📈 Git Intelligence & Code Hotspots
- Analyzes commit history, revision frequency, code churn, and author ownership.
- Correlates high churn frequency with defect rates to calculate component fragility indices.

### 8. 🧪 Safe Sandbox Verification Engine
- Whitelisted, sandboxed process execution for `pytest`, `npm test`, `mvn test`, and `gradle test`.
- Subprocess timeout guards (15s) and memory caps preventing accidental infinite loops or fork bombs.

---

## 🔒 Security & Anti-Hallucination Principles

DevTwin follows strict engineering guardrails:

- **Zero Cloud Leakage**: Repository code is analyzed locally on your machine.
- **Strict Evidence Grounding**: The AI model is strictly prohibited from asserting facts unsupported by AST file symbols. When evidence is insufficient, it explicitly outputs `"Insufficient Codebase Evidence"`.
- **Non-Destructive Execution**: DevTwin never modifies files on disk without explicit developer confirmation.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <b>Built for Hackathon Grand Finale · Powered by Antigravity</b>
</p>
