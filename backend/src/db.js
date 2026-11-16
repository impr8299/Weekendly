import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

// Runs the idempotent schema (CREATE ... IF NOT EXISTS) on startup.
export async function initSchema() {
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
}
