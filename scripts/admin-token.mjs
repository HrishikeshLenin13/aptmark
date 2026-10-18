import fs from "node:fs";
import crypto from "node:crypto";
const file = ".env.local";
const source = fs.existsSync(file)
  ? fs.readFileSync(file, "utf8")
  : fs.readFileSync(".env.example", "utf8");
if (/^ADMIN_TOKEN=.+$/m.test(source)) {
  console.log("An administrator token is already configured. No changes made.");
  process.exit(0);
}
const token = crypto.randomBytes(32).toString("hex");
fs.writeFileSync(
  file,
  source.replace(/^ADMIN_TOKEN=.*$/m, "ADMIN_TOKEN=" + token),
  { mode: 0o600 },
);
fs.chmodSync(file, 0o600);
console.log(
  "Administrator token saved to the ignored .env.local file. Read it locally when opening Content studio.",
);
