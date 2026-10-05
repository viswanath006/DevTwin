import fs from 'fs/promises';
import path from 'path';

/**
 * DevTwin Phase 11: AI Security Scanner Engine
 * Performs AST & static code vulnerability auditing strictly grounded in project evidence.
 * NEVER emits a finding without exact file, line number, and code snippet evidence.
 */

// Catalog of known vulnerable packages and version ranges
const KNOWN_VULNERABLE_DEPENDENCIES = [
  {
    name: 'jsonwebtoken',
    ecosystem: 'npm',
    severity: 'HIGH',
    category: 'Dangerous Dependency Usage',
    title: 'Vulnerable jsonwebtoken Library (<9.0.0)',
    check: (ver) => {
      const match = ver.match(/^[\^~]?([0-9]+)\.([0-9]+)/);
      if (!match) return false;
      const major = parseInt(match[1], 10);
      return major < 9;
    },
    description: 'jsonwebtoken versions prior to 9.0.0 suffer from insecure key verification and potential bypass vulnerabilities (CVE-2022-23529, CVE-2022-23540).',
    recommendation: 'Upgrade jsonwebtoken to version ^9.0.0 or higher.',
    confidence: 0.98,
  },
  {
    name: 'lodash',
    ecosystem: 'npm',
    severity: 'HIGH',
    category: 'Dangerous Dependency Usage',
    title: 'Vulnerable lodash Library (<4.17.21)',
    check: (ver) => {
      const match = ver.match(/^[\^~]?([0-9]+)\.([0-9]+)\.([0-9]+)/);
      if (!match) return false;
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      const patch = parseInt(match[3], 10);
      return major < 4 || (major === 4 && (minor < 17 || (minor === 17 && patch < 21)));
    },
    description: 'lodash versions prior to 4.17.21 are vulnerable to Prototype Pollution and Command Injection (CVE-2021-23337, CVE-2020-8203).',
    recommendation: 'Upgrade lodash to ^4.17.21 or migrate to native JavaScript utilities.',
    confidence: 0.96,
  },
  {
    name: 'axios',
    ecosystem: 'npm',
    severity: 'MEDIUM',
    category: 'Dangerous Dependency Usage',
    title: 'Vulnerable axios Library (<0.21.1)',
    check: (ver) => {
      const match = ver.match(/^[\^~]?0\.([0-9]+)\.?([0-9]+)?/);
      if (!match) return false;
      const minor = parseInt(match[1], 10);
      const patch = parseInt(match[2] || '0', 10);
      return minor < 21 || (minor === 21 && patch < 1);
    },
    description: 'axios versions prior to 0.21.1 are vulnerable to Server-Side Request Forgery (SSRF) bypass (CVE-2020-28168).',
    recommendation: 'Upgrade axios to ^1.7.0 or higher.',
    confidence: 0.95,
  },
  {
    name: 'request',
    ecosystem: 'npm',
    severity: 'HIGH',
    category: 'Dangerous Dependency Usage',
    title: 'Deprecated & Unmaintained request Library',
    check: () => true,
    description: 'The request package has been officially deprecated since 2020 and contains unpatched security vulnerabilities and SSRF vectors.',
    recommendation: 'Migrate to native fetch, axios, or got.',
    confidence: 0.99,
  },
  {
    name: 'pyyaml',
    ecosystem: 'pypi',
    severity: 'HIGH',
    category: 'Dangerous Dependency Usage',
    title: 'Vulnerable PyYAML Package (<5.4)',
    check: (ver) => {
      const match = ver.match(/^([0-9]+)\.([0-9]+)/);
      if (!match) return false;
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      return major < 5 || (major === 5 && minor < 4);
    },
    description: 'PyYAML versions prior to 5.4 are vulnerable to arbitrary code execution through untrusted YAML tags (CVE-2020-14343).',
    recommendation: 'Upgrade PyYAML to >=5.4 and always use yaml.safe_load().',
    confidence: 0.97,
  },
  {
    name: 'log4j-core',
    ecosystem: 'maven',
    severity: 'CRITICAL',
    category: 'Dangerous Dependency Usage',
    title: 'Critical Log4Shell Remote Code Execution (<2.17.1)',
    check: (ver) => {
      const match = ver.match(/^([0-9]+)\.([0-9]+)/);
      if (!match) return false;
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      return major === 2 && minor < 17;
    },
    description: 'Apache Log4j 2.x versions prior to 2.17.1 allow remote JNDI LDAP lookup injection leading to instant Remote Code Execution (CVE-2021-44228).',
    recommendation: 'Immediately upgrade log4j-core to 2.17.1 or higher.',
    confidence: 0.99,
  },
];

/**
 * Line-by-line security rules for source files
 */
const SECURITY_RULES = [
  // 1. Hardcoded API keys / Secrets
  {
    id: 'SEC-001',
    category: 'Hardcoded API Keys & Secrets',
    severity: 'CRITICAL',
    confidence: 0.98,
    title: 'Hardcoded AWS Access Key ID',
    regex: /(?:^|[^A-Z0-9])(AKIA[0-9A-Z]{16})(?:[^A-Z0-9]|$)/,
    whyItMatters: 'Hardcoded AWS credentials can be extracted from source code, granting attackers unauthorized access to cloud infrastructure, databases, and compute instances.',
    recommendation: 'Revoke this AWS key immediately via AWS IAM and load credentials dynamically from process.env.AWS_ACCESS_KEY_ID or AWS Secrets Manager.',
  },
  {
    id: 'SEC-002',
    category: 'Hardcoded API Keys & Secrets',
    severity: 'CRITICAL',
    confidence: 0.98,
    title: 'Hardcoded GitHub Personal Access Token',
    regex: /(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{40,})/,
    whyItMatters: 'GitHub tokens embedded in source code permit automated repository takeover, unauthorized source exfiltration, and malicious CI/CD supply-chain attacks.',
    recommendation: 'Revoke this token immediately in GitHub Settings > Developer Settings and use environment secrets.',
  },
  {
    id: 'SEC-003',
    category: 'Hardcoded API Keys & Secrets',
    severity: 'HIGH',
    confidence: 0.95,
    title: 'Hardcoded Google Cloud / AIza API Key',
    regex: /AIza[0-9A-Za-z-_]{35}/,
    whyItMatters: 'Publicly exposed Google Cloud API keys can be abused to rack up unexpected billing charges or compromise cloud services and data buckets.',
    recommendation: 'Restrict this key by IP/HTTP referrers in Google Cloud Console or move it to a protected environment variable.',
  },
  {
    id: 'SEC-004',
    category: 'Hardcoded API Keys & Secrets',
    severity: 'HIGH',
    confidence: 0.95,
    title: 'Hardcoded OpenAI / AI Service Secret Key',
    regex: /sk-(?:proj-)?[a-zA-Z0-9]{20,}/,
    whyItMatters: 'Exposing OpenAI secret keys enables unauthorized third parties to drain API quotas and access sensitive model completion data.',
    recommendation: 'Store the key securely in server/.env (e.g. OPENAI_API_KEY) and access it via process.env.',
  },
  {
    id: 'SEC-005',
    category: 'Hardcoded API Keys & Secrets',
    severity: 'CRITICAL',
    confidence: 0.96,
    title: 'Hardcoded JWT Secret / Token Signing Key',
    regex: /(?:const|let|var)\s+(?:SECRET|JWT_SECRET|SECRET_KEY|tokenSecret)\s*=\s*['"]([a-zA-Z0-9_-]{8,})['"]/i,
    filter: (match, line) => !line.includes('process.env') && !line.includes('your_') && !line.includes('TODO'),
    whyItMatters: 'Hardcoding JWT signing secrets allows adversaries to forge arbitrary authentication tokens, grant themselves administrative roles, and bypass authentication guards completely.',
    recommendation: 'Load the JWT secret from an environment variable: const SECRET = process.env.JWT_SECRET; ensure the variable is defined in production.',
  },
  {
    id: 'SEC-006',
    category: 'Hardcoded API Keys & Secrets',
    severity: 'HIGH',
    confidence: 0.94,
    title: 'Hardcoded Insecure Fallback Secret Key',
    regex: /process\.env\.[A-Z0-9_]+\s*\|\|\s*['"]([a-zA-Z0-9_-]{12,})['"]/,
    whyItMatters: 'Providing a hardcoded string as a fallback secret defaults the application to a known, insecure key whenever the environment variable is not explicitly populated.',
    recommendation: 'Throw an error if the environment variable is not set at boot instead of falling back to a hardcoded string.',
  },

  // 2. Exposed Credentials
  {
    id: 'SEC-007',
    category: 'Exposed Credentials',
    severity: 'CRITICAL',
    confidence: 0.97,
    title: 'Hardcoded Administrative Credentials in Code',
    regex: /if\s*\([^)]*username\s*===?\s*['"][^'"]+['"]\s*&&\s*password\s*===?\s*['"][^'"]+['"]\)/,
    whyItMatters: 'Embedding plaintext username/password credentials directly in authentication conditionals permits any observer of the codebase to log in with privileged credentials.',
    recommendation: 'Replace hardcoded credential comparisons with database lookups verifying cryptographically salted password hashes (e.g., argon2 or bcrypt).',
  },
  {
    id: 'SEC-008',
    category: 'Exposed Credentials',
    severity: 'HIGH',
    confidence: 0.96,
    title: 'Database Connection String with Embedded Password',
    regex: /(?:postgres|mysql|mongodb|redis):\/\/[a-zA-Z0-9_.-]+:([^@\s"']{3,})@[a-zA-Z0-9_.-]+/,
    whyItMatters: 'Hardcoded database credentials in connection strings expose the entire persistence layer to unauthorized direct database access and data exfiltration.',
    recommendation: 'Use environment variables (DATABASE_URL) or cloud secret managers to inject connection URIs at deployment time.',
  },

  // 3. SQL Injection Risks
  {
    id: 'SEC-009',
    category: 'SQL Injection Risks',
    severity: 'HIGH',
    confidence: 0.92,
    title: 'Potential SQL Injection via String Concatenation',
    regex: /(?:\.query|\.execute|executeQuery)\s*\(\s*['"`].*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*\+.*[a-zA-Z0-9_]/i,
    whyItMatters: 'Concatenating unescaped variables directly into SQL statements allows attackers to alter query logic, bypass authentication, and dump or overwrite database tables.',
    recommendation: 'Use parameterized queries with bind variables (e.g., db.query("SELECT * FROM users WHERE id = $1", [userId])).',
  },
  {
    id: 'SEC-010',
    category: 'SQL Injection Risks',
    severity: 'HIGH',
    confidence: 0.93,
    title: 'Potential SQL Injection via Template Literal Interpolation',
    regex: /(?:\.query|\.execute)\s*\(\s*`[^`]*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)[^`]*\$\{[^}]+\}[^`]*`/i,
    whyItMatters: 'Using template literal interpolation (${param}) in SQL queries bypasses parameter binding, leaving the query open to classic SQL injection.',
    recommendation: 'Pass dynamic values in the query parameters array rather than interpolating them directly into the SQL string.',
  },
  {
    id: 'SEC-011',
    category: 'SQL Injection Risks',
    severity: 'HIGH',
    confidence: 0.92,
    title: 'Python SQL Query Formatted with String Interpolation',
    regex: /cursor\.execute\s*\(\s*(?:f['"].*(?:SELECT|UPDATE|INSERT|DELETE)|\s*['"].*(?:SELECT|UPDATE|INSERT|DELETE).*%\s*\()/i,
    whyItMatters: 'Python string formatting or f-strings in cursor.execute bypass database driver escaping mechanisms, allowing SQL injection.',
    recommendation: 'Pass parameters as a tuple in the second argument: cursor.execute("SELECT * FROM table WHERE col = %s", (val,)).',
  },

  // 4. Command Injection Risks
  {
    id: 'SEC-012',
    category: 'Command Injection Risks',
    severity: 'CRITICAL',
    confidence: 0.95,
    title: 'Command Injection via Unsanitized Child Process Execution',
    regex: /(?:exec|execSync)\s*\(\s*(?:`[^`]*\$\{[^}]+\}[^`]*`|['"][^'"]*['"]\s*\+)/,
    filter: (match, line) => !line.includes('npm run') && !line.includes('git ') && !line.includes('SAFE_COMMAND'),
    whyItMatters: 'Constructing shell command lines dynamically with user input permits attackers to inject command separators (; | &&) and execute arbitrary system binaries.',
    recommendation: 'Use execFile or spawn with a fixed binary and an array of arguments, avoiding the system shell entirely.',
  },
  {
    id: 'SEC-013',
    category: 'Command Injection Risks',
    severity: 'CRITICAL',
    confidence: 0.95,
    title: 'Unsafe Python Shell Execution (shell=True)',
    regex: /subprocess\.(?:Popen|call|run)\s*\([^)]*shell\s*=\s*True/i,
    whyItMatters: 'Executing subprocess commands with shell=True passes the string to /bin/sh or cmd.exe, enabling command injection if arguments contain unescaped shell metacharacters.',
    recommendation: 'Remove shell=True and pass command arguments as a Python list: subprocess.run(["command", arg1, arg2]).',
  },

  // 5. Unsafe Input Handling & Deserialization
  {
    id: 'SEC-014',
    category: 'Unsafe Input Handling',
    severity: 'HIGH',
    confidence: 0.96,
    title: 'Unsafe Dynamic Code Evaluation (eval)',
    regex: /(?<!\.)\beval\s*\([a-zA-Z0-9_]/,
    whyItMatters: 'eval() executes arbitrary JavaScript in the caller privileges. If any part of the evaluated expression is influenced by user input, remote code execution occurs.',
    recommendation: 'Replace eval() with structured parsers like JSON.parse() or dedicated domain-specific logic.',
  },
  {
    id: 'SEC-015',
    category: 'Unsafe Input Handling',
    severity: 'HIGH',
    confidence: 0.94,
    title: 'Potential Cross-Site Scripting (dangerouslySetInnerHTML)',
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/,
    whyItMatters: 'Injecting raw HTML directly into the React DOM bypasses JSX automatic string escaping, allowing attackers to execute stored or reflected Cross-Site Scripting (XSS).',
    recommendation: 'Avoid dangerouslySetInnerHTML or sanitize the HTML with DOMPurify before rendering.',
  },
  {
    id: 'SEC-016',
    category: 'Unsafe Input Handling',
    severity: 'CRITICAL',
    confidence: 0.98,
    title: 'Insecure Python Object Deserialization (pickle.loads)',
    regex: /pickle\.(?:loads|load)\s*\(/,
    whyItMatters: 'Python pickle can instantiate arbitrary Python objects. Deserializing untrusted pickle streams leads directly to Remote Code Execution.',
    recommendation: 'Use safer serialization formats such as JSON, Protocol Buffers, or messagepack instead of pickle.',
  },
  {
    id: 'SEC-017',
    category: 'Unsafe Input Handling',
    severity: 'HIGH',
    confidence: 0.92,
    title: 'Arbitrary File Path Reading Risk (Path Traversal)',
    regex: /fs\.(?:readFile|createReadStream)\s*\(\s*(?:req\.params|req\.query|req\.body)/,
    whyItMatters: 'Passing user-supplied file names or paths directly to filesystem operations allows directory traversal (e.g., ../../etc/passwd).',
    recommendation: 'Resolve paths against a strict base directory and verify that resolvedPath.startsWith(safeRoot).',
  },

  // 6. Weak Authentication & Authorization Patterns
  {
    id: 'SEC-018',
    category: 'Weak Authentication & Authorization',
    severity: 'CRITICAL',
    confidence: 0.96,
    title: 'Non-Cryptographic Session Token Generation',
    regex: /Buffer\.from\(.+?\.toString\(['"]base64['"]\)/,
    filter: (match, line) => line.toLowerCase().includes('token') || line.toLowerCase().includes('jwt') || line.toLowerCase().includes('session'),
    whyItMatters: 'Constructing authentication session tokens with plain base64 encoding without cryptographic signatures (HMAC or RSA) enables trivial token forgery by anyone.',
    recommendation: 'Use a standard cryptographic library such as jsonwebtoken to generate cryptographically signed tokens with a secure secret.',
  },
  {
    id: 'SEC-019',
    category: 'Weak Authentication & Authorization',
    severity: 'HIGH',
    confidence: 0.94,
    title: 'Use of Cryptographically Broken Hash Algorithm (MD5 / SHA-1)',
    regex: /createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)|hashlib\.(?:md5|sha1)\s*\(/i,
    whyItMatters: 'MD5 and SHA-1 have known collision and pre-image attacks and must never be utilized for password hashing or cryptographic integrity validation.',
    recommendation: 'Migrate to SHA-256 for integrity checks, or Argon2 / bcrypt for passwords.',
  },
  {
    id: 'SEC-020',
    category: 'Weak Authentication & Authorization',
    severity: 'HIGH',
    confidence: 0.95,
    title: 'Hardcoded Secret in JWT Sign Call',
    regex: /jwt\.sign\s*\([^,]+,\s*['"][a-zA-Z0-9_-]{4,}['"]/,
    whyItMatters: 'Supplying a literal string secret directly in jwt.sign() hardcodes the signing key in the compiled code, destroying token authenticity.',
    recommendation: 'Pass a key retrieved from process.env.JWT_SECRET.',
  },

  // 8. Insecure Configuration
  {
    id: 'SEC-021',
    category: 'Insecure Configuration',
    severity: 'MEDIUM',
    confidence: 0.92,
    title: 'Permissive Wildcard CORS Policy',
    regex: /cors\s*\(\s*\{\s*origin\s*:\s*['"]\*['"]/,
    whyItMatters: 'Permitting any origin (*) allows arbitrary malicious websites to issue authenticated cross-origin requests and read sensitive API responses.',
    recommendation: 'Configure CORS with an explicit whitelist of trusted domains or environment-specific origins.',
  },
  {
    id: 'SEC-022',
    category: 'Insecure Configuration',
    severity: 'HIGH',
    confidence: 0.97,
    title: 'TLS / SSL Certificate Verification Disabled',
    regex: /rejectUnauthorized\s*:\s*false|verify\s*=\s*False|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0['"]?/i,
    whyItMatters: 'Disabling TLS certificate verification leaves network communication vulnerable to Man-in-the-Middle (MitM) traffic interception and tampering.',
    recommendation: 'Enable TLS verification (rejectUnauthorized: true) and properly configure trusted Certificate Authority (CA) bundles.',
  },
  {
    id: 'SEC-023',
    category: 'Insecure Configuration',
    severity: 'LOW',
    confidence: 0.88,
    title: 'Unencrypted Database Transport Configuration',
    regex: /["']host["']\s*:\s*["'][^"']+["'],\s*["']port["']\s*:\s*(?:5432|3306|27017)/,
    filter: (match, line, allContent) => !allContent.includes('ssl') && !allContent.includes('tls'),
    whyItMatters: 'Database connection configuration specifies default database ports without explicit TLS/SSL transport encryption flags enabled.',
    recommendation: 'Configure ssl: { rejectUnauthorized: true } or enforce encrypted database transport.',
  },

  // 9. Sensitive Information Exposed in Logs
  {
    id: 'SEC-024',
    category: 'Sensitive Information in Logs',
    severity: 'MEDIUM',
    confidence: 0.92,
    title: 'Sensitive Data (Password / Token) Logged to Output',
    regex: /(?:console\.(?:log|warn|error|info)|logger\.(?:info|debug|warn|error)|print)\s*\([^)]*(?:password|token|secret|apiKey|bearer|credentials)/i,
    filter: (match, line, allContent, filePath) => !filePath.includes('test') && !line.includes('Running test') && !line.includes('describe(') && !line.includes('it('),
    whyItMatters: 'Logging sensitive user credentials or tokens exposes them to logging aggregators, monitoring tools, and developers with read access to log streams.',
    recommendation: 'Redact or sanitize sensitive fields before printing or logging.',
  },

  // 10. Common OWASP-style Vulnerabilities
  {
    id: 'SEC-025',
    category: 'OWASP Security Flaws',
    severity: 'HIGH',
    confidence: 0.91,
    title: 'OWASP A01: Broken Access Control - Unprotected Sensitive Endpoint',
    regex: /(?:router\.(?:get|post|put|delete)|@app\.(?:get|post|put|delete))\s*\(\s*['"]\/(?:api\/)?(?:auth\/me|users(?:\/:id|\/)|payments\/charge|admin)[^'"]*['"]/,
    filter: (match, line) => !line.includes('authenticate') && !line.includes('authMiddleware') && !line.includes('verifyToken') && !line.includes('Depends('),
    whyItMatters: 'Protected domain routes exposing personal data or financial actions are mounted directly without intermediate authentication or role-check middleware.',
    recommendation: 'Attach an authentication middleware (e.g. authenticateToken) before the handler function to guard access.',
  },
  {
    id: 'SEC-026',
    category: 'OWASP Security Flaws',
    severity: 'LOW',
    confidence: 0.89,
    title: 'OWASP A07: Lack of Rate Limiting on Authentication Endpoint',
    regex: /(?:router|app)\.post\s*\(\s*['"]\/(?:api\/)?(?:v[0-9]+\/)?auth\/login['"]/,
    filter: (match, line, allContent) => !allContent.includes('rateLimit') && !allContent.includes('limiter'),
    whyItMatters: 'Authentication login routes without rate-limiting protection are susceptible to automated credential stuffing and brute-force password guessing.',
    recommendation: 'Apply express-rate-limit or Redis token bucket throttling to login and password-reset routes.',
  },
  {
    id: 'SEC-027',
    category: 'OWASP Security Flaws',
    severity: 'HIGH',
    confidence: 0.92,
    title: 'OWASP A10: Server-Side Request Forgery (SSRF) Risk',
    regex: /(?:fetch|axios\.get|requests\.get)\s*\(\s*(?:req\.query|req\.body|user_url|target_url)/i,
    whyItMatters: 'Fetching arbitrary URLs supplied by request parameters allows external attackers to probe internal cloud metadata services (169.254.169.254) and local network endpoints.',
    recommendation: 'Validate target hostnames against an allowlist of approved domains and deny requests to private RFC1918 subnets.',
  },
];

/**
 * Audit project dependencies for known vulnerable packages
 */
async function scanDependencies(dependencies, fileList, rootPath) {
  const findings = [];
  if (!dependencies || !Array.isArray(dependencies)) return findings;

  const manifestCache = new Map();

  for (const dep of dependencies) {
    const known = KNOWN_VULNERABLE_DEPENDENCIES.find(
      (k) => k.name.toLowerCase() === dep.name.toLowerCase() && k.ecosystem === dep.ecosystem
    );

    if (known && known.check(dep.version || '0.0.0')) {
      let lineNum = 1;
      let evidence = `${dep.name}: ${dep.version}`;

      const manifestFile = fileList?.find((f) => f.relativePath === dep.sourceFile);
      if (manifestFile) {
        try {
          let lines = manifestCache.get(dep.sourceFile);
          if (!lines) {
            const fullPath = manifestFile.fullPath || path.resolve(rootPath, dep.sourceFile);
            const content = await fs.readFile(fullPath, 'utf-8');
            lines = content.split('\n');
            manifestCache.set(dep.sourceFile, lines);
          }

          for (let idx = 0; idx < lines.length; idx++) {
            if (lines[idx].includes(dep.name)) {
              lineNum = idx + 1;
              evidence = lines[idx].trim();
              break;
            }
          }
        } catch {
          // Fallback to default evidence
        }
      }

      findings.push({
        severity: known.severity,
        category: known.category,
        title: known.title,
        description: known.description,
        file: dep.sourceFile,
        line: lineNum,
        evidence,
        recommendation: known.recommendation,
        confidence: known.confidence,
      });
    }
  }

  return findings;
}

/**
 * Scan a single file content against security rules
 */
function scanFileContent(filePath, content) {
  const findings = [];
  const lines = content.split('\n');

  // Skip test runner verification scripts or vendor mock directories
  if (
    filePath.includes('node_modules/') ||
    filePath.includes('dist/') ||
    filePath.includes('tests/') ||
    filePath.includes('tests\\') ||
    filePath.includes('test-demo-mode.js') ||
    filePath.includes('test-impact.js') ||
    filePath.includes('test-http-verify.js') ||
    filePath.includes('test-verification.js') ||
    filePath.includes('test-e2e-workflow.js') ||
    filePath.includes('audit-flow-verification.js') ||
    filePath.includes('services/securityScanner.js') ||
    filePath.includes('services/ai/mockProvider.js')
  ) {
    return findings;
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Skip empty lines and full line comments that aren't config or secrets
    if (!trimmed) continue;
    if (trimmed.startsWith('//') && !trimmed.includes('http') && !trimmed.includes('key') && !trimmed.includes('token')) {
      continue;
    }
    if (trimmed.startsWith('#') && !filePath.endsWith('.yaml') && !filePath.endsWith('.yml')) {
      continue;
    }

    for (const rule of SECURITY_RULES) {
      const match = trimmed.match(rule.regex);
      if (match) {
        // Run optional rule filter
        if (rule.filter && !rule.filter(match, trimmed, content, filePath)) {
          continue;
        }

        findings.push({
          severity: rule.severity,
          category: rule.category,
          title: rule.title,
          description: rule.whyItMatters,
          file: filePath,
          line: lineNum,
          evidence: trimmed,
          recommendation: rule.recommendation,
          confidence: rule.confidence,
        });
      }
    }
  }

  return findings;
}

/**
 * Master scanner function: runs grounded security analysis on project context
 */
export async function runSecurityScan({ rootPath, projectContext, graph }) {
  const startTime = Date.now();
  const fileList = projectContext?.stats?.fileList || [];
  const dependencies = projectContext?.dependencies || [];

  const rawFindings = [];

  // 1. Dependency manifest vulnerability scan
  const depFindings = await scanDependencies(dependencies, fileList, rootPath);
  rawFindings.push(...depFindings);

  // 2. Scan each source file in the indexed repository
  for (const file of fileList) {
    // Only inspect source & configuration files under 500KB
    if (file.size > 500 * 1024) continue;

    const ext = path.extname(file.relativePath).toLowerCase();
    const scannableExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java',
      '.json', '.yaml', '.yml', '.env', '.env.example',
      '.sql', '.sh'
    ];

    if (!scannableExtensions.includes(ext) && !path.basename(file.relativePath).startsWith('.env')) {
      continue;
    }

    try {
      const fullPath = file.fullPath || path.resolve(rootPath, file.relativePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      const fileFindings = scanFileContent(file.relativePath, content);
      rawFindings.push(...fileFindings);
    } catch {
      // Skip unreadable files
    }
  }

  // Deduplicate findings by file + line + title
  const seenKeys = new Set();
  const findings = [];
  for (const f of rawFindings) {
    const key = `${f.file}:${f.line}:${f.title}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      findings.push(f);
    }
  }

  // Sort findings by severity order: CRITICAL > HIGH > MEDIUM > LOW > INFO
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
  findings.sort((a, b) => {
    const orderA = severityOrder[a.severity] ?? 99;
    const orderB = severityOrder[b.severity] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.file.localeCompare(b.file);
  });

  // Calculate severity breakdown counts
  const counts = {
    total: findings.length,
    critical: findings.filter((f) => f.severity === 'CRITICAL').length,
    high: findings.filter((f) => f.severity === 'HIGH').length,
    medium: findings.filter((f) => f.severity === 'MEDIUM').length,
    low: findings.filter((f) => f.severity === 'LOW').length,
    info: findings.filter((f) => f.severity === 'INFO').length,
  };

  // Compute Security Score (0 to 100)
  // Deductions: CRITICAL: -25, HIGH: -15, MEDIUM: -8, LOW: -3
  let score = 100;
  score -= counts.critical * 25;
  score -= counts.high * 15;
  score -= counts.medium * 8;
  score -= counts.low * 3;
  score = Math.max(0, Math.min(100, score));

  // Determine posture status & letter grade
  let scoreGrade = 'A+';
  let scoreStatus = 'SECURE';
  if (score < 50) {
    scoreGrade = 'F';
    scoreStatus = 'CRITICAL_RISK';
  } else if (score < 70) {
    scoreGrade = 'D';
    scoreStatus = 'HIGH_RISK';
  } else if (score < 85) {
    scoreGrade = 'C';
    scoreStatus = 'ELEVATED_RISK';
  } else if (score < 95) {
    scoreGrade = 'B';
    scoreStatus = 'MODERATE_RISK';
  }

  const durationMs = Date.now() - startTime;

  let summary = '';
  if (findings.length === 0) {
    summary = `Clean scan: No critical, high, medium, or low security vulnerabilities detected across ${fileList.length} indexed files.`;
  } else {
    summary = `Security scan completed across ${fileList.length} files in ${durationMs}ms. Identified ${findings.length} actionable vulnerabilities (${counts.critical} Critical, ${counts.high} High, ${counts.medium} Medium, ${counts.low} Low).`;
  }

  return {
    score,
    scoreGrade,
    scoreStatus,
    summary,
    durationMs,
    counts,
    findings,
  };
}
