import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// A local Postgres has no TLS; hosted ones (Supabase, Neon, ...) require it.
const isLocalDb = /@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(databaseUrl);

// On Vercel every function instance opens its own pool, so keep pools small.
// Use Supabase's *transaction pooler* URL (port 6543) for DATABASE_URL there.
const poolMax = Number(process.env.DB_POOL_MAX) || (isLocalDb ? 10 : 5);

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    // Strip sslmode from the URL: recent versions of `pg` treat sslmode=require
    // as "verify the certificate", which fails against Supabase's pooler chain.
    // TLS is configured explicitly through the `ssl` option below instead.
    connectionString: databaseUrl.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, ""),
    max: poolMax,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
