export async function loadEnvIfNeeded() {
  // only attempt in Node runtime
  if (process.env.ANTHROPIC_API_KEY) return;

  // lazy-load dotenv only when needed
  const dotenv = await import("dotenv");
  dotenv.config({ path: ".env.production" });
}
