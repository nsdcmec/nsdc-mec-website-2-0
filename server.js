// server.js (Final, Corrected Version)
import express from "express";
import { exec } from "child_process";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

// --- Basic Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 8080;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.error("FATAL: WEBHOOK_SECRET environment variable must be set.");
  process.exit(1);
}

// --- The Rebuild Function ---
let isBuilding = false;
function runBuild() {
  if (isBuilding) {
    console.log("Build already in progress. Ignoring request.");
    return;
  }
  isBuilding = true;
  console.log("Starting application rebuild...");
  const command = "npm run build";

  exec(command, (error, stdout, stderr) => {
    isBuilding = false;
    if (error) {
      console.error(`Build Error: ${error.message}`);
      return;
    }
    if (stderr) console.error(`Build Stderr: ${stderr}`);
    console.log(`Build Stdout: ${stdout}`);
    console.log("✅ Rebuild successful! The site is updated.");
  });
}

// --- Webhook Endpoint ---
// This must be defined BEFORE the static and fallback handlers.
app.post("/webhook", express.json(), (req, res) => {
  console.log("Webhook received...");
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return res.status(401).send("Signature required.");
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest =
    "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return res.status(401).send("Invalid signature.");
  }

  res.status(202).send("Rebuild process started.");
  runBuild();
});

// --- Static File Serving ---
// This serves all the generated files (css, js, images) from the 'dist' folder.
app.use(express.static(path.join(__dirname, "dist")));

// --- SPA Fallback / Catch-All Route ---
// THE DEFINITIVE FIX IS HERE.
// This uses a regular expression to match every path that is NOT the webhook path.
// It ensures that any navigation attempt is handled by Astro's client-side router.
app.get(/^\/(?!webhook).*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

// --- Initial Build and Server Start ---
console.log("Performing initial build before starting server...");
// We run the build first, and only start the server after it's done.
exec("npm run build", (error, stdout, stderr) => {
  if (error) {
    console.error("FATAL: Initial build failed. Server not starting.", error);
    process.exit(1);
  }
  console.log("Initial build successful!");
  console.log(stdout);

  app.listen(PORT, () => {
    console.log(`Server started and listening on http://localhost:${PORT}`);
  });
});
