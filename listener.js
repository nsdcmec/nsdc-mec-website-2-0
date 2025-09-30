import express from "express";
import { exec } from "child_process";
import crypto from "crypto";

const app = express();
const PORT = 9001;

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const DEPLOY_HOOK_URL = process.env.RENDER_DEPLOY_HOOK_URL;

if (!WEBHOOK_SECRET) {
  console.error("FATAL: WEBHOOK_SECRET environment variable must be set.");
  process.exit(1);
}

app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("Webhook received...");

  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return res.status(401).send("Signature required.");
  const hmac = crypto.createHmac("sha26", WEBHOOK_SECRET);
  const digest =
    "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return res.status(401).send("Invalid signature.");
  }

  console.log("Signature verified.");
  res.status(202).send("Update process accepted.");

  if (DEPLOY_HOOK_URL) {
    // RENDER / HOOK STRATEGY
    console.log(`Triggering external deploy hook at: ${DEPLOY_HOOK_URL}`);
    fetch(DEPLOY_HOOK_URL)
      .then((hookRes) => {
        if (!hookRes.ok)
          throw new Error(`Deploy hook failed with status: ${hookRes.status}`);
        console.log("✅ Successfully triggered external deployment.");
      })
      .catch((err) => console.error("Error calling deploy hook:", err));
  } else {
    // COLLEGE / GIT PULL STRATEGY (Default)
    console.log("Starting internal self-update process (git pull)...");
    const command =
      "git pull && npm install --omit=dev && npm run build && chown -R nginx:nginx /app/dist";
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Execution error: ${error.message}`);
        return;
      }
      if (stderr) console.error(`Stderr: ${stderr}`);
      console.log(`Stdout: ${stdout}`);
      console.log("✅ Self-update successful! The site has been rebuilt.");
    });
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Unified webhook listener started on port ${PORT}`);
});
