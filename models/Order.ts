import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  orderId: string;
  userId: string;
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  domains: {
    domainName: string;
    price: number;
    currency: string;
    registrationPeriod: number;
    status: "registered" | "failed";
    error?: string;
    orderId?: string;
    expiresAt?: Date;
  }[];
  successfulDomains: string[];
  failedDomains: string[];
  paymentVerification?: {
    verifiedAt: Date;
    paymentStatus: string;
    paymentAmount: number;
    paymentCurrency: string;
    razorpayOrderId: string;
  };
  createdAt: Date;
  updatedAt: Date;
  invoiceNumber?: string;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
    },
    razorpaySignature: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    domains: [
      {
        domainName: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        currency: {
          type: String,
          required: true,
        },
        registrationPeriod: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["registered", "failed"],
          required: true,
        },
        error: String,
        orderId: String,
        expiresAt: Date,
      },
    ],
    successfulDomains: [String],
    failedDomains: [String],
    paymentVerification: {
      verifiedAt: {
        type: Date,
        required: true,
      },
      paymentStatus: {
        type: String,
        required: true,
      },
      paymentAmount: {
        type: Number,
        required: true,
      },
      paymentCurrency: {
        type: String,
        required: true,
      },
      razorpayOrderId: {
        type: String,
        required: true,
      },
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate invoice number before saving
OrderSchema.pre("save", function (next) {
  if (this.isNew && this.status === "completed" && !this.invoiceNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.invoiceNumber = `INV-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);
