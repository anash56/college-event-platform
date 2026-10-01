import express from "express";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "College Event Platform API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

export default app;