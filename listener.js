// listener.js
import express from "express";
import { exec } from "child_process";
import crypto from "crypto";

const app = express();
const PORT = 9001;
const WEBHOOK_SECRET = "your-super-secret-string"; // IMPORTANT: Keep this the same

app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("Webhook received...");

  // --- Security Check ---
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    return res.status(401).send("Signature required.");
  }

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest =
    "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");

  // Use crypto.timingSafeEqual to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return res.status(401).send("Invalid signature.");
  }

  console.log("Signature verified. Starting deployment process...");

  // --- Execution Command ---
  const command = " npm install && npm run build";

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error.message}`);
      return res.status(500).send(`Deployment failed: ${error.message}`);
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }
    console.log(`Stdout: ${stdout}`);
    console.log("✅ Deployment successful! The site has been updated.");
    res.status(200).send("Deployment successful!");
  });
});

app.listen(PORT, () => {
  console.log(`Webhook listener started on port ${PORT}`);
});
