export enum UserRole {
  ADMIN = "admin",
  BUSINESS = "business",
}

export enum InvoiceStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  UNDER_VERIFICATION = "under_verification",
  VERIFIED = "verified",
  REJECTED = "rejected",
  FINANCED = "financed",
  CLOSED = "closed",
}

export enum FinancingStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  DISBURSED = "disbursed",
  REPAYMENT = "repayment",
  COMPLETED = "completed",
}

export enum RepaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  PARTIALLY_PAID = "partially_paid",
  OVERDUE = "overdue",
  COMPLETED = "completed",
}

export enum NotificationType {
  IN_APP = "in_app",
  EMAIL = "email",
}

export enum VerificationResult {
  APPROVED = "approved",
  REJECTED = "rejected",
  REQUIRES_CORRECTION = "requires_correction",
}

export enum BusinessVerificationStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
}

export enum ReportFormat {
  PDF = "pdf",
  EXCEL = "excel",
  CSV = "csv",
}

export interface JwtPayload {
  id: string;
}

export interface AuthRequest extends Express.Request {
  user?: {
    id: string;
    role: string;
  };
}
