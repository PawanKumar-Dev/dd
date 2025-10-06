import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email";
import { InputValidator } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate all inputs
    const nameValidation = InputValidator.validateName(name, "Name");
    const emailValidation = InputValidator.validateEmail(email);
    const subjectValidation = InputValidator.validateMessage(
      subject,
      "Subject"
    );
    const messageValidation = InputValidator.validateMessage(
      message,
      "Message"
    );

    const allErrors = [
      ...nameValidation.errors,
      ...emailValidation.errors,
      ...subjectValidation.errors,
      ...messageValidation.errors,
    ];

    if (allErrors.length > 0) {
      return NextResponse.json(
        { error: allErrors.join(", ") },
        { status: 400 }
      );
    }

    // Send email to admin with sanitized data
    const adminEmail = process.env.ADMIN_EMAIL || "sales@exceltechnologies.in";
    const emailSent = await EmailService.sendAdminNotification(
      adminEmail,
      `New Contact Form Submission: ${subjectValidation.sanitized}`,
      `You have received a new contact form submission from ${nameValidation.sanitized} (${emailValidation.sanitized}).`,
      {
        name: nameValidation.sanitized,
        email: emailValidation.sanitized,
        subject: subjectValidation.sanitized,
        message: messageValidation.sanitized,
        timestamp: new Date().toISOString(),
      }
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // Send confirmation email to user with sanitized data
    const confirmationEmailSent = await EmailService.sendEmail({
      to: emailValidation.sanitized || email,
      subject: "Thank you for contacting Excel Technologies",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Thank you for contacting us!</h2>
          <p>Hello ${InputValidator.sanitizeHtml(nameValidation.sanitized || name)},</p>
          <p>We have received your message regarding "${InputValidator.sanitizeHtml(
            subjectValidation.sanitized || subject
          )}" and will get back to you within 24 hours.</p>
          <p>Your message:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            ${InputValidator.sanitizeHtml(messageValidation.sanitized || message)}
          </div>
          <p>If you have any urgent questions, please call us at +91-777-888-9674.</p>
          <br>
          <p>Best regards,<br>Excel Technologies Team</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
