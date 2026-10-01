const AppError = require('./AppError');

// Very small in-memory rate limiter: "at most `limit` requests per `windowMs` for this key".
// It protects the free AI quota from one user sending hundreds of requests.
// Note: the counts live in server memory, so they reset when the server restarts. That is fine
// for this project; a big app would keep them in Redis so all servers share them.
const hits = new Map(); // key -> array of request times

const checkRateLimit = (key, limit, windowMs, message) => {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((time) => now - time < windowMs);

  if (recent.length >= limit) {
    const waitMinutes = Math.ceil((windowMs - (now - recent[0])) / 60000);
    throw new AppError(message || `Too many requests. Please try again in ${waitMinutes} minute(s).`, 429);
  }

  recent.push(now);
  hits.set(key, recent);
};

module.exports = { checkRateLimit };
