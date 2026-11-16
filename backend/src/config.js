// Load backend/.env for local runs (Node >= 20.12 built-in). In Docker, variables come from
// docker-compose instead and there is no .env file, so a missing file is fine.
try {
  process.loadEnvFile();
} catch {
  // no .env file - use real environment variables / defaults
}

// Central place for environment configuration. Defaults are for local development only.
export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://weekendly:weekendly@localhost:5432/weekendly",
  adminPassword: process.env.ADMIN_PASSWORD || "weekendly-team",
  sessionSecret: process.env.SESSION_SECRET || "change-me-in-production",
  // Set to "true" when served over HTTPS so the session cookie is never sent over plain HTTP.
  cookieSecure: process.env.COOKIE_SECURE === "true",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === "production",
};
