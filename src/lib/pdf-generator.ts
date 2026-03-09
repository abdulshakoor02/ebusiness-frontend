import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice, Receipt } from "@/lib/schemas";

interface TenantData {
    name?: string;
    email?: string;
    address?: {
        street?: string;
        address_line?: string;
        city?: string;
        state?: string;
        country?: string;
        zip_code?: string;
    };
    logo_url?: string;
}

interface LeadData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    designation?: string;
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    } catch {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }
}

export function generateInvoicePDF(
    invoice: Invoice,
    lead: LeadData,
    tenant: TenantData,
    currency: string = "USD"
): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header - Company Info
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(tenant.name || "Company", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    let yPos = 35;
    if (tenant.address) {
        if (tenant.address.street) {
            doc.text(tenant.address.street, 20, yPos);
            yPos += 5;
        }
        if (tenant.address.address_line) {
            doc.text(tenant.address.address_line, 20, yPos);
            yPos += 5;
        }
        const cityLine = [
            tenant.address.city,
            tenant.address.state,
            tenant.address.zip_code,
            tenant.address.country
        ].filter(Boolean).join(", ");
        if (cityLine) {
            doc.text(cityLine, 20, yPos);
            yPos += 5;
        }
        if (tenant.email) {
            doc.text(tenant.email, 20, yPos);
            yPos += 5;
        }
    }

    // Invoice Title and Details on Right
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth - 20, 25, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const invoiceNum = `INV-${String(invoice.invoice_number).padStart(3, '0')}`;
    doc.text(`Invoice #: ${invoiceNum}`, pageWidth - 20, 35, { align: "right" });
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, pageWidth - 20, 42, { align: "right" });
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, pageWidth - 20, 49, { align: "right" });

    // Status Badge
    const statusY = 58;
    if (invoice.status === "pending" || invoice.status === "partial") {
        doc.setFillColor(220, 53, 69); // Red
        doc.roundedRect(pageWidth - 40, statusY - 3, 30, 7, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text("UNPAID", pageWidth - 25, statusY + 1, { align: "center" });
        doc.setTextColor(0, 0, 0);
    } else {
        doc.setFillColor(40, 167, 69); // Green
        doc.roundedRect(pageWidth - 40, statusY - 3, 30, 7, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text("PAID", pageWidth - 25, statusY + 1, { align: "center" });
        doc.setTextColor(0, 0, 0);
    }

    // Bill To Section
    yPos = 75;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const customerName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || "Customer";
    doc.text(customerName, 20, yPos);
    
    yPos += 5;
    if (lead.designation) {
        doc.text(lead.designation, 20, yPos);
        yPos += 5;
    }
    if (lead.email) {
        doc.text(lead.email, 20, yPos);
        yPos += 5;
    }
    if (lead.phone) {
        doc.text(lead.phone, 20, yPos);
        yPos += 5;
    }

    // Line Items Table
    const tableData = invoice.items.map(item => [
        item.product_name,
        String(item.quantity),
        formatCurrency(item.unit_price, currency),
        formatCurrency(item.total, currency)
    ]);

    autoTable(doc, {
        startY: 115,
        head: [["Item", "Qty", "Unit Price", "Total"]],
        body: tableData,
        theme: "striped",
        headStyles: {
            fillColor: [66, 66, 66],
            textColor: [255, 255, 255],
            fontStyle: "bold"
        },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 25, halign: "center" },
            2: { cellWidth: 35, halign: "right" },
            3: { cellWidth: 35, halign: "right" }
        },
        margin: { left: 20, right: 20 }
    });

    // Summary Section
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    const summaryX = pageWidth - 80;
    doc.setFontSize(10);
    
    doc.text("Subtotal:", summaryX, finalY);
    doc.text(formatCurrency(invoice.subtotal, currency), pageWidth - 20, finalY, { align: "right" });
    
    doc.text("Discount:", summaryX, finalY + 7);
    doc.text(`-${formatCurrency(invoice.discount, currency)}`, pageWidth - 20, finalY + 7, { align: "right" });
    
    doc.text(`Tax (${invoice.tax_percentage}%):`, summaryX, finalY + 14);
    doc.text(formatCurrency(invoice.tax_amount, currency), pageWidth - 20, finalY + 14, { align: "right" });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL:", summaryX, finalY + 24);
    doc.text(formatCurrency(invoice.total_amount, currency), pageWidth - 20, finalY + 24, { align: "right" });

    // Paid Amount
    if (invoice.paid_amount > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Paid:", summaryX, finalY + 34);
        doc.text(formatCurrency(invoice.paid_amount_vat, currency), pageWidth - 20, finalY + 34, { align: "right" });
        
        const remaining = invoice.total_amount - invoice.paid_amount_vat;
        if (remaining > 0) {
            doc.setTextColor(220, 53, 69);
            doc.text("Remaining:", summaryX, finalY + 41);
            doc.text(formatCurrency(remaining, currency), pageWidth - 20, finalY + 41, { align: "right" });
            doc.setTextColor(0, 0, 0);
        }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Thank you for your business!", pageWidth / 2, 280, { align: "center" });

    // Download PDF
    doc.save(`invoice-${invoiceNum}.pdf`);
}

export function generateReceiptPDF(
    receipts: Receipt[],
    currentReceiptIndex: number,
    invoice: Invoice,
    lead: LeadData,
    tenant: TenantData,
    currency: string = "USD"
): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const currentReceipt = receipts[currentReceiptIndex];
    const cumulativeReceipts = receipts.slice(0, currentReceiptIndex + 1);

    // Header - Company Info
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(tenant.name || "Company", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    let yPos = 35;
    if (tenant.address) {
        if (tenant.address.street) {
            doc.text(tenant.address.street, 20, yPos);
            yPos += 5;
        }
        if (tenant.address.city || tenant.address.country) {
            const cityLine = [tenant.address.city, tenant.address.country].filter(Boolean).join(", ");
            doc.text(cityLine, 20, yPos);
            yPos += 5;
        }
        if (tenant.email) {
            doc.text(tenant.email, 20, yPos);
            yPos += 5;
        }
    }

    // Receipt Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("RECEIPT", pageWidth - 20, 25, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const receiptNum = `RCP-${String(currentReceipt.receipt_number).padStart(3, '0')}`;
    doc.text(`Receipt #: ${receiptNum}`, pageWidth - 20, 35, { align: "right" });
    doc.text(`Date: ${new Date(currentReceipt.payment_date).toLocaleDateString()}`, pageWidth - 20, 42, { align: "right" });

    // Invoice Reference
    yPos = 60;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Reference:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const invoiceNum = `INV-${String(invoice.invoice_number).padStart(3, '0')}`;
    doc.text(invoiceNum, 20, yPos + 7);

    // Payment History Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Details:", 20, yPos + 20);

    const tableData = cumulativeReceipts.map((receipt, index) => [
        `Receipt #${String(receipt.receipt_number).padStart(3, '0')}`,
        formatCurrency(receipt.amount_paid, currency),
        `+ ${formatCurrency(receipt.tax_amount, currency)} tax`,
        new Date(receipt.payment_date).toLocaleDateString(),
        index === currentReceiptIndex ? "(Current)" : ""
    ]);

    autoTable(doc, {
        startY: yPos + 25,
        head: [["Receipt #", "Amount", "Tax", "Date", ""]],
        body: tableData,
        theme: "striped",
        headStyles: {
            fillColor: [66, 66, 66],
            textColor: [255, 255, 255],
            fontStyle: "bold"
        },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 30, halign: "right" },
            2: { cellWidth: 30, halign: "right" },
            3: { cellWidth: 35, halign: "center" },
            4: { cellWidth: 30, halign: "center", fontStyle: "bold" }
        },
        margin: { left: 20, right: 20 }
    });

    // Summary Section
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(10);
    
    // Total paid before this receipt
    if (currentReceiptIndex > 0) {
        const previousTotal = cumulativeReceipts
            .slice(0, currentReceiptIndex)
            .reduce((sum, r) => sum + r.total_paid, 0);
        
        doc.text("Previous Payments:", 20, finalY);
        doc.text(formatCurrency(previousTotal, currency), pageWidth - 20, finalY, { align: "right" });
    }
    
    // Current payment
    doc.setFont("helvetica", "bold");
    doc.text("This Payment:", 20, finalY + 10);
    doc.text(formatCurrency(currentReceipt.total_paid, currency), pageWidth - 20, finalY + 10, { align: "right" });

    // Total paid
    const totalPaid = cumulativeReceipts.reduce((sum, r) => sum + r.total_paid, 0);
    doc.setFontSize(12);
    doc.text("Total Paid:", 20, finalY + 22);
    doc.text(formatCurrency(totalPaid, currency), pageWidth - 20, finalY + 22, { align: "right" });

    // Invoice status
    const remaining = invoice.total_amount - invoice.paid_amount_vat;
    if (remaining > 0) {
        doc.setTextColor(220, 53, 69);
        doc.setFontSize(10);
        doc.text(`Remaining: ${formatCurrency(remaining, currency)}`, 20, finalY + 32);
        doc.setTextColor(0, 0, 0);
    } else {
        doc.setTextColor(40, 167, 69);
        doc.setFontSize(10);
        doc.text("Invoice Fully Paid", 20, finalY + 32);
        doc.setTextColor(0, 0, 0);
    }

    // Customer info
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Customer:", 20, finalY + 45);
    doc.setFont("helvetica", "normal");
    const customerName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || "Customer";
    doc.text(customerName, 20, finalY + 52);
    if (lead.email) {
        doc.text(lead.email, 20, finalY + 59);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Thank you for your payment!", pageWidth / 2, 280, { align: "center" });

    // Download PDF
    doc.save(`receipt-${receiptNum}.pdf`);
}
