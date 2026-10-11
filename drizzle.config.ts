import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// The connection string comes from the environment, never from this file.
// For `drizzle-kit push` against Supabase, use the *session pooler* URL
// (port 5432) or the direct connection, not the transaction pooler (6543).
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required to run drizzle-kit");
}

const isLocalDb = /@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: url.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, ""),
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
  },
});
