import { execSync } from "node:child_process";
import { config } from "dotenv";

/** Syncs the test database schema once before the suite runs (rows are cleared per test). */
export default function setup() {
  config({ path: ".env.test" });
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL belum di-set. Salin .env.test.example ke .env.test dan arahkan ke database PostgreSQL khusus test.",
    );
  }
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
