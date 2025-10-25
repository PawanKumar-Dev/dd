import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import jsPDF from "jspdf";
import { formatIndianDate } from "@/lib/dateUtils";

// Force dynamic rendering - required for API routes
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const order = await Order.findOne({ _id: params.id }).populate(
      "userId",
      "firstName lastName email",
      User
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Generate PDF invoice
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Colors
    const primaryColor = [59, 130, 246]; // Blue
    const darkGray = [55, 65, 81]; // Dark gray
    const lightGray = [156, 163, 175]; // Light gray
    const green = [34, 197, 94]; // Green for success
    const red = [239, 68, 68]; // Red for failed

    // Header with background
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, pageWidth, 40, "F");

    // Company name
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont("helvetica", "bold");
    pdf.text("Excel Technologies", pageWidth / 2, 20, { align: "center" });

    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("Domain Management System", pageWidth / 2, 30, {
      align: "center",
    });

    // Invoice title
    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("INVOICE", pageWidth / 2, 55, { align: "center" });

    // Invoice number
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text(`#${order.invoiceNumber || order.orderId}`, pageWidth / 2, 65, {
      align: "center",
    });

    // Invoice details section
    const invoiceDetailsY = 80;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(20, invoiceDetailsY, pageWidth - 40, 50, "F");

    // Left side - Bill To
    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Bill To:", 30, invoiceDetailsY + 15);

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    const customer = order.userId as any;
    if (customer) {
      pdf.text(
        `${customer.firstName} ${customer.lastName}`,
        30,
        invoiceDetailsY + 25
      );
      pdf.text(customer.email, 30, invoiceDetailsY + 35);
    } else {
      pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      pdf.text("Customer information not available", 30, invoiceDetailsY + 25);
    }

    // Right side - Invoice Details
    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Invoice Details:", pageWidth - 120, invoiceDetailsY + 15);

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Order ID: ${order.orderId}`,
      pageWidth - 120,
      invoiceDetailsY + 25
    );
    pdf.text(
      `Date: ${formatIndianDate(order.createdAt)}`,
      pageWidth - 120,
      invoiceDetailsY + 35
    );

    // Status badge
    const statusColor = order.status === "completed" ? green : red;
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.rect(pageWidth - 120, invoiceDetailsY + 40, 30, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      order.status.toUpperCase(),
      pageWidth - 105,
      invoiceDetailsY + 45,
      { align: "center" }
    );

    // Domain details table
    const tableY = invoiceDetailsY + 70;
    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Domain Details", 20, tableY);

    // Table header
    const tableHeaderY = tableY + 15;
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(20, tableHeaderY, pageWidth - 40, 12, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");

    // Better column positioning for A4 page
    const colPositions = [25, 120, 150, 170, 190, 210];
    const colWidths = [90, 25, 25, 25, 25, 20];

    pdf.text("Domain Name", colPositions[0], tableHeaderY + 8);
    pdf.text("Period", colPositions[1], tableHeaderY + 8);
    pdf.text("Qty", colPositions[2], tableHeaderY + 8);
    pdf.text("Unit Price", colPositions[3], tableHeaderY + 8);
    pdf.text("Total", colPositions[4], tableHeaderY + 8);
    pdf.text("Status", colPositions[5], tableHeaderY + 8);

    // Table rows
    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    pdf.setFont("helvetica", "normal");
    let currentY = tableHeaderY + 12;

    order.domains.forEach((domain: any, index: number) => {
      if (currentY > pageHeight - 50) {
        pdf.addPage();
        currentY = 20;
      }

      // Alternate row background
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(20, currentY - 2, pageWidth - 40, 10, "F");
      }

      pdf.setFontSize(9);

      // Domain name (left aligned)
      pdf.text(domain.domainName, colPositions[0], currentY);

      // Period (center aligned)
      pdf.text(
        `${domain.registrationPeriod} year${
          domain.registrationPeriod !== 1 ? "s" : ""
        }`,
        colPositions[1] + colWidths[1] / 2,
        currentY,
        { align: "center" }
      );

      // Quantity (center aligned) - Always 1 for domains
      pdf.text("1", colPositions[2] + colWidths[2] / 2, currentY, {
        align: "center",
      });

      // Unit price (right aligned)
      pdf.text(
        `₹${domain.price.toFixed(2)}`,
        colPositions[3] + colWidths[3],
        currentY,
        { align: "right" }
      );

      // Total (right aligned)
      pdf.text(
        `₹${(domain.price * domain.registrationPeriod).toFixed(2)}`,
        colPositions[4] + colWidths[4],
        currentY,
        { align: "right" }
      );

      // Status with color (center aligned)
      const statusColor = domain.status === "registered" ? green : red;
      pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.rect(colPositions[5] + 2, currentY - 2, 16, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        domain.status === "registered" ? "Success" : "Failed",
        colPositions[5] + 10,
        currentY,
        { align: "center" }
      );
      pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

      currentY += 10;
    });

    // Order total - use stored values from order if available
    const total =
      order.amount ||
      order.domains
        .filter((d: any) => d.status === "registered")
        .reduce(
          (total: number, domain: any) =>
            total + domain.price * domain.registrationPeriod,
          0
        );

    const summaryY = Math.max(currentY + 20, pageHeight - 80);

    // Summary box with better positioning
    const summaryWidth = 100;
    const summaryHeight = 50;
    const summaryX = pageWidth - summaryWidth - 20;

    pdf.setFillColor(248, 250, 252);
    pdf.rect(summaryX, summaryY, summaryWidth, summaryHeight, "F");
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(summaryX, summaryY, summaryWidth, summaryHeight, "S");

    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Order Summary", summaryX + summaryWidth / 2, summaryY + 10, {
      align: "center",
    });

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    // Total
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total:`, summaryX + 5, summaryY + 20);
    pdf.text(
      `₹${total.toFixed(2)} ${order.currency}`,
      summaryX + summaryWidth - 5,
      summaryY + 20,
      { align: "right" }
    );

    // GST Note
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.text(
      "*All prices include 18% GST",
      summaryX + summaryWidth - 5,
      summaryY + 30,
      { align: "right" }
    );

    // Footer
    pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "Thank you for choosing Excel Technologies!",
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" }
    );
    pdf.text(
      "For support: support@exceltechnologies.com",
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" }
    );

    // Generate PDF buffer
    const pdfBuffer = pdf.output("arraybuffer");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${
          order.invoiceNumber || order.orderId
        }.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate invoice PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
