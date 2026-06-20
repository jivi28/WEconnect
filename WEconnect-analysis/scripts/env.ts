// Load .env for standalone scripts (Next.js loads it automatically at runtime,
// but tsx scripts do not).
import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: false });
