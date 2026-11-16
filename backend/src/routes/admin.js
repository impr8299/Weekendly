import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import {
  SESSION_COOKIE,
  clearCookieOptions,
  createSessionToken,
  passwordMatches,
  requireAdmin,
  sessionCookieOptions,
} from '../auth.js';
import { entriesToCsv } from '../csv.js';

export const adminRouter = Router();

const PASSWORD_MAX_LENGTH = 200;

// Team data must never be cached by the browser or a proxy.
adminRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Slow down password guessing. Successful logins don't count towards the limit.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      error: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts. Please wait 15 minutes and try again.',
    }),
});

// POST /api/admin/login { password } -> sets the session cookie
adminRouter.post('/login', loginLimiter, (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!password) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Please enter the team password.',
      fields: { password: 'Please enter the team password.' },
    });
  }
  if (password.length > PASSWORD_MAX_LENGTH || !passwordMatches(password)) {
    return res.status(401).json({
      error: 'INVALID_PASSWORD',
      message: 'Incorrect password.',
      fields: { password: 'Incorrect password. Please try again.' },
    });
  }

  res.cookie(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  res.json({ ok: true });
});

// POST /api/admin/logout -> clears the session cookie
adminRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, clearCookieOptions);
  res.status(204).end();
});

// Everything below requires a valid session.
adminRouter.use(requireAdmin);

// GET /api/admin/me -> 200 if logged in (the Team page calls this on load)
adminRouter.get('/me', (_req, res) => res.json({ ok: true }));

// All entries, newest first. Position = order of joining (same as shown to the user).
async function fetchEntries() {
  const { rows } = await pool.query(
    `SELECT id, full_name, email, mobile, city, city_other, interests, whatsapp_opt_in, created_at,
            ROW_NUMBER() OVER (ORDER BY id) AS position
       FROM waitlist_entries
      ORDER BY created_at DESC, id DESC`,
  );
  return rows.map((r) => ({
    id: Number(r.id),
    position: Number(r.position),
    fullName: r.full_name,
    email: r.email,
    mobile: r.mobile,
    city: r.city,
    cityOther: r.city_other,
    interests: r.interests,
    whatsappOptIn: r.whatsapp_opt_in,
    createdAt: r.created_at,
  }));
}

// GET /api/admin/entries -> { count, entries }
adminRouter.get('/entries', async (_req, res, next) => {
  try {
    const entries = await fetchEntries();
    res.json({ count: entries.length, entries });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/entries.csv -> file download
adminRouter.get('/entries.csv', async (_req, res, next) => {
  try {
    const entries = await fetchEntries();
    const date = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="weekendly-waitlist-${date}.csv"`,
    });
    res.send(entriesToCsv(entries));
  } catch (err) {
    next(err);
  }
});
