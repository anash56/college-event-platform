import express from "express";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import emailVerificationRoutes from "./routes/email-verification.routes";
import collegeRoutes from "./routes/college.routes";
import clubRoutes from "./routes/club.routes";
import governmentInstitutionRoutes from "./routes/governmentInstitution.routes";



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
app.use(
  "/api/auth/email",
  emailVerificationRoutes
);
app.use("/api/colleges", collegeRoutes);

app.use("/api/clubs", clubRoutes);
app.use(
  "/api/institutions",
  governmentInstitutionRoutes
);

export default app;