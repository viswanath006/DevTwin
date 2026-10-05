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
