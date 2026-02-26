import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { transcriptionRoutes } from "./routes/transcriptions.js";
import { paymentRoutes } from "./routes/payments.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { exportRoutes } from "./routes/exports.js";
import { userRoutes } from "./routes/users.js";

const app = express();

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

app.use("/api/webhooks", webhookRoutes);

app.use(express.json({ limit: "10mb" }));

app.use("/api/transcriptions", transcriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/users", userRoutes);

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

export default app;
