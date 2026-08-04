import nodemailer from "nodemailer";

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  try {
    console.log("📧 Sending email to:", to);

    const info = await this.transporter.sendMail({
     from: `"InvoiceFin" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    }); 

    console.log("✅ Email sent successfully");
    console.log(info);
  } catch (error) {
    console.error("❌ Email Error:", error);
    throw error;
  }
}

  async sendVerificationEmail(
    email: string,
    fullName: string,
    otp: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Email Verification</h2>
        <p>Hello ${fullName},</p>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">${otp}</span>
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">InvoiceFin Platform</p>
      </div>
    `;
    await this.sendEmail(email, "Verify Your Email - InvoiceFin", html);
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    otp: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Password Reset</h2>
        <p>Hello ${fullName},</p>
        <p>Your password reset code is:</p>
        <div style="background: #fef2f2; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 8px;">${otp}</span>
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please secure your account.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">InvoiceFin Platform</p>
      </div>
    `;
    await this.sendEmail(email, "Reset Your Password - InvoiceFin", html);
  }

  async sendInvoiceUploadedEmail(
    email: string,
    fullName: string,
    invoiceNumber: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Invoice Uploaded</h2>
        <p>Hello ${fullName},</p>
        <p>Your invoice <strong>${invoiceNumber}</strong> has been uploaded successfully and is pending verification.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">InvoiceFin Platform</p>
      </div>
    `;
    await this.sendEmail(email, `Invoice ${invoiceNumber} Uploaded`, html);
  }

  async sendVerificationStatusEmail(
    email: string,
    fullName: string,
    invoiceNumber: string,
    status: string
  ): Promise<void> {
    const statusColor = status === "verified" ? "#16a34a" : "#dc2626";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColor};">Invoice ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Hello ${fullName},</p>
        <p>Your invoice <strong>${invoiceNumber}</strong> has been <strong>${status}</strong>.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">InvoiceFin Platform</p>
      </div>
    `;
    await this.sendEmail(
      email,
      `Invoice ${invoiceNumber} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html
    );
  }

  async sendFinancingStatusEmail(
    email: string,
    fullName: string,
    status: string,
    amount: number
  ): Promise<void> {
    const statusColor = status === "approved" || status === "funded" ? "#16a34a" : "#dc2626";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColor};">Financing ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Hello ${fullName},</p>
        <p>Your financing request for <strong>₹${amount.toLocaleString("en-IN")}</strong> has been <strong>${status}</strong>.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">InvoiceFin Platform</p>
      </div>
    `;
    await this.sendEmail(
      email,
      `Financing ${status.charAt(0).toUpperCase() + status.slice(1)} - ₹${amount.toLocaleString("en-IN")}`,
      html
    );
  }

  async sendRepaymentReminderEmail(
    email: string,
    fullName: string,
    dueDate: Date,
    amount: number
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Repayment Reminder</h2>
        <p>Hello ${fullName},</p>
        <p>This is a reminder that your repayment of <strong>₹${amount.toLocaleString("en-IN")}</strong> is due on <strong>${dueDate.toLocaleDateString("en-IN")}</strong>.</p>
        <p>Please ensure timely payment to avoid overdue penalties.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">InvoiceFin Platform</p>
      </div>
    `;
    await this.sendEmail(email, "Repayment Reminder - InvoiceFin", html);
  }
}

export default new EmailService();
