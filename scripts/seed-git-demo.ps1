# Git history seed script for demo-polyglot
# Creates realistic commits to demonstrate Git Intelligence feature

$repoPath = "c:\Users\viswa\Desktop\DevTwin\sample-projects\demo-polyglot"

function Commit-Stage {
    param($message, $author, $email)
    git -C $repoPath add -A 2>&1 | Out-Null
    git -C $repoPath commit --allow-empty -m $message --author="$author <$email>" 2>&1 | Out-Null
    Write-Host "Committed: $message"
}

# ── Commit 1: Initial project scaffold ─────────────────────────────────────
Commit-Stage "Initial project scaffold: polyglot microservices setup" "Alice Chen" "alice@company.com"

# ── Commit 2: Authentication service ───────────────────────────────────────
# Simulate touching auth files
$authContent = @"
# Authentication Service
import jwt
import bcrypt
from datetime import datetime, timedelta

SECRET_KEY = "jwt-secret-key"

def generate_token(user_id: int) -> str:
    payload = {'user_id': user_id, 'exp': datetime.utcnow() + timedelta(hours=24)}
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def validate_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
"@
New-Item -Path "$repoPath\services\auth_service.py" -ItemType File -Force | Out-Null
Set-Content -Path "$repoPath\services\auth_service.py" -Value $authContent
Commit-Stage "feat(auth): implement JWT authentication service" "Alice Chen" "alice@company.com"

# ── Commit 3: Database repository layer ────────────────────────────────────
$dbContent = @"
# User Repository
import sqlite3
from typing import Optional

def find_user_by_id(user_id: int) -> Optional[dict]:
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, email FROM users WHERE id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()
    return {'id': row[0], 'email': row[1]} if row else None
"@
New-Item -Path "$repoPath\services\user_repository.py" -ItemType File -Force | Out-Null
Set-Content -Path "$repoPath\services\user_repository.py" -Value $dbContent
Commit-Stage "feat(database): add user repository with SQLite backend" "Bob Martinez" "bob@company.com"

# ── Commit 4: API routes ────────────────────────────────────────────────────
$apiContent = @"
// REST API routes for user management
const express = require('express');
const router = express.Router();

router.get('/users/:id', async (req, res) => {
  const user = await userRepo.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.post('/users', async (req, res) => {
  const user = await userRepo.create(req.body);
  res.status(201).json(user);
});

module.exports = router;
"@
New-Item -Path "$repoPath\src\routes\userRoutes.js" -ItemType File -Force | Out-Null
Set-Content -Path "$repoPath\src\routes\userRoutes.js" -Value $apiContent
Commit-Stage "feat(api): add REST routes for user management" "Carol Wang" "carol@company.com"

# ── Commit 5: Configuration files ──────────────────────────────────────────
$cfgContent = @"
# Application Configuration
database:
  host: localhost
  port: 5432
  name: devtwin_demo
  pool_size: 10

jwt:
  secret: \${JWT_SECRET}
  expiry: 86400

logging:
  level: INFO
  format: json
"@
New-Item -Path "$repoPath\config\app.yml" -ItemType File -Force | Out-Null
Set-Content -Path "$repoPath\config\app.yml" -Value $cfgContent
Commit-Stage "config: add application configuration with database and JWT settings" "Bob Martinez" "bob@company.com"

# ── Commit 6: Test suite ────────────────────────────────────────────────────
$testContent = @"
import pytest
from services.auth_service import generate_token, validate_token

def test_generate_token():
    token = generate_token(1)
    assert token is not None

def test_validate_token():
    token = generate_token(42)
    payload = validate_token(token)
    assert payload['user_id'] == 42

def test_invalid_token_raises():
    with pytest.raises(Exception):
        validate_token('invalid-token')
"@
New-Item -Path "$repoPath\tests\test_auth.py" -ItemType File -Force | Out-Null
Set-Content -Path "$repoPath\tests\test_auth.py" -Value $testContent
Commit-Stage "test(auth): add JWT token generation and validation tests" "Alice Chen" "alice@company.com"

# ── Commit 7: Bug fix - database key error ──────────────────────────────────
$fixContent = @"
# User Repository - FIXED
import sqlite3
from typing import Optional

def find_user_by_id(user_id: int) -> Optional[dict]:
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    # Fix: use correct column name 'id' instead of 'user_id'
    cursor.execute('SELECT id, email FROM users WHERE id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {'id': row[0], 'email': row[1]}
"@
Set-Content -Path "$repoPath\services\user_repository.py" -Value $fixContent
Commit-Stage "fix(database): correct column name user_id -> id in user repository" "Carol Wang" "carol@company.com"

# ── Commit 8: Refactor authentication ──────────────────────────────────────
$refactorContent = @"
# Authentication Service - Refactored
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
import os

SECRET_KEY = os.environ.get('JWT_SECRET', 'fallback-dev-only-secret')
TOKEN_EXPIRY_HOURS = int(os.environ.get('TOKEN_EXPIRY_HOURS', '24'))

class AuthenticationError(Exception):
    pass

def generate_token(user_id: int, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS),
        'iat': datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def validate_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise AuthenticationError('Token has expired')
    except jwt.InvalidTokenError:
        raise AuthenticationError('Invalid token')

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())
"@
Set-Content -Path "$repoPath\services\auth_service.py" -Value $refactorContent

$routeRefactor = @"
// REST API routes for user management - Updated
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

router.get('/users/:id', requireAuth, async (req, res) => {
  try {
    const user = await userRepo.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users', requireAuth, async (req, res) => {
  try {
    const user = await userRepo.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
"@
Set-Content -Path "$repoPath\src\routes\userRoutes.js" -Value $routeRefactor

Commit-Stage "refactor(auth): use env vars for JWT secret, add error types, re-add auth middleware to routes" "Alice Chen" "alice@company.com"

# ── Commit 9: Performance optimization ─────────────────────────────────────
$cacheContent = @"
// In-memory LRU cache for user lookups
const cache = new Map();
const MAX_SIZE = 500;

function get(key) {
  if (cache.has(key)) {
    const value = cache.get(key);
    cache.delete(key);
    cache.set(key, value); // Move to end (LRU)
    return value;
  }
  return null;
}

function set(key, value, ttlMs = 300000) {
  if (cache.size >= MAX_SIZE) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

module.exports = { get, set };
"@
New-Item -Path "$repoPath\src\cache.js" -ItemType File -Force | Out-Null
Set-Content -Path "$repoPath\src\cache.js" -Value $cacheContent
Commit-Stage "perf: add LRU in-memory cache to reduce database round-trips" "Bob Martinez" "bob@company.com"

# ── Commit 10: Latest commit - security hardening ──────────────────────────
$secContent = @"
// Security middleware
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

module.exports = { apiLimiter, helmet };
"@
New-Item -Path "$repoPath\src\middleware\security.js" -ItemType File -Force | Out-Null
Set-Content -Path "$repoPath\src\middleware\security.js" -Value $secContent
Commit-Stage "security: add rate limiting and helmet security headers" "Carol Wang" "carol@company.com"

Write-Host "`n✅ Git history seeded with 10 realistic commits!"
git -C $repoPath log --oneline
