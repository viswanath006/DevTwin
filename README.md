# DevTwin 🌌
### AI Digital Twin for your Codebase

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-devtwin--pied.vercel.app-7928CA?style=for-the-badge&logo=vercel&logoColor=white)](https://devtwin-pied.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-viswanath006%2FDevTwin-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/viswanath006/DevTwin)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vercel Deployment](https://img.shields.io/badge/Deployed%20with-Vercel-black?logo=vercel)](https://devtwin-pied.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org)
[![Vite](https://img.shields.io/badge/Vite-v8.3-646CFF.svg)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![Local-First](https://img.shields.io/badge/Execution-100%25%20Local%20%26%20Private-emerald.svg)]()
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini%20%7C%20OpenAI%20%7C%20Zero--Key%20Offline-orange.svg)]()

<br/>

**[🌐 Experience the Live Application](https://devtwin-pied.vercel.app/)** · **[⚡ 10-Second Judge Tour](#-the-10-second-judge-experience)** · **[🖥️ UI Architecture](#️-grand-finale-ui-architecture)** · **[🚀 Local Quickstart](#-local-quickstart-guide)** · **[🏗️ Repository Structure](#️-repository-structure)**

</div>

---

> [!IMPORTANT]
> **Live Web Deployment**: DevTwin is live on Vercel at **[https://devtwin-pied.vercel.app/](https://devtwin-pied.vercel.app/)**. You can test the full twin simulation, root-cause diagnosis, dependency traces, change blast radius, security auditing, and test verification directly in your browser.

---

## 💡 What is DevTwin?

**DevTwin** is an in-memory **AI Digital Twin of your software codebase**. Rather than acting as a simple code generator, DevTwin builds a comprehensive, multi-layer semantic replica of your repository:
- **Polyglot AST & Dependency Graph**: Discovers routes, services, database calls, and cross-file dependencies.
- **Root-Cause Defect Localization**: Traces runtime errors (e.g. 500 status codes) directly down to the offending line of code.
- **Blast Radius & Impact Analysis**: Calculates exactly which files, APIs, and microservices will be affected by a proposed change before you commit.
- **Automated Patch & Test Verification**: Generates unified diffs and executes verification suites to prove fixes work.
- **Architecture Drift & Security Auditing**: Flags architectural violations and audits for OWASP security vulnerabilities.

---

## ⚡ The 10-Second Judge Experience

DevTwin is designed for maximum developer velocity and instant clarity. Within **10 seconds**, any judge or engineer can answer the 5 critical software engineering questions:

```
┌─────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Question                        │ DevTwin Live Answer                                    │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 1. WHAT PROJECT IS LOADED?      │ Shop-API (Polyglot microservices: Python, Node, Go)    │
│ 2. IS THERE A PROBLEM?          │ 🔴 500 Internal Server Error in POST /api/login        │
│ 3. WHAT IS THE ROOT CAUSE?      │ Database query uses wrong key in UserService (line 42) │
│ 4. WHAT SHOULD I DO?            │ One-click unified git diff patch ready to apply        │
│ 5. IS THE FIX VERIFIED?         │ 🟢 4/4 Test Suites Green (Auth, User, API, Integration)│
└─────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 🖥️ Grand Finale UI Architecture

DevTwin features an obsidian **cosmic dark developer console** built with high-density layouts, subtle glassmorphism, and responsive reactive states:

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

## 🎯 1-Click Interactive Demo Flow

You can test the entire workflow on the live site in under 60 seconds:

1. **Open Live App**: Navigate to **[https://devtwin-pied.vercel.app/](https://devtwin-pied.vercel.app/)**.
2. **Inspect the Dependency Trace**: The graph immediately isolates the critical failure path from `Frontend ──► Auth API ──► Auth Service ──► User Service`. Notice the glowing crimson beacon highlighting `User Service ●`.
3. **Review the Root Cause**: DevTwin localizes the schema mismatch to `user_service.py:42` with 94% confidence and shows the exact diff.
4. **Stage the Fix**: Click **`Apply patch`** to stage the corrected query syntax.
5. **Execute Verification**: Click **`Run recommended tests`** to run automated test suites (`test_auth`, `test_user_service`, `test_api`). Watch the verification gauge spin up to a clean `4/4 Green`.
6. **Inspect Blast Radius**: View the `CHANGE IMPACT` card showing 17 potentially affected files and 3 dependent endpoints across the codebase.
7. **Explore More Modules**: Use the slim left rail to switch to **Security Scanner**, **Architecture Drift**, **What-If Simulation**, **Git Intelligence**, and **Code Review**.

---

## 🌟 Comprehensive Capability Catalog

| Pillar | Capability | What It Solves |
|---|---|---|
| **1. Polyglot AST Indexing** | Deep parsing of JS/TS, Python, Java, Go | Maps components, classes, controllers, models, and decorators without executing arbitrary code. |
| **2. AI Root-Cause Debugger** | Ingests stack traces & source lines | Pinpoints defect origins with evidence-based confidence metrics and generates clean unified diffs. |
| **3. Change Impact Predictor** | 3-tier blast radius modeling | Predicts Confirmed (direct), Likely (transitive), and Possible (domain) callers before code merges. |
| **4. OWASP Security Scanner** | Audits top 10 vulnerability vectors | Catches hardcoded secrets, SQL injection, XSS vectors, insecure JWT algorithms, and weak crypto. |
| **5. Architecture Drift** | Expected vs. actual layer audit | Detects violations (e.g. Controller bypassing Service to query Database directly) with remediation advice. |
| **6. What-If Simulator** | Speculative architectural forecasting | Models the blast radius of migrations (e.g. SQLite ➔ Postgres, JWT ➔ OAuth2, caching layers). |
| **7. Git Intelligence** | Code churn & hotspot analytics | Correlates high revision churn with defect frequency to compute fragility scores per component. |
| **8. Safe Test Runner** | Sandboxed subprocess verification | Executes whitelisted tests with strict memory guards and 15s execution timeouts. |

---

## 🏗️ Repository Structure

```
DevTwin/
├── package.json                   # Root orchestrator & Vercel deployment scripts
├── vercel.json                    # Vercel Serverless & SPA routing configuration
├── api/                           # Serverless backend entrypoint
│   └── index.js                   # Express serverless handler for Vercel
├── server/                        # Express Backend Engine
│   └── src/
│       ├── index.js               # API route registration & server bootstrap
│       ├── config.js              # Environment settings & AI engine flags
│       ├── routes/                # Clean REST endpoints
│       │   ├── health.js          # Health check & engine status
│       │   ├── codebase.js        # File tree, AST & symbol search
│       │   ├── debug.js           # Root-cause analysis & diff patcher
│       │   ├── impact.js          # Change impact blast radius analyzer
│       │   ├── verify.js          # Subprocess test runner & verification
│       │   ├── security.js        # OWASP security & secret audit
│       │   ├── review.js          # PR code review engine
│       │   ├── ask.js             # Semantic codebase Q&A
│       │   ├── git.js             # Git history & hotspot analysis
│       │   └── architecture.js    # Architectural drift detector
│       └── services/              # Core Twin Computation Engines
│           ├── codebaseScanner.js # Repository AST parser & symbol catalog
│           ├── dependencyGraph.js # Call graph & blast radius calculation
│           ├── testRunner.js      # Safe subprocess test execution
│           ├── securityScanner.js # OWASP static audit engine
│           ├── codeReviewer.js    # Multi-dimensional code review
│           ├── askCodebase.js     # Symbol-grounded natural language search
│           ├── gitIntelligence.js # Churn & author ownership analysis
│           ├── architectureDrift.js# Architectural layer constraint validator
│           ├── whatIfSimulator.js # Speculative scenario simulator
│           ├── healthScore.js     # Repository stability & technical debt score
│           └── ai/                # Modular AI adapter layer
│               ├── mockProvider.js    # Zero-key offline heuristic engine
│               ├── geminiProvider.js  # Google Gemini 2.5 Flash / Pro
│               └── openaiProvider.js  # OpenAI GPT-4o / OpenRouter
│   └── tests/                     # Dedicated Backend Verification & Integration Suites
│       ├── test-final-integration.js # Complete 12-capability system test
│       ├── test-verification.js      # Sandbox test engine validation
│       └── audit-flow-verification.js# Live HTTP audit suite
├── client/                        # Modern React Frontend (Vite)
│   └── src/
│       ├── index.css              # Obsidian cosmic design system & glassy finish tokens
│       ├── App.jsx                # Layout orchestrator & navigation
│       ├── api/client.js          # Resilient Axios/Fetch backend bridge
│       └── components/            # Modular Component Architecture
│           ├── layout/            # Navigation Header & Cosmic Sidebar
│           │   ├── Header.jsx
│           │   └── Sidebar.jsx
│           ├── views/             # 12 Dedicated Twin Feature Views
│           │   ├── DashboardView.jsx
│           │   ├── AIDebuggerView.jsx
│           │   ├── ImpactAnalyzerView.jsx
│           │   ├── SecurityScannerView.jsx
│           │   ├── CodeReviewView.jsx
│           │   ├── AskCodebaseView.jsx
│           │   ├── GitIntelligenceView.jsx
│           │   ├── ArchitectureView.jsx
│           │   ├── WhatIfAnalysisView.jsx
│           │   └── MasterReferenceView.jsx
│           ├── common/            # Reusable Widgets & Health Indicators
│           │   └── CodebaseHealthCard.jsx
│           └── index.js           # Clean barrel exports
└── sample-projects/               # Pre-bundled evaluation repositories
    ├── demo-cloud-app/            # Express SaaS app with realistic DB defect
    └── demo-polyglot/             # Multi-language app (Java, Python, TS, Go)
```

---

## 🚀 Local Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**

### 2. Clone & Install
```bash
git clone https://github.com/viswanath006/DevTwin.git
cd DevTwin

# Install all dependencies (root, backend, frontend)
npm run install:all
```

### 3. Launch the Development Environment
```bash
npm run dev
```

Both backend and frontend will start concurrently:
- 🌐 **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- ⚙️ **Backend API**: [http://localhost:5000](http://localhost:5000)
- 🩺 **Health Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

> [!TIP]
> **Zero API Keys Required**: DevTwin comes with a built-in offline heuristic twin engine. It works immediately out of the box without requiring any API keys. If you wish to use Gemini or OpenAI, simply add your keys to `server/.env`.

---

## ☁️ Deployment

### Vercel (Production)
DevTwin is configured for instantaneous deployment to Vercel:
1. Fork or clone this repository.
2. Import the project into your [Vercel Dashboard](https://vercel.com).
3. The included `vercel.json` and `api/index.js` automatically configure both the Vite frontend build and the Express serverless API routes.
4. Live reference deployment: **[https://devtwin-pied.vercel.app/](https://devtwin-pied.vercel.app/)**

---

## 🔒 Security & Anti-Hallucination Guarantees

DevTwin is engineered under strict production principles:

- **100% Local-First & Private**: Repository source code never leaves your local environment or serverless runtime.
- **Strict Evidence Grounding**: The AI model is strictly prohibited from fabricating files, symbols, or functions. If evidence cannot be found in the AST index, DevTwin outputs `"Insufficient Codebase Evidence"`.
- **Non-Destructive Execution**: DevTwin generates unified diffs and previews changes safely without writing to disk unless explicitly commanded.
- **Sandbox Test Guardrails**: Test execution uses strict subprocess execution limits, disabling shell interpolation and enforcing execution timeouts.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[Explore DevTwin Live](https://devtwin-pied.vercel.app/)** · Built with ❤️ for the Hackathon Grand Finale

</div>
