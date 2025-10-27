import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  orderId: string;
  userId: Schema.Types.ObjectId;
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
    status: "pending" | "processing" | "registered" | "failed" | "cancelled";
    bookingStatus: {
      step:
        | "payment_verified"
        | "customer_created"
        | "contact_created"
        | "domain_registering"
        | "domain_pending"
        | "domain_registered"
        | "domain_failed"
        | "dns_activated";
      message: string;
      timestamp: Date;
      progress: number; // 0-100
    }[];
    error?: string;
    orderId?: string;
    expiresAt?: Date;
    resellerClubOrderId?: string;
    resellerClubCustomerId?: string;
    resellerClubContactId?: string;
    dnsActivated?: boolean;
    dnsActivatedAt?: Date;
  }[];
  successfulDomains: string[];
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
  isDeleted?: boolean;
  deletedAt?: Date;
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
      type: Schema.Types.ObjectId,
      ref: "User",
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
          enum: ["pending", "processing", "registered", "failed", "cancelled"],
          default: "pending",
        },
        bookingStatus: [
          {
            step: {
              type: String,
              enum: [
                "payment_verified",
                "customer_created",
                "contact_created",
                "domain_registering",
                "domain_pending",
                "domain_registered",
                "domain_failed",
                "dns_activated",
              ],
              required: true,
            },
            message: {
              type: String,
              required: true,
            },
            timestamp: {
              type: Date,
              default: Date.now,
            },
            progress: {
              type: Number,
              min: 0,
              max: 100,
              required: true,
            },
          },
        ],
        error: String,
        orderId: String,
        expiresAt: Date,
        resellerClubOrderId: String,
        resellerClubCustomerId: String,
        resellerClubContactId: String,
        dnsActivated: {
          type: Boolean,
          default: false,
        },
        dnsActivatedAt: Date,
      },
    ],
    successfulDomains: [String],
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
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
