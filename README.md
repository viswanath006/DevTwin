# DevTwin — Codebase Digital Twin MVP

DevTwin is an AI-powered developer tool that acts as an in-memory digital twin of your software codebase. It provides local-first repository indexing, call graph mapping, root-cause debugging, change impact blast-radius analysis, and automated test verification.

---

## Architecture Overview

```
DevTwin/
├── package.json                   # Root orchestrator (scripts: dev, build, start)
├── .env.example                   # Environment configuration template
├── server/                        # Backend API (Node.js + Express)
│   ├── .env                       # Local environment variables
│   └── src/
│       ├── index.js               # Express server entry point & routing
│       ├── config.js              # Environment & AI provider configuration
│       ├── routes/
│       │   ├── health.js          # GET /api/health (Health check)
│       │   ├── codebase.js        # POST /api/codebase/scan, /query, GET /file
│       │   ├── debug.js           # POST /api/debug/root-cause
│       │   ├── impact.js          # POST /api/impact/analyze
│       │   └── verify.js          # POST /api/verify/generate-tests, /run
│       └── services/
│           ├── codebaseScanner.js # Local filesystem scanner & file tree generator
│           ├── dependencyGraph.js # AST/regex import parser & blast radius engine
│           ├── testRunner.js      # Verification runner abstraction
│           └── ai/
│               ├── aiProvider.js  # Modular AI provider interface & factory
│               ├── mockProvider.js# Offline heuristic twin engine (zero-key fallback)
│               ├── geminiProvider.js # Google Gemini 2.5 Flash / Pro adapter
│               └── openaiProvider.js # OpenAI / OpenRouter adapter
└── client/                        # Frontend (Vite + React + Vanilla CSS)
    ├── vite.config.js             # Vite config with backend proxy (/api -> :5000)
    └── src/
        ├── index.css              # Dark developer-tool design system (Cursor / Linear style)
        ├── App.jsx                # Layout, header, sidebar & view router
        ├── api/client.js          # API client layer communicating with backend
        └── components/
            ├── Sidebar.jsx        # Navigation & server health pill
            ├── Header.jsx         # Repository path selector & scan trigger
            ├── DashboardView.jsx  # Codebase stats, integrity score, quick workflows
            ├── ProjectAnalyzerView.jsx # File tree, code viewer, dependency inspector
            ├── AIDebuggerView.jsx # Root cause diagnosis & unified git diff fix
            ├── ImpactAnalyzerView.jsx # Blast radius gauge & breaking risk report
            └── TestVerificationView.jsx# Test generator & local verification runner
```

---

## Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+

### 2. Environment Setup
The project works out of the box with the **local heuristic twin engine** without requiring any API keys.
To connect Gemini or OpenAI:

1. Copy `.env.example` to `server/.env`:
   ```bash
   cp .env.example server/.env
   ```
2. Configure your provider in `server/.env`:
   ```env
   PORT=5000
   AI_PROVIDER=gemini # 'mock' | 'gemini' | 'openai'
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```

### 3. Install Dependencies
Run the following from the root directory:
```bash
npm run install:all
```
*(Or install in each directory: `npm install`, `cd server && npm install`, `cd client && npm install`)*

### 4. Start the Application
To run both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Core MVP Features

1. **Phase 1: Minimal DevTwin Fullstack Architecture**:
   - Modern dark-themed dashboard, API proxying, and modular AI provider abstraction (`mock`, `gemini`, `openai`).
2. **Phase 2: Deep Codebase Understanding & Real Analysis**:
   - **Multi-Language Support**: Java (`.java`, `pom.xml`, `build.gradle`), Python (`.py`, `requirements.txt`), TypeScript & JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`, `package.json`), JSON (`.json`), YAML (`.yaml`, `.yml`).
   - **Symbol & Component Extraction**: Extracts classes, functions, methods, and React components with source files and line numbers.
   - **API Route Detection**: Detects endpoints across Express/Node (`router.post`), FastAPI (`@app.get`), Flask, and Spring Boot (`@GetMapping`, `@PostMapping`).
   - **Dependencies & Package Parser**: Extracts real package dependencies from `package.json`, `pom.xml`, `requirements.txt`, and `build.gradle`.
   - **Test Suite Extraction**: Detects test files, frameworks (JUnit, Pytest, Vitest/Jest), and test assertions.
   - **Architecture Categorization**: Categorizes modules into architectural layers (API & Routes, Services, Models, UI, Config, Tests).
   - **Folder Upload & Drag-and-Drop**: Users can either specify a local folder path OR upload an entire folder via the browser file picker.
   - **Sample Polyglot Project**: Pre-bundled in `sample-projects/demo-polyglot/` with Java Spring Boot, Python FastAPI, TypeScript Express, and tests for instant 1-click evaluation.
3. **Phase 3: AI Architecture Understanding & Flow Visualization**:
   - **Structured Architecture Engine**: Pluggable AI synthesis (`Mock`, `Gemini`, `OpenAI`) receiving normalized codebase context.
   - **Architecture Flow Visualization**: Visual 4-tier interactive flow: `Frontend UI` ──► `API Gateway` ──► `Domain Services` ──► `Database Storage`.
   - **Evidence-Grounded Reporting**: Only displays relationships backed by project files and package manifests; unverified layers (such as database or auth) are explicitly marked as `"Unknown"` to prevent hallucination.
   - **Major Components & Roles**: Maps classes, controllers, and services with real source locations.
   - **End-to-End Data & API Flows**: Traces consumer calls through route handlers, domain logic, and persistence.
   - **Architectural Risk Alerts**: Highlights missing test coverage, unverified persistence, or lack of API rate-limiting with recommendations.
   - **AI Analysis Loading State**: Animated pulse with progress messages during synthesis.
4. **Phase 4: AI Root-Cause Debugger**:
   - **Grounded Defect Diagnosis**: Analyzes error message, stack trace logs, real repository files, and dependency graph.
   - **Anti-Hallucination Guard**: Never invents files or functions. If evidence is insufficient, it explicitly states `"Insufficient Codebase Evidence"` and sets confidence $\le 0.3$.
   - **Confidence Score Reflection**: Strictly mirrors evidence presence (e.g. 92% when exact file and line snippet match in codebase).
   - **Visual Dependency & Impact Chain**:
     $$\text{Caller / Test Suite} \longrightarrow \text{ROOT CAUSE: file:line} \longrightarrow \text{Downstream Impact}$$
   - **Syntax-Highlighted Unified Patch**: Generates standard unified git diff showing exact deletions (`-`) and additions (`+`) without modifying the user's project files automatically.
   - **Tested with Real Defect**: Built-in test scenarios for Python `ZeroDivisionError` in [broken_calculator.py](file:///c:/Users/viswa/Desktop/DevTwin/sample-projects/demo-polyglot/services/broken_calculator.py), `ValueError`, and `TypeError`.
5. **Phase 5: Change Impact Analyzer**:
   - **Multi-Modal Change Inputs**: Accepts proposed modifications via:
     - Standard **Git Diff** (with automatic target file extraction from diff headers like `--- a/...`, `+++ b/...`)
     - **Changed File + Code** snippet
     - **Natural Language Intent** (e.g. *"Update PaymentProcessor to enforce minimum charge and require USD currency"*)
   - **3-Tier Evidence Confidence Classification**:
     - 🟢 **Confirmed dependency**: Direct AST caller, importer, or test suite directly testing the target file.
     - 🔵 **Likely dependency**: Transitive consumer (callers of direct callers).
     - 🟡 **Possible dependency**: Co-located module in the same package domain or UI view consuming affected API routes.
   - **Anti-Hallucination & Insufficient Evidence Guard**:
     - Never claims exact impact when project evidence is insufficient.
     - If the target file or change does not exist in the scanned repository, it sets `Risk: LOW` and explicitly explains: *"Insufficient project evidence: The file was not detected in the scanned codebase repository."*
   - **Visual Impact Graph**:
     - Modern 4-column reactive graph rendering the path from `Source Change Origin` ──► `Confirmed` ──► `Likely` ──► `Possible`.
     - Interactive filter pills to view `ALL`, `Confirmed`, `Likely`, or `Possible` nodes.
   - **Executive Impact Header & Metrics**:
     - Displays `CHANGE IMPACT` with dynamic glowing Risk Badge (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
     - Key metrics cards: **Files Potentially Affected**, **APIs Impacted**, **Services Impacted**, and **Test Suites**.
     - Grounded `REASON:` narrative and actionable `RECOMMENDED TESTS:` list with 1-click test plan clipboard copying.
   - **Tested with Real Git Diffs**: Pre-bundled sample diff presets for FastAPI `payment_service.py`, Express `auth.ts`, `broken_calculator.py`, and the non-existent file evidence guard.
6. **Phase 6: Verification Engine**:
   - **Multi-Framework Detection**: Safely detects available testing harnesses:
     - **pytest** (`python -m pytest`)
     - **npm test / Vitest** (`npm test`)
     - **Maven JUnit** (`mvn test`)
     - **Gradle JUnit** (`gradle test`)
     - **DevTwin Safe Verification Engine**
   - **Strict Security & Controlled Process Execution**:
     - Strict command validation whitelist; blocks arbitrary shell scripts, chain operators (`&&`, `;`, `|`), and directory traversals (`..`).
     - Subprocess timeout guards (15s) and memory caps.
     - Never modifies the user's project files automatically.
   - **Pass/Fail Detection & Individual Assertion Parsing**:
     - Captures both `stdout` and `stderr`.
     - Parses individual test assertions:
       ```
       ✓ Authentication test
       ✓ User service test
       ✓ API regression test
       3/3 PASSED
       ```
   - **Failure Integrity & Anti-Hallucination Policy**:
     - When tests fail (e.g. `tests/test_calculator.py` failing due to `ZeroDivisionError`), the engine explicitly marks the run as `FAILED` (`1/2 FAILED`), does **not** claim the fix is verified, and displays the exact traceback and error output.
   - **Integrated Fix Verification Workflow**:
     - Dedicated **Verification Panel** (`TestVerificationView.jsx`) with live test runner and framework chips.
     - Inline **"Verify Fix Now"** button directly inside the AI Debugger view to validate recommended tests immediately after diagnosis.

7. **Phase 7: Integrated 14-Step Primary User Journey**:
   - **Step 1**: Open DevTwin (Dark developer-tool interface, status indicators for Server and AI Engine).
   - **Step 2**: Load project (Pre-loaded polyglot demo or custom path/folder upload).
   - **Step 3**: Analyze project (6 real extracted metrics: Files, Languages, Packages, Components, APIs, Tests).
   - **Step 4**: View Architecture (4-tier interactive flow: UI ──► API ──► Services ──► DB).
   - **Step 5**: Open Debugger (Single-click transition with project context preserved).
   - **Step 6**: Enter actual error (Pre-configured real Python ZeroDivisionError in broken_calculator.py:8).
   - **Step 7**: AI identifies root cause (92% confidence grounded in repository evidence).
   - **Step 8**: Show dependency chain (test_calculator.py ──► broken_calculator.py:8 ──► HTTP Pipeline).
   - **Step 9**: Show suggested patch (Unified git diff syntax-highlighted).
   - **Step 10**: Show recommended tests (tests/test_calculator.py).
   - **Step 11**: Verify the fix (Safe controlled subprocess execution).
   - **Step 12**: Show test results (3/3 PASSED or defect failure with traceback).
   - **Step 13**: Open Change Impact Analyzer (Transfers patched file & unified diff seamlessly).
   - **Step 14**: Show potential impact (Risk badge, blast radius metric, Confirmed/Likely/Possible visual graph).

8. **Phase 8: Grand Finale UI Polish**:
   - **Dark Developer Dashboard Aesthetic**: Inter and JetBrains Mono typography, deep obsidian surfaces, and high information density.
   - **Prominent Branding**: Bold `DEV TWIN - AI DIGITAL TWIN FOR YOUR CODEBASE` header with active AST twin synchronization status.
   - **Key Metrics Elevation**: Project Health score (`94% STABLE`), Files Analyzed, Components, APIs, Tests, and Current Risks.
   - **Key Visual Anchors**:
     - **AI Debugger**: `ROOT CAUSE`, `CONFIDENCE`, `DEPENDENCY CHAIN`, `SUGGESTED FIX`, and `VERIFICATION`.
     - **Impact Analyzer**: `RISK LEVEL`, `AFFECTED COMPONENTS`, `AFFECTED TESTS`, and `RECOMMENDED ACTION`.
   - **Tasteful Micro-Animations**: Scanning laser sweep (`.scanner-active-card`), AI analysis shimmer (`.shimmer-progress`), root-cause pulsing (`.pulse-root-cause`), dependency tracer connectors (`.trace-flow-arrow`), and test running glow (`.test-running-box`).

9. **Phase 9: Built-in Demo Mode**:
   - **Built-in Self-Contained SaaS Demo Application** (`sample-projects/demo-cloud-app`):
     - **Frontend / API Layer** (`src/api/routes.js` & `src/api/userController.js`): Exposes REST endpoints (`GET /api/v1/users/:id`, `POST /api/v1/auth/login`, `PUT /api/v1/users/:id/profile`, `GET /api/v1/system/health`).
     - **Authentication Service** (`src/services/authService.js`): Token signing, session validation, and credential checking.
     - **User Service** (`src/services/userService.js`): Domain business logic, profile enrichment, and data mapping.
     - **Repository / Database Layer** (`src/repositories/userRepository.js` & `src/database/dbConnection.js`): Relational PostgreSQL connection pool and user table queries.
     - **Tests** (`tests/user.test.js`, `tests/auth.test.js`, `tests/api_regression.test.js`, `tests/run_demo_tests.js`).
   - **The Intentional Realistic Defect**:
     - Database query and record mapping in `userRepository.js` queries non-existent column/key `'user_id'` instead of the primary key `'id'`, causing:
       ```
       500 Internal Server Error: DatabaseValidationError: Column or key 'user_id' does not exist in table 'users'. Expected primary key 'id'.
           at UserRepository.findById (src/repositories/userRepository.js:34:13)
           at UserService.getUserProfile (src/services/userService.js:18:38)
           at userController.getUser (src/api/userController.js:19:35)
       ```
   - **Demo Journey Flow**:
     ```
     LOAD DEMO PROJECT (Click 'Load Demo Project' in Header or Sidebar)
     ↓
     ANALYZE (Extracts 11 files, 9 components, 4 APIs, PostgreSQL schema, 3 tests)
     ↓
     ARCHITECTURE GENERATED (UI ──► Express API ──► Services ──► PostgreSQL)
     ↓
     OPEN DEBUGGER (Demo scenario auto-loaded: 500 Database Key Error)
     ↓
     ANALYZE ERROR (Real AI diagnosis locates userRepository.js:34)
     ↓
     ROOT CAUSE IDENTIFIED (Database key lookup mismatch)
     ↓
     DEPENDENCY CHAIN (authService ──► userRepository.js:34 ──► dbConnection)
     ↓
     SUGGESTED PATCH (Unified diff: replaces user_id with id)
     ↓
     VERIFY (Runs controlled process verification)
     ↓
     TESTS PASS (3/3 PASSED: Authentication, User Service, API regression)
     ↓
     CHANGE IMPACT (Shows blast radius: 8 files, 3 services, 2 tests guarded)
     ```
   - **Integrity Guarantee**: Demo Mode operates on the exact same real scanning, AST graph construction, AI diagnosis, and process verification pipeline as any external repository. Zero hardcoded fake responses.

10. **Phase 11: AI Security Scanner**:
    - **10 Codebase Security Vectors**:
      1. **Hardcoded API keys/secrets**: AWS Access Key, GitHub PAT, Google Cloud, OpenAI, Slack, and JWT signing keys.
      2. **Exposed credentials**: Plaintext admin credentials, hardcoded passwords, and database connection strings with embedded passwords.
      3. **SQL injection risks**: Dynamic string concatenation and template literal interpolation in raw SQL queries.
      4. **Command injection risks**: Unsanitized child process execution (`exec`, `execSync`, `os.system`, `subprocess` with `shell=True`).
      5. **Unsafe input handling**: `eval()`, `dangerouslySetInnerHTML`, unsafe Python `pickle.loads()`, and unvalidated path traversal.
      6. **Weak authentication/authorization**: Non-cryptographic pseudo-tokens (`Buffer.from().toString('base64')`), broken hash algorithms (MD5/SHA-1), and hardcoded JWT secrets.
      7. **Dangerous dependency usage**: Manifest audit detecting vulnerable packages (`jsonwebtoken < 9.0.0`, `lodash < 4.17.21`, `axios < 0.21.1`, Log4j, etc.).
      8. **Insecure configuration**: Wildcard CORS policies (`origin: '*'`), disabled TLS certificate validation (`rejectUnauthorized: false`), and unencrypted transport configs.
      9. **Sensitive information in logs**: Credentials, tokens, and authorization headers logged to standard output.
      10. **Common OWASP vulnerabilities**: Broken Access Control (unprotected sensitive routes), Identification & Authentication Failures (unprotected login endpoints without rate limiting), and SSRF.
    - **Strict Code Grounding Guarantee**:
      - Zero fake results. Every finding strictly specifies file, line number, verbatim evidence from source code, impact explanation, and remediation advice.
    - **Security Score & Severity Metrics**:
      - Computes real-time `SECURITY SCORE` (0–100) with status (`SECURE`, `MODERATE RISK`, `ELEVATED RISK`, `CRITICAL RISK`) and grade (`A+` to `F`).
      - Interactive counter cards for `Critical`, `High`, `Medium`, and `Low` severity levels.
    - **Interactive Code Inspector**:
      - Clicking any finding opens the file in context with line numbers and a highlighted culprit line marker.
    - **Multi-Modal Remediation**:
      - Provides actionable code fixes, 1-click evidence clipboard copying, and single-click handoff to the AI Debugger.

---

## Known Limitations

1. **Lightweight AST Parsing**: DevTwin uses high-speed regex-enhanced AST extraction rather than full language servers (LSP). For dynamic language meta-programming (e.g. Python `eval()` or dynamic module imports), dependency links are categorized under the "Possible" confidence tier rather than "Confirmed".
2. **Safe Verification Sandbox**: The test runner enforces a strict security whitelist (`pytest`, `npm test`, `mvn test`, `gradle test`, `devtwin-verify`) and rejects commands containing shell metacharacters (`&&`, `;`, `|`). Custom proprietary build tools or nested shell scripts require adding patterns to `SAFE_COMMAND_PATTERNS`.
3. **Local-First File Bounds**: Files exceeding 1MB or binary assets are excluded from active line indexing to ensure instantaneous response times during live hackathon demonstrations.

---

## Future Roadmap

1. **Language Server Protocol (LSP) Daemon**: Integrate TypeScript and Pyright language server daemons for type-level reference indexing and rename-refactoring blast radius.
2. **Automatic Pull Request Agent**: Auto-create GitHub/GitLab PRs containing the unified diff patch, verification logs, and blast radius risk summaries directly from the DevTwin interface.
3. **Continuous Codebase Twin Sync**: Listen to filesystem `watch` events and Git webhooks to maintain an up-to-the-second in-memory model of code changes in enterprise monorepos.
4. **Interactive Graph Canvas**: WebGL/Canvas-powered node editor allowing developers to pan, zoom, and physically isolate blast radius clusters across thousands of files.

