/**
 * The public base URL of the site, used for links in emails, SEO metadata, etc.
 *
 * Resolution order (first match wins):
 *   1. NEXT_PUBLIC_APP_URL           - explicit override (custom domain, or localhost in your local .env;
 *                                      a localhost value is ignored when running on Vercel)
 *   2. Vercel preview deployments    - https://<VERCEL_URL>  (the URL of that specific deployment)
 *   3. Vercel production             - https://<VERCEL_PROJECT_PRODUCTION_URL>  (custom domain if set, else *.vercel.app)
 *   4. Fallback                      - http://localhost:3000
 *
 * Result: emails sent by `npm run dev` link to localhost, emails sent by the
 * deployed site link to the Vercel URL, with no code change between the two.
 * The value comes from server environment variables only (never from request
 * headers), so it can't be spoofed to poison password-reset links.
 */
function normalize(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const LOCAL_URL = /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i;

export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  // On Vercel a localhost value is always a mistake (typically the whole local
  // .env was pasted into the project settings), so it is ignored there.
  const ignoreExplicit = !!explicit && !!process.env.VERCEL && LOCAL_URL.test(explicit);
  if (explicit && !ignoreExplicit) return normalize(explicit);

  const vercelEnv = process.env.VERCEL_ENV;
  const deploymentUrl = process.env.VERCEL_URL;
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (vercelEnv === "preview" && deploymentUrl) return normalize(deploymentUrl);
  if (productionUrl) return normalize(productionUrl);
  if (deploymentUrl) return normalize(deploymentUrl);

  return "http://localhost:3000";
}
