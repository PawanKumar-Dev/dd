import Razorpay from "razorpay";
import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay configuration is missing");
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayService {
  /**
   * Create a payment order
   */
  static async createOrder(
    amount: number,
    currency: string = "INR",
    receipt: string
  ): Promise<PaymentOrder> {
    try {
      // Validate amount
      if (!amount || amount <= 0 || isNaN(amount)) {
        throw new Error(
          `Invalid amount: ${amount}. Amount must be a positive number.`
        );
      }

      // Ensure amount is an integer (Razorpay requirement)
      const amountInPaise = Math.round(amount * 100);

      // Validate amount is within Razorpay limits
      if (amountInPaise < 100) {
        throw new Error(`Amount too small: ₹${amount}. Minimum amount is ₹1.`);
      }

      if (amountInPaise > 100000000) {
        // ₹10,00,000
        throw new Error(
          `Amount too large: ₹${amount}. Maximum amount is ₹10,00,000.`
        );
      }

      console.log(
        `💰 [RAZORPAY] Creating order: ₹${amount} (${amountInPaise} paise)`
      );

      const options = {
        amount: amountInPaise, // Razorpay expects amount in paise
        currency,
        receipt,
        payment_capture: 1,
      };

      const order = await razorpay.orders.create(options);
      console.log(`✅ [RAZORPAY] Order created successfully: ${order.id}`);
      return order as PaymentOrder;
    } catch (error: any) {
      console.error("❌ [RAZORPAY] Order creation error:", error);

      // Handle specific Razorpay errors
      if (error.error) {
        const razorpayError = error.error;
        if (razorpayError.code === "BAD_REQUEST_ERROR") {
          if (razorpayError.description?.includes("amount")) {
            throw new Error(
              `Invalid amount format: ₹${amount}. Amount must be a valid number.`
            );
          }
          throw new Error(
            `Bad request: ${
              razorpayError.description || "Invalid payment request"
            }`
          );
        } else if (razorpayError.code === "GATEWAY_ERROR") {
          throw new Error(
            `Payment gateway error: ${
              razorpayError.description || "Gateway temporarily unavailable"
            }`
          );
        }
      }

      // Handle network/timeout errors
      if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        throw new Error(
          "Network error: Unable to connect to payment gateway. Please try again."
        );
      }

      // Generic error fallback
      throw new Error(
        `Failed to create payment order: ${error.message || "Unknown error"}`
      );
    }
  }

  /**
   * Verify payment signature
   */
  static verifyPayment(verification: PaymentVerification): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        verification;

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");

      return expectedSignature === razorpay_signature;
    } catch (error) {
      console.error("Payment verification error:", error);
      return false;
    }
  }

  /**
   * Get payment details
   */
  static async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error("Razorpay payment fetch error:", error);
      throw new Error("Failed to fetch payment details");
    }
  }

  /**
   * Refund payment
   */
  static async refundPayment(paymentId: string, amount?: number): Promise<any> {
    try {
      const refundOptions: any = {
        payment_id: paymentId,
      };

      if (amount) {
        refundOptions.amount = amount * 100; // Convert to paise
      }

      const refund = await razorpay.payments.refund(paymentId, refundOptions);
      return refund;
    } catch (error) {
      console.error("Razorpay refund error:", error);
      throw new Error("Failed to process refund");
    }
  }

  /**
   * Get order details
   */
  static async getOrderDetails(orderId: string): Promise<any> {
    try {
      const order = await razorpay.orders.fetch(orderId);
      return order;
    } catch (error) {
      console.error("Razorpay order fetch error:", error);
      throw new Error("Failed to fetch order details");
    }
  }
}
