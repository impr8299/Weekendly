import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { validateSignup } from '../validation.js';

export const waitlistRouter = Router();

const UNIQUE_VIOLATION = '23505';

// Slow down spam / bots on the signup endpoint.
const signupLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      error: 'TOO_MANY_REQUESTS',
      message: 'Too many attempts. Please wait a minute and try again.',
    }),
});

// Position = number of entries that joined at or before this one. Not the raw id,
// because Postgres sequences skip numbers when an insert fails (e.g. a duplicate).
async function getPositionAndCount(id) {
  const { rows } = await pool.query(
    `SELECT (SELECT COUNT(*) FROM waitlist_entries WHERE id <= $1) AS position,
            (SELECT COUNT(*) FROM waitlist_entries)                AS count`,
    [id],
  );
  return { position: Number(rows[0].position), count: Number(rows[0].count) };
}

// GET /api/waitlist/count - how many people have joined so far.
waitlistRouter.get('/count', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) AS count FROM waitlist_entries');
    res.json({ count: Number(rows[0].count) });
  } catch (err) {
    next(err);
  }
});

// POST /api/waitlist - join the waitlist.
waitlistRouter.post('/', signupLimiter, async (req, res, next) => {
  const { errors, data } = validateSignup(req.body);
  if (errors) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Please fix the highlighted fields.',
      fields: errors,
    });
  }

  try {
    // Insert first and let the unique indexes reject duplicates. Checking first and then
    // inserting would let two identical requests at the same moment both get in.
    const { rows } = await pool.query(
      `INSERT INTO waitlist_entries
         (full_name, email, mobile, city, city_other, interests, whatsapp_opt_in, terms_accepted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       RETURNING id`,
      [data.fullName, data.email, data.mobile, data.city, data.cityOther, data.interests, data.whatsappOptIn],
    );
    const { position, count } = await getPositionAndCount(rows[0].id);
    return res.status(201).json({ position, count });
  } catch (err) {
    if (err.code !== UNIQUE_VIOLATION) return next(err);
  }

  // Duplicate email and/or mobile: tell them they're already on the list, with their position.
  try {
    const { rows: matches } = await pool.query(
      'SELECT id, email, mobile FROM waitlist_entries WHERE email = $1 OR mobile = $2 ORDER BY id',
      [data.email, data.mobile],
    );
    const emailMatch = matches.find((m) => m.email === data.email);
    const mobileMatch = matches.find((m) => m.mobile === data.mobile);
    const existing = emailMatch || mobileMatch;
    if (!existing) throw new Error('Unique violation but no matching entry found');

    const matchedOn = [];
    if (emailMatch) matchedOn.push('email');
    if (mobileMatch) matchedOn.push('mobile');

    const { position, count } = await getPositionAndCount(existing.id);
    return res.status(409).json({
      error: 'ALREADY_JOINED',
      message: "You're already on the list!",
      matchedOn,
      position,
      count,
    });
  } catch (err) {
    return next(err);
  }
});
