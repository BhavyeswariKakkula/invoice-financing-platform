import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import InvoiceRepository from "../repositories/InvoiceRepository";
import FinancingRequestRepository from "../repositories/FinancingRequestRepository";
import RepaymentRepository from "../repositories/RepaymentRepository";
import RepaymentScheduleRepository from "../repositories/RepaymentScheduleRepository";
import RepaymentService from "../services/RepaymentService";
import BusinessProfileRepository from "../repositories/BusinessProfileRepository";
import PDFDocument from "pdfkit";

class ReportController {
  async getInvoiceReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.role === "admin" ? undefined : req.user!.id;
      const { startDate, endDate, status } = req.query;

      const filter: Record<string, any> = {};
      if (userId) filter.userId = userId;
      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }

      const result = await InvoiceRepository.findAll(filter, 1, 1000);

      res.status(200).json({
        success: true,
        data: {
          reportType: "Invoice Report",
          generatedAt: new Date(),
          totalRecords: result.total,
          records: result.invoices,
        },
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getFinancingReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.role === "admin" ? undefined : req.user!.id;
      const { startDate, endDate, status } = req.query;

      const filter: Record<string, any> = {};
      if (userId) filter.userId = userId;
      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }

      const result = await FinancingRequestRepository.findAll(filter, 1, 1000);

      res.status(200).json({
        success: true,
        data: {
          reportType: "Financing Report",
          generatedAt: new Date(),
          totalRecords: result.total,
          records: result.requests,
        },
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getRepaymentReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.role === "admin" ? undefined : req.user!.id;
      const { startDate, endDate, status } = req.query;

      const filter: Record<string, any> = {};
      if (userId) filter.businessId = userId;
      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }

      const result = await RepaymentRepository.getRepaymentsForReport(filter);

      res.status(200).json({
        success: true,
        data: {
          reportType: "Repayment Report",
          generatedAt: new Date(),
          totalRecords: result.length,
          records: result,
        },
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getBusinessReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, status } = req.query;

      const filter: Record<string, any> = {};
      if (status) filter.verificationStatus = status;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }

      const result = await BusinessProfileRepository.findAll(filter, 1, 1000);

      res.status(200).json({
        success: true,
        data: {
          reportType: "Business Report",
          generatedAt: new Date(),
          totalRecords: result.total,
          records: result.profiles,
        },
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getRevenueReport(req: AuthRequest, res: Response) {
    try {
      const totalFinanced = await FinancingRequestRepository.sumApprovedAmount();
      const totalPaid = await RepaymentRepository.getTotalPaidAmount();
      const totalOutstanding = await RepaymentRepository.getTotalOutstanding();

      res.status(200).json({
        success: true,
        data: {
          reportType: "Revenue Report",
          generatedAt: new Date(),
          totalFinanced,
          totalCollected: totalPaid,
          totalOutstanding,
          revenue: totalPaid,
        },
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAmortizationReport(req: AuthRequest, res: Response) {
    try {
      const isAdmin = req.user!.role === "admin";
      const repayment = await RepaymentService.getRepaymentById(
        String(req.params.id),
        isAdmin ? undefined : req.user!.id,
        isAdmin
      );

      const result = await RepaymentScheduleRepository.getByRepayment(
        String(req.params.id),
        1,
        1000
      );

      res.status(200).json({
        success: true,
        data: {
          reportType: "Amortization Schedule Report",
          generatedAt: new Date(),
          loan: {
            id: repayment.id,
            businessId: repayment.businessId,
            invoiceId: repayment.invoiceId,
            financingId: repayment.financingId,
            status: repayment.status,
            principal: repayment.disbursedAmount,
            annualInterestRate: repayment.annualInterestRate,
            tenureMonths: repayment.tenureMonths,
            emiAmount: repayment.emiAmount,
            totalPayable: repayment.totalPayable,
            totalInterest: repayment.totalInterest,
            outstandingPrincipal: repayment.outstandingPrincipal,
            outstandingInterest: repayment.outstandingInterest,
            principalPaid: repayment.principalPaid,
            interestCollected: repayment.interestCollected,
            lateFeeCollected: repayment.lateFeeCollected,
            emisPaid: repayment.emisPaid,
            nextDueDate: repayment.nextDueDate,
          },
          totalRecords: result.installments.length,
          records: result.installments,
        },
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  async exportAmortizationReport(req: AuthRequest, res: Response) {
    try {
      const isAdmin = req.user!.role === "admin";
      const repayment = await RepaymentService.getRepaymentById(
        String(req.params.id),
        isAdmin ? undefined : req.user!.id,
        isAdmin
      );

      const result = await RepaymentScheduleRepository.getByRepayment(
        String(req.params.id),
        1,
        1000
      );

      const format = (req.query.format as string) || "csv";
      const rows = result.installments.map((s: any) => [
        s.installmentNumber,
        s.dueDate.toISOString().split("T")[0],
        s.principalAmount,
        s.interestAmount,
        s.lateFee || 0,
        s.totalAmount,
        s.status,
        s.paidAmount || 0,
        s.amountPaid || 0,
      ]);

      if (format === "xls") {
        const html = this.buildExcelHtml(repayment, rows);
        res.setHeader("Content-Type", "application/vnd.ms-excel");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=amortization-${String(req.params.id)}.xls`
        );
        res.send(html);
        return;
      }

      if (format === "pdf") {
        const pdf = this.buildPdf(repayment, rows);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=amortization-${String(req.params.id)}.pdf`
        );
        pdf.pipe(res);
        pdf.end();
        return;
      }

      const csv = this.buildCsv(rows);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=amortization-${String(req.params.id)}.csv`
      );
      res.send(csv);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  private buildCsv(rows: any[][]): string {
    const header = [
      "Installment No",
      "Due Date",
      "Principal",
      "Interest",
      "Late Fee",
      "Total Amount",
      "Status",
      "Late Fee Paid",
      "Amount Paid",
    ];
    const lines = [header.join(",")];
    for (const row of rows) {
      lines.push(row.map((v) => `"${v}"`).join(","));
    }
    return lines.join("\n");
  }

  private buildExcelHtml(repayment: any, rows: any[][]): string {
    const header = [
      "Installment No",
      "Due Date",
      "Principal",
      "Interest",
      "Late Fee",
      "Total Amount",
      "Status",
      "Late Fee Paid",
      "Amount Paid",
    ];
    const body = rows
      .map(
        (row) =>
          `<tr>${row.map((v) => `<td>${v}</td>`).join("")}</tr>`
      )
      .join("");
    return `<html><head><meta charset="utf-8"></head><body>
      <h3>Amortization Schedule - Loan ${repayment.id}</h3>
      <p>Principal: ${repayment.disbursedAmount} | Rate: ${repayment.annualInterestRate}% p.a. | Tenure: ${repayment.tenureMonths} months | EMI: ${repayment.emiAmount}</p>
      <table border="1"><tr>${header.map((h) => `<th>${h}</th>`).join("")}</tr>${body}</table>
    </body></html>`;
  }

  private buildPdf(repayment: any, rows: any[][]): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 40 });
    doc.fontSize(16).text("Amortization Schedule", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(10)
      .text(`Loan ID: ${repayment.id}`)
      .text(`Principal: ${repayment.disbursedAmount}`)
      .text(`Rate: ${repayment.annualInterestRate}% p.a.`)
      .text(`Tenure: ${repayment.tenureMonths} months | EMI: ${repayment.emiAmount}`)
      .text(`Status: ${repayment.status}`);
    doc.moveDown();

    const header = [
      "No",
      "Due Date",
      "Principal",
      "Interest",
      "Late Fee",
      "Total",
      "Status",
      "Late Fee Paid",
      "Amount Paid",
    ];
    const tableTop = doc.y;
    const colWidths = [30, 70, 70, 70, 60, 70, 60, 70, 70];
    const rowHeight = 18;

    doc.font("Helvetica-Bold").fontSize(9);
    let x = 40;
    header.forEach((h, i) => {
      doc.text(h, x, tableTop, { width: colWidths[i] });
      x += colWidths[i];
    });

    doc.font("Helvetica").fontSize(8);
    let y = tableTop + rowHeight;
    for (const row of rows) {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }
      x = 40;
      row.forEach((v, i) => {
        doc.text(String(v), x, y, { width: colWidths[i] });
        x += colWidths[i];
      });
      y += rowHeight;
    }

    return doc;
  }
}

export default new ReportController();
