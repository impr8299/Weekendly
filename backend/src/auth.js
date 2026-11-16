// Team-view auth: one shared password (ADMIN_PASSWORD) is exchanged for a signed, HttpOnly
// session cookie. The cookie holds only an expiry time + an HMAC signature, so no session
// table is needed and it can't be forged or extended without SESSION_SECRET.
import crypto from "node:crypto";
import { config } from "./config.js";

export const SESSION_COOKIE = "weekendly_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: config.cookieSecure,
  path: "/api/admin",
};
export const sessionCookieOptions = {
  ...baseCookieOptions,
  maxAge: SESSION_TTL_MS,
};
export const clearCookieOptions = baseCookieOptions;

const sign = (value) =>
  crypto
    .createHmac("sha256", config.sessionSecret)
    .update(value)
    .digest("base64url");

// Constant-time comparison so response timing doesn't leak how much of a value matched.
function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function passwordMatches(input) {
  // Hash both sides first so the comparison is always between equal-length values.
  const hash = (v) => crypto.createHash("sha256").update(v).digest("hex");
  return safeEqual(hash(input), hash(config.adminPassword));
}

export function createSessionToken() {
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function isValidSessionToken(token) {
  if (typeof token !== "string") return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  return (
    safeEqual(signature, sign(expiresAt)) && Number(expiresAt) > Date.now()
  );
}

// Middleware for every team-only route.
export function requireAdmin(req, res, next) {
  if (isValidSessionToken(req.cookies?.[SESSION_COOKIE])) return next();
  res
    .status(401)
    .json({ error: "UNAUTHORIZED", message: "Please log in to continue." });
}
