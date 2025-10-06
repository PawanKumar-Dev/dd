import nodemailer from "nodemailer";

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
      port: parseInt(SMTP_PORT || '587'),
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
          `<li>${
            domain.domainName
          } - Expires: ${domain.expiresAt.toLocaleDateString()}</li>`
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
      currency: string;
      successfulDomains: Array<{
        domainName: string;
        price: number;
        registrationPeriod: number;
      }>;
      failedDomains: Array<{
        domainName: string;
        error: string;
      }>;
      paymentId: string;
      createdAt: Date;
    }
  ): Promise<boolean> {
    // Determine email subject and status based on registration results
    const hasSuccessfulDomains = orderData.successfulDomains.length > 0;
    const hasFailedDomains = orderData.failedDomains.length > 0;

    let subject: string;
    let statusMessage: string;
    let headerColor: string;
    let headerTitle: string;

    if (hasSuccessfulDomains && hasFailedDomains) {
      // Partial success
      subject = `Order Partially Completed - ${orderData.invoiceNumber}`;
      statusMessage =
        "Your order has been partially processed. Some domains were registered successfully, while others encountered issues.";
      headerColor = "#f59e0b"; // Orange
      headerTitle = "Order Partially Completed";
    } else if (hasSuccessfulDomains && !hasFailedDomains) {
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

    const failedDomainsList = orderData.failedDomains
      .map(
        (domain) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${domain.domainName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #ef4444;" colspan="4">Failed: ${domain.error}</td>
        </tr>
      `
      )
      .join("");

    const subtotal = orderData.successfulDomains.reduce(
      (total, domain) => total + domain.price * domain.registrationPeriod,
      0
    );
    const tax = 0; // No tax for now
    const total = subtotal + tax;

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
                <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">${orderData.createdAt.toLocaleDateString()} ${orderData.createdAt.toLocaleTimeString()}</td>
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
                ${failedDomainsList}
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
                <td style="padding: 8px 0; color: #6b7280;">Tax:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1f2937;">₹${tax.toFixed(
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
          
          ${
            orderData.failedDomains.length > 0
              ? `
            <div style="background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #991b1b; font-weight: 600;">❌ ${orderData.failedDomains.length} domain(s) failed to register</p>
              <p style="margin: 5px 0 0 0; color: #991b1b; font-size: 14px;">Our support team will contact you regarding the failed registrations.</p>
            </div>
          `
              : ""
          }

          <!-- Status-specific messaging -->
          ${
            hasFailedDomains
              ? `
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important Notice</h3>
            <p style="color: #7f1d1d; margin: 0 0 10px 0; font-size: 14px;">
              ${
                hasSuccessfulDomains
                  ? "Some domains in your order could not be registered due to technical issues. You will receive a partial refund for the failed registrations."
                  : "Unfortunately, none of the domains in your order could be registered due to technical issues. You will receive a full refund within 3-5 business days."
              }
            </p>
            <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
              Our technical team has been notified and is working to resolve these issues. If you have any questions, please contact our support team immediately.
            </p>
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
   * Send admin notification for failed domain registrations
   */
  static async sendFailedDomainRegistrationNotification(
    adminEmail: string,
    orderId: string,
    customerName: string,
    customerEmail: string,
    successfulDomains: string[],
    failedDomains: string[],
    amount: number,
    currency: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #dc2626; margin: 0 0 10px 0;">⚠️ Domain Registration Failure Alert</h2>
          <p style="margin: 0; color: #7f1d1d; font-weight: 500;">
            Payment was successful but some domains failed to register. Immediate action required.
          </p>
        </div>

        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 15px 0;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 500; color: #6b7280;">Order ID:</td>
              <td style="padding: 8px 0; color: #111827; font-family: monospace;">${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 500; color: #6b7280;">Customer:</td>
              <td style="padding: 8px 0; color: #111827;">${customerName} (${customerEmail})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 500; color: #6b7280;">Amount:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${currency} ${amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 500; color: #6b7280;">Payment Status:</td>
              <td style="padding: 8px 0; color: #059669; font-weight: 600;">✅ Successful</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #0369a1; margin: 0 0 15px 0;">✅ Successfully Registered Domains</h3>
          ${successfulDomains.length > 0 ? `
            <ul style="margin: 0; padding-left: 20px;">
              ${successfulDomains.map(domain => `<li style="color: #059669; margin: 5px 0;">${domain}</li>`).join('')}
            </ul>
          ` : '<p style="color: #6b7280; margin: 0;">No domains were successfully registered.</p>'}
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #dc2626; margin: 0 0 15px 0;">❌ Failed Domain Registrations</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${failedDomains.map(domain => `<li style="color: #dc2626; margin: 5px 0; font-weight: 500;">${domain}</li>`).join('')}
          </ul>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #d97706; margin: 0 0 15px 0;">🚨 Required Actions</h3>
          <ol style="margin: 0; padding-left: 20px; color: #92400e;">
            <li style="margin: 8px 0;">Check ResellerClub API logs for registration errors</li>
            <li style="margin: 8px 0;">Attempt manual domain registration for failed domains</li>
            <li style="margin: 8px 0;">If registration still fails, process refund for failed domains</li>
            <li style="margin: 8px 0;">Notify customer about the status update</li>
            <li style="margin: 8px 0;">Update order status in admin panel</li>
          </ol>
        </div>

        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            <strong>Next Steps:</strong> Please log into the admin panel to review the full order details and take appropriate action. 
            The customer has been charged successfully, so timely resolution is critical.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            This is an automated notification from Excel Technologies Domain Management System
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `🚨 URGENT: Domain Registration Failed - Order ${orderId}`,
      html,
    });
  }
}
