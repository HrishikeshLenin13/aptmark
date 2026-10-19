import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
const reservation = net.createServer();
reservation.listen(0, "127.0.0.1");
await once(reservation, "listening");
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    env: {
      ...process.env,
      NEXT_DIST_DIR: ".next-publish",
      CONTENT_PREVIEW: "false",
      DATABASE_PATH: `./data/lesson-publication-${Date.now()}.sqlite`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
child.stdout.on("data", (chunk) => (logs += chunk));
child.stderr.on("data", (chunk) => (logs += chunk));
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw Error(logs);
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert(ready, "Production server must start");
  const session = await fetch(origin + "/api/session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(session.status, 200);
  const cookie = session.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const response = await fetch(origin + "/api/lessons", {
    headers: { Cookie: cookie },
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.preview, false);
  assert.deepEqual(body.lessons, []);
  assert.deepEqual(body.progress, []);
  const check = await fetch(origin + "/api/lessons/check", {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lessonId: "equations-balance", answer: "7" }),
  });
  assert.equal(check.status, 404);
  const deletion = await fetch(origin + "/api/delete-account", {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ confirmation: "DELETE" }),
  });
  assert.equal(deletion.status, 200);
  console.log(
    "production lesson gate: 0 visible; checks=404; isolated account deleted",
  );
} finally {
  if (child.exitCode === null) {
    child.kill("SIGTERM");
    await once(child, "exit");
  }
}
