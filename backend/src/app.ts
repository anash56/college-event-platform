import express from "express";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import emailVerificationRoutes from "./routes/email-verification.routes";
import clubRoutes from "./routes/club.routes";
import governmentInstitutionRoutes from "./routes/governmentInstitution.routes";
import collegeApplicationRoutes from "./routes/collegeApplication.routes";
import collegeAdminInvitationRoutes from "./routes/college-admin-invitation.routes";
import venueRoutes from "./routes/venue.routes";
import eventRoutes from "./routes/event.routes";
import registrationRoutes from "./routes/registration.routes";

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

app.use("/api/clubs", clubRoutes);
app.use(
  "/api/institutions",
  governmentInstitutionRoutes
);

app.use("/api/college-applications", collegeApplicationRoutes);

app.use(
  "/api/college-admin-invitations",
  collegeAdminInvitationRoutes
);
app.use("/api/venues", venueRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/registrations", registrationRoutes);

export default app;