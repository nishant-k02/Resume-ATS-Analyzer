export function loadEnvIfNeeded() {
  // only attempt in Node runtime
  if (process.env.ANTHROPIC_API_KEY) return;

  // lazy-load dotenv only when needed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require("dotenv");
  dotenv.config({ path: ".env.production" });
}
