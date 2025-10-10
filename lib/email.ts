import nodemailer from "nodemailer";
import { formatIndianDate, formatIndianDateTime } from "./dateUtils";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL;
const FROM_NAME = process.env.FROM_NAME;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
  throw new Error("Email configuration is missing");
}

// Create transporter function (lazy loading)
async function createTransporter() {
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || "587"),
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Test the connection
    await transporter.verify();
    return transporter;
  } catch (error) {
    console.error("Failed to create email transporter:", error);
    throw new Error("Email transporter configuration failed");
  }
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = await createTransporter();

      const mailOptions = {
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Email sending error:", error);
      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(
    userEmail: string,
    userName: string
  ): Promise<boolean> {
    const subject = "Welcome to Excel Technologies Domain Management!";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to Excel Technologies Domain Management!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for creating an account with us. You can now:</p>
        <ul>
          <li>Search for available domains</li>
          <li>Purchase domains securely</li>
          <li>Manage your DNS records</li>
          <li>Track your domain portfolio</li>
        </ul>
        <p>Get started by visiting your <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color: #3b82f6;">dashboard</a>.</p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <br>
        <p>Best regards,<br>Excel Technologies Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send domain purchase confirmation email
   */
  static async sendDomainPurchaseEmail(
    userEmail: string,
    userName: string,
    domains: Array<{ domainName: string; price: number; status: string }>,
    totalAmount: number
  ): Promise<boolean> {
    const subject = "Domain Purchase Confirmation";
    const domainList = domains
      .map(
        (domain) =>
          `<li>${domain.domainName} - ₹${domain.price} (${domain.status})</li>`
      )
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Domain Purchase Confirmation</h2>
        <p>Hello ${userName},</p>
        <p>Your domain purchase has been processed successfully!</p>
        <h3>Purchase Details:</h3>
        <ul>
          ${domainList}
        </ul>
        <p><strong>Total Amount: ₹${totalAmount}</strong></p>
        <p>You can manage your domains from your <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color: #3b82f6;">dashboard</a>.</p>
        <p>Thank you for choosing our service!</p>
        <br>
        <p>Best regards,<br>Excel Technologies Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send domain registration success email
   */
  static async sendDomainRegistrationEmail(
    userEmail: string,
    userName: string,
    domains: Array<{ domainName: string; expiresAt: Date }>
  ): Promise<boolean> {
    const subject = "Domain Registration Successful";
    const domainList = domains
      .map(
        (domain) =>
          `<li>${domain.domainName} - Expires: ${formatIndianDate(
            domain.expiresAt
          )}</li>`
      )
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Domain Registration Successful!</h2>
        <p>Hello ${userName},</p>
        <p>Great news! Your domains have been successfully registered:</p>
        <ul>
          ${domainList}
        </ul>
        <p>You can now manage your DNS records and domain settings from your <a href="${process.env.NEXTAUTH_URL}/domain-management" style="color: #3b82f6;">domain management panel</a>.</p>
        <p>If you need any assistance with your domains, our support team is here to help!</p>
        <br>
        <p>Best regards,<br>Excel Technologies Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send domain registration failure email
   */
  static async sendDomainRegistrationFailureEmail(
    userEmail: string,
    userName: string,
    domains: Array<{ domainName: string; error: string }>
  ): Promise<boolean> {
    const subject = "Domain Registration Issue";
    const domainList = domains
      .map((domain) => `<li>${domain.domainName} - Error: ${domain.error}</li>`)
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Domain Registration Issue</h2>
        <p>Hello ${userName},</p>
        <p>We encountered some issues while registering your domains:</p>
        <ul>
          ${domainList}
        </ul>
        <p>Our team has been notified and will investigate the issue. You will receive a refund for any failed registrations.</p>
        <p>If you have any questions, please contact our support team immediately.</p>
        <br>
        <p>Best regards,<br>Excel Technologies Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string
  ): Promise<boolean> {
    const subject = "Password Reset Request";
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Excel Technologies Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send order confirmation email with invoice
   */
  static async sendOrderConfirmationEmail(
    userEmail: string,
    userName: string,
    orderData: {
      orderId: string;
      invoiceNumber: string;
      amount: number;
      subtotal?: number;
      gstRate?: number;
      gstAmount?: number;
      currency: string;
      successfulDomains: Array<{
        domainName: string;
        price: number;
        registrationPeriod: number;
      }>;
      paymentId: string;
      createdAt: Date;
    }
  ): Promise<boolean> {
    // Determine email subject and status based on registration results
    const hasSuccessfulDomains = orderData.successfulDomains.length > 0;

    let subject: string;
    let statusMessage: string;
    let headerColor: string;
    let headerTitle: string;

    if (hasSuccessfulDomains) {
      // Complete success
      subject = `Order Confirmation - ${orderData.invoiceNumber}`;
      statusMessage =
        "Your order has been processed successfully. All domains have been registered.";
      headerColor = "#10b981"; // Green
      headerTitle = "Order Confirmation";
    } else {
      // Complete failure
      subject = `Order Failed - ${orderData.invoiceNumber}`;
      statusMessage =
        "We encountered issues while processing your order. None of the domains could be registered.";
      headerColor = "#ef4444"; // Red
      headerTitle = "Order Failed";
    }

    const successfulDomainsList = orderData.successfulDomains
      .map(
        (domain) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
            domain.domainName
          }</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${
            domain.registrationPeriod
          } year${domain.registrationPeriod !== 1 ? "s" : ""}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">1</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${domain.price.toFixed(
            2
          )}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(
            domain.price * domain.registrationPeriod
          ).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const subtotal =
      orderData.subtotal ||
      orderData.successfulDomains.reduce(
        (total, domain) => total + domain.price * domain.registrationPeriod,
        0
      );

    // Use GST from order if available, otherwise calculate it
    const gstRate = orderData.gstRate || 18;
    const gstAmount =
      orderData.gstAmount ||
      Math.round(((subtotal * gstRate) / 100) * 100) / 100;
    const total = orderData.amount || subtotal + gstAmount;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${headerColor}, ${headerColor}dd); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">${headerTitle}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${
            hasSuccessfulDomains
              ? "Thank you for your purchase!"
              : "We apologize for the inconvenience."
          }</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello ${userName},</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">${statusMessage}</p>

          <!-- Order Information -->
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">Order Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 150px;">Order ID:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">${
                  orderData.orderId
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Invoice Number:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">${
                  orderData.invoiceNumber
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Payment ID:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">${
                  orderData.paymentId
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Order Date:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">${formatIndianDateTime(
                  orderData.createdAt
                )}</td>
              </tr>
            </table>
          </div>

          <!-- Domain Details -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">Domain Details</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Domain Name</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Period</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Unit Price</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${successfulDomainsList}
              </tbody>
            </table>
          </div>

          <!-- Summary -->
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Subtotal:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1f2937;">₹${subtotal.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">GST (${gstRate}%):</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1f2937;">₹${gstAmount.toFixed(
                  2
                )}</td>
              </tr>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 18px; font-weight: 700; color: #1f2937;">Total:</td>
                <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: 700; color: #1f2937;">₹${total.toFixed(
                  2
                )} ${orderData.currency}</td>
              </tr>
            </table>
          </div>

          <!-- Status Messages -->
          ${
            orderData.successfulDomains.length > 0
              ? `
            <div style="background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #065f46; font-weight: 600;">✅ ${orderData.successfulDomains.length} domain(s) registered successfully!</p>
            </div>
          `
              : ""
          }
          


          <!-- Action Buttons -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.NEXTAUTH_URL
            }/dashboard" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px; font-weight: 600;">View Dashboard</a>
            <a href="${
              process.env.NEXTAUTH_URL
            }/" style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px; font-weight: 600;">Visit Homepage</a>
          </div>

          <!-- Support Information -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Need help? Contact our support team:</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">Email: <a href="mailto:support@exceltechnologies.com" style="color: #3b82f6;">support@exceltechnologies.com</a></p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Thank you for choosing Excel Technologies!</p>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send admin notification email
   */
  static async sendAdminNotification(
    adminEmail: string,
    subject: string,
    message: string,
    data?: any
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Admin Notification</h2>
        <p>${message}</p>
        ${
          data
            ? `<pre style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto;">${JSON.stringify(
                data,
                null,
                2
              )}</pre>`
            : ""
        }
        <p>Please check your admin panel for more details.</p>
        <br>
        <p>Excel Technologies</p>
      </div>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `[Admin] ${subject}`,
      html,
    });
  }

  /**
   * Send account activation email
   */
  static async sendActivationEmail(
    userEmail: string,
    userName: string,
    activationToken: string
  ): Promise<boolean> {
    const activationUrl = `${
      process.env.APP_URL || "http://localhost:3000"
    }/activate?token=${activationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activate Your Account - Excel Technologies</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">🎉 Welcome to Excel Technologies!</h1>
            <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">Activate your account to get started</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: #ffffff; font-size: 32px;">✓</span>
              </div>
              <h2 style="color: #374151; margin: 0 0 10px 0; font-size: 20px;">Account Created Successfully!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px;">Hi ${userName}, your account has been created and is ready for activation.</p>
            </div>
            
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #0369a1; margin: 0 0 15px 0; font-size: 16px;">🔐 Account Activation Required</h3>
              <p style="color: #0c4a6e; margin: 0; line-height: 1.5;">
                To complete your registration and access your dashboard, please click the activation button below. 
                This ensures the security of your account and verifies your email address.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                Activate My Account
              </a>
            </div>
            
            <div style="background-color: #f9fafb; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
              <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Can't click the button?</p>
              <p style="color: #6b7280; margin: 0; font-size: 14px; word-break: break-all;">
                Copy and paste this link into your browser:<br>
                <span style="color: #3b82f6;">${activationUrl}</span>
              </p>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 14px;">⏰ Important Notes</h4>
              <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
                <li>This activation link will expire in 24 hours</li>
                <li>If the link expires, you can request a new one from the login page</li>
                <li>Keep your login credentials secure and don't share them</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Once activated, you'll be able to:
              </p>
              <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px; flex-wrap: wrap;">
                <div style="text-align: center;">
                  <div style="width: 40px; height: 40px; background: #dbeafe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                    <span style="color: #3b82f6; font-size: 18px;">🌐</span>
                  </div>
                  <p style="color: #374151; margin: 0; font-size: 12px; font-weight: bold;">Search Domains</p>
                </div>
                <div style="text-align: center;">
                  <div style="width: 40px; height: 40px; background: #dbeafe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                    <span style="color: #3b82f6; font-size: 18px;">🛒</span>
                  </div>
                  <p style="color: #374151; margin: 0; font-size: 12px; font-weight: bold;">Manage Cart</p>
                </div>
                <div style="text-align: center;">
                  <div style="width: 40px; height: 40px; background: #dbeafe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                    <span style="color: #3b82f6; font-size: 18px;">📊</span>
                  </div>
                  <p style="color: #374151; margin: 0; font-size: 12px; font-weight: bold;">View Dashboard</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              This email was sent to ${userEmail}. If you didn't create an account, please ignore this email.
            </p>
            <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">
              © 2024 Excel Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: "🎉 Activate Your Account - Excel Technologies",
      html,
    });
  }
}
