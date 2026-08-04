import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import InvoiceRepository from "../repositories/InvoiceRepository";
import { IInvoice } from "../interface/IInvoice";
import { generateInvoiceNumber } from "../utils/helpers";
import { AppError } from "../middleware/errorHandler";
import { cacheService } from "./RedisService";
import emailService from "./EmailService";
import UserRepository from "../repositories/UserRepository";
import notificationService from "./NotificationService";
import TaxConfigRepository from "../repositories/TaxConfigRepository";
import InvoiceModel from "../models/Invoice";
import BusinessProfileRepository from "../repositories/BusinessProfileRepository";

const INVOICES_DIR = path.join(__dirname, "../../uploads/invoices");

const normalizeInvoiceFileUrl = (invoiceFile?: string) => {
  if (!invoiceFile) return undefined;
  if (invoiceFile.startsWith("/uploads/")) return invoiceFile;
  const filename = invoiceFile.split(/[/\\]/).pop();
  return filename ? `/uploads/invoices/${filename}` : invoiceFile;
};

const normalizeInvoice = (invoice: any) => {
  if (!invoice) return invoice;
  const obj = typeof invoice.toObject === "function" ? invoice.toObject() : invoice;
  return {
    ...obj,
    invoiceFile: normalizeInvoiceFileUrl(obj.invoiceFile),
  };
};

const generateInvoicePdf = (
  invoiceNumber: string,
  data: {
    buyerName: string;
    buyerCompany: string;
    invoiceDate: string;
    dueDate: string;
    invoiceAmount: number;
    taxPercentage: number;
    taxAmount: number;
    totalAmount: number;
  }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const filename = `generated-invoice-${invoiceNumber}-${Date.now()}.pdf`;
    const filePath = path.join(INVOICES_DIR, filename);

    if (!fs.existsSync(INVOICES_DIR)) {
      fs.mkdirSync(INVOICES_DIR, { recursive: true });
    }

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    stream.on("finish", () => {
      const url = `/uploads/invoices/${filename}`;
      resolve(url);
    });
    stream.on("error", reject);

    doc.pipe(stream);

    // Company header
    doc.fontSize(22).font("Helvetica-Bold").text("Invoice Financing Platform", { align: "center" });
    doc.fontSize(10).font("Helvetica").text("123 Business Park, Financial District, Mumbai - 400001", { align: "center" });
    doc.text("GST: 27AABCS1234B1Z6 | Email: finance@invoicefinancing.com", { align: "center" });
    doc.moveDown(1.5);

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#cccccc");
    doc.moveDown(1);

    // Invoice title
    doc.fontSize(18).font("Helvetica-Bold").text("INVOICE", { align: "right" });
    doc.moveDown(0.5);

    // Invoice number
    doc.fontSize(12).font("Helvetica-Bold").text(`Invoice #: `, { continued: true })
      .font("Helvetica").text(invoiceNumber);
    doc.moveDown(0.3);

    // Dates
    doc.fontSize(11).font("Helvetica-Bold").text(`Invoice Date: `, { continued: true })
      .font("Helvetica").text(data.invoiceDate);
    doc.fontSize(11).font("Helvetica-Bold").text(`Due Date: `, { continued: true })
      .font("Helvetica").text(data.dueDate);
    doc.moveDown(1);

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#cccccc");
    doc.moveDown(1);

    // Bill To
    doc.fontSize(12).font("Helvetica-Bold").text("Bill To:");
    doc.fontSize(11).font("Helvetica").text(data.buyerName);
    doc.text(data.buyerCompany);
    doc.moveDown(1.5);

    // Table header
    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 20).fill("#2563eb");
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("Description", 60, tableTop + 5, { width: 200 });
    doc.text("Rate (INR)", 260, tableTop + 5, { width: 80, align: "right" });
    doc.text("Amount (INR)", 420, tableTop + 5, { width: 120, align: "right" });

    doc.fillColor("#000000");
    doc.moveDown(0.5);

    // Table row
    const rowY = doc.y;
    doc.rect(50, rowY, 495, 25).fill("#f9fafb");
    doc.fontSize(10).font("Helvetica").fillColor("#000000");
    doc.text("Invoice Amount", 60, rowY + 7);
    doc.text(data.invoiceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }), 260, rowY + 7, { width: 80, align: "right" });
    doc.text(data.invoiceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }), 420, rowY + 7, { width: 120, align: "right" });

    doc.moveDown(0.2);

    if (data.taxPercentage > 0) {
      const taxRowY = doc.y;
      doc.fontSize(10).font("Helvetica");
      doc.text(`Tax (${data.taxPercentage}%)`, 60, taxRowY + 7);
      doc.text("", 260, taxRowY + 7, { width: 80, align: "right" });
      doc.text(data.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }), 420, taxRowY + 7, { width: 120, align: "right" });
      doc.moveDown(0.2);
    }

    // Total row
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#cccccc");
    doc.moveDown(0.5);

    const totalRowY = doc.y;
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Total Amount", 60, totalRowY + 7);
    doc.text(data.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }), 420, totalRowY + 7, { width: 120, align: "right" });

    doc.moveDown(2);

    // Footer
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#cccccc");
    doc.moveDown(0.5);
    doc.fontSize(8).font("Helvetica").fillColor("#888888");
    doc.text("This is a system-generated invoice. Thank you for your business.", { align: "center" });

    doc.end();
  });
};

class InvoiceService {
  async createInvoice(userId: string, invoiceData: Partial<IInvoice>, file?: Express.Multer.File) {
    const profile = await BusinessProfileRepository.findByUserId(userId);
    if (!profile || profile.verificationStatus !== "verified") {
      throw new AppError("Company profile must be submitted and verified before creating invoices", 400);
    }

    const invoiceNumber = generateInvoiceNumber();

    let taxPercentage = Number(invoiceData.taxPercentage) || 0;

    const activeTax = await TaxConfigRepository.findActive();
    if (activeTax && !invoiceData.taxPercentage) {
      taxPercentage = activeTax.taxPercentage;
    }

    const invoiceAmount = Number(invoiceData.invoiceAmount || 0);
    const taxAmount = (invoiceAmount * taxPercentage) / 100;
    const totalAmount = invoiceAmount + taxAmount;

    const invoice = await InvoiceRepository.createInvoice({
      ...invoiceData,
      userId: userId as any,
      invoiceNumber,
      taxPercentage,
      taxAmount,
      totalAmount,
      invoiceFile: undefined,
      status: "draft",
    });

    // Generate invoice PDF
    const pdfUrl = await generateInvoicePdf(invoiceNumber, {
      buyerName: invoice.buyerName,
      buyerCompany: invoice.buyerCompany,
      invoiceDate: invoice.invoiceDate.toISOString().split("T")[0],
      dueDate: invoice.dueDate.toISOString().split("T")[0],
      invoiceAmount,
      taxPercentage,
      taxAmount,
      totalAmount,
    });

    // If user also uploaded a file, keep it as attachment reference
    const uploadFileUrl = file ? `/uploads/invoices/${file.filename}` : undefined;

    const updated = await InvoiceRepository.updateById(invoice._id.toString(), {
      invoiceFile: pdfUrl,
      ...(uploadFileUrl ? { uploadedAttachment: uploadFileUrl } : {}),
    } as any);

    await cacheService.del(`invoices:${userId}`);
    await cacheService.del(`dashboard:${userId}`);
    await cacheService.del(`dashboard:admin`);

    return normalizeInvoice(updated);
  }

  async getInvoiceById(invoiceId: string, userId?: string) {
    const invoice = await InvoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (userId && invoice.userId.toString() !== userId) {
      throw new AppError("Access denied", 403);
    }

    return normalizeInvoice(invoice);
  }

  async updateInvoice(
    invoiceId: string,
    userId: string,
    updateData: Partial<IInvoice>
  ) {
    const invoice = await InvoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.userId.toString() !== userId) {
      throw new AppError("Access denied", 403);
    }

    if (!["draft", "rejected", "requires_correction"].includes(invoice.status)) {
      throw new AppError("Cannot update invoice in current status", 400);
    }

    // Recalculate if invoice amount or tax percentage changed
    let recalc = { ...updateData };
    const newAmount = recalc.invoiceAmount ?? invoice.invoiceAmount;
    const newTaxPct = recalc.taxPercentage ?? invoice.taxPercentage;
    if (recalc.invoiceAmount !== undefined || recalc.taxPercentage !== undefined) {
      const taxAmt = (Number(newAmount) * Number(newTaxPct)) / 100;
      recalc.taxAmount = taxAmt;
      recalc.totalAmount = Number(newAmount) + taxAmt;
    }

    const updated = await InvoiceRepository.updateById(invoiceId, recalc);

    await cacheService.del(`invoices:${userId}`);
    await cacheService.del(`invoice:${invoiceId}`);

    return normalizeInvoice(updated);
  }

  async deleteInvoice(invoiceId: string, userId: string) {
    const invoice = await InvoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.userId.toString() !== userId) {
      throw new AppError("Access denied", 403);
    }

    if (invoice.status !== "draft") {
      throw new AppError("Only draft invoices can be deleted", 400);
    }

    await InvoiceRepository.deleteById(invoiceId);

    await cacheService.del(`invoices:${userId}`);
    await cacheService.del(`dashboard:${userId}`);
    await cacheService.del(`dashboard:admin`);

    return { message: "Invoice deleted successfully" };
  }

  async submitInvoice(invoiceId: string, userId: string) {
    const updated = await InvoiceModel.findOneAndUpdate(
      {
        _id: invoiceId,
        userId,
        status: { $in: ["draft", "requires_correction"] },
      },
      { $set: { status: "submitted", submittedAt: new Date() } },
      { new: true }
    );

    if (!updated) {
      throw new AppError("Invoice not found or cannot be submitted in current status", 400);
    }

    try {
      await notificationService.sendInvoiceSubmittedNotification(
        userId,
        updated.invoiceNumber,
        invoiceId
      );
    } catch (e) {
      console.error("Failed to create invoice submitted notification:", e);
    }

    const user = await UserRepository.findById(userId);
    if (user) {
      try {
        await emailService.sendInvoiceUploadedEmail(
          user.email,
          user.fullName,
          updated.invoiceNumber
        );
      } catch (e) {
        console.error("Failed to send invoice email:", e);
      }
    }

    await cacheService.del(`invoices:${userId}`);
    await cacheService.del(`dashboard:${userId}`);
    await cacheService.del(`dashboard:admin`);

    return normalizeInvoice(updated);
  }

  async getUserInvoices(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string
  ) {
    const filter: Record<string, any> = {};

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { buyerName: { $regex: search, $options: "i" } },
        { buyerCompany: { $regex: search, $options: "i" } },
      ];
    }

    const result = await InvoiceRepository.findByUser(userId, filter, page, limit);
    return {
      ...result,
      invoices: result.invoices.map(normalizeInvoice),
    };
  }

  async getAllInvoices(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string
  ) {
    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: "draft" };
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { buyerName: { $regex: search, $options: "i" } },
        { buyerCompany: { $regex: search, $options: "i" } },
      ];
    }

    const result = await InvoiceRepository.findAll(filter, page, limit);
    return {
      ...result,
      invoices: result.invoices.map(normalizeInvoice),
    };
  }

  async getInvoiceStats(userId?: string) {
    const totalInvoices = userId
      ? await InvoiceRepository.countByUser(userId)
      : await InvoiceRepository.countDocuments();

    const draft = await InvoiceRepository.countByStatus("draft");
    const submitted = await InvoiceRepository.countByStatus("submitted");
    const underVerification = await InvoiceRepository.countByStatus("under_verification");
    const verified = await InvoiceRepository.countByStatus("verified");
    const rejected = await InvoiceRepository.countByStatus("rejected");
    const requiresCorrection = await InvoiceRepository.countByStatus("requires_correction");
    const financed = await InvoiceRepository.countByStatus("financed");
    const closed = await InvoiceRepository.countByStatus("closed");

    const totalFinanced = userId
      ? await InvoiceRepository.sumByUser(userId, "financed")
      : 0;

    const statusDistribution = await InvoiceRepository.getStatusDistribution(userId);
    const monthlyFinancing = await InvoiceRepository.getMonthlyFinancing(userId);

    return {
      totalInvoices,
      draft,
      submitted,
      underVerification,
      verified,
      rejected,
      requiresCorrection,
      financed,
      closed,
      totalFinanced,
      statusDistribution,
      monthlyFinancing,
    };
  }
}

export default new InvoiceService();
