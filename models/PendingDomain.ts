import mongoose, { Document, Schema } from "mongoose";

export interface IPendingDomain extends Document {
  domainName: string;
  price: number;
  currency: string;
  registrationPeriod: number;
  userId: string;
  orderId: string;
  customerId: number; // ResellerClub customer ID
  contactId: number; // ResellerClub contact ID
  nameServers?: string[];
  adminContactId?: number;
  techContactId?: number;
  billingContactId?: number;
  status: "pending" | "processing" | "completed" | "failed";
  reason: string;
  verificationAttempts: number;
  lastVerifiedAt?: Date;
  registeredAt?: Date;
  expiresAt?: Date;
  resellerClubOrderId?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PendingDomainSchema = new Schema<IPendingDomain>(
  {
    domainName: {
      type: String,
      required: [true, "Domain name is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "INR",
    },
    registrationPeriod: {
      type: Number,
      required: [true, "Registration period is required"],
      min: 1,
      max: 10,
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
    orderId: {
      type: String,
      required: [true, "Order ID is required"],
    },
    customerId: {
      type: Number,
      required: [true, "ResellerClub customer ID is required"],
    },
    contactId: {
      type: Number,
      required: [true, "ResellerClub contact ID is required"],
    },
    nameServers: {
      type: [String],
      default: undefined,
    },
    adminContactId: {
      type: Number,
      default: undefined,
    },
    techContactId: {
      type: Number,
      default: undefined,
    },
    billingContactId: {
      type: Number,
      default: undefined,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      default: "Domain registration failed - likely due to insufficient funds",
    },
    verificationAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastVerifiedAt: {
      type: Date,
      default: undefined,
    },
    registeredAt: {
      type: Date,
      default: undefined,
    },
    expiresAt: {
      type: Date,
      default: undefined,
    },
    resellerClubOrderId: {
      type: String,
      default: undefined,
    },
    adminNotes: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
// Note: domainName index is automatically created by unique: true
PendingDomainSchema.index({ userId: 1, status: 1 });
PendingDomainSchema.index({ orderId: 1 });
PendingDomainSchema.index({ status: 1, createdAt: -1 });
PendingDomainSchema.index({ lastVerifiedAt: 1 });

// Virtual for customer information (will be populated)
PendingDomainSchema.virtual("customer", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
PendingDomainSchema.set("toJSON", { virtuals: true });
PendingDomainSchema.set("toObject", { virtuals: true });

export default mongoose.models.PendingDomain ||
  mongoose.model<IPendingDomain>("PendingDomain", PendingDomainSchema);
