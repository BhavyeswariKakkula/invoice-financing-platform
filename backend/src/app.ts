import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

import userRoutes from "./routes/UserRoutes";
import businessProfileRoutes from "./routes/BusinessProfileRoutes";
import invoiceRoutes from "./routes/InvoiceRoutes";
import verificationRoutes from "./routes/VerificationRoutes";
import financingRoutes from "./routes/FinancingRoutes";
import repaymentRoutes from "./routes/RepaymentRoutes";
import notificationRoutes from "./routes/NotificationRoutes";
import dashboardRoutes from "./routes/DashboardRoutes";
import reportRoutes from "./routes/ReportRoutes";
import adminRoutes from "./routes/AdminRoutes";
import taxConfigRoutes from "./routes/TaxConfigRoutes";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { apiRateLimiter } from "./middleware/rateLimiter";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "frame-ancestors": ["'self'", "http://localhost:5173"],
      },
    },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// app.use("/api", apiRateLimiter);

app.use("/api/users", userRoutes);
app.use("/api/business-profile", businessProfileRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/verifications", verificationRoutes);
app.use("/api/financing", financingRoutes);
app.use("/api/repayments", repaymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tax-config", taxConfigRoutes);

app.get("/", (req, res) => {
  res.send("Invoice Financing Platform API is Running...");
});

app.use(notFound);
app.use(errorHandler);

export default app;
