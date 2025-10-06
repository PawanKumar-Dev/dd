import mongoose, { Schema, Document } from "mongoose";

export interface IDomain extends Document {
  domainName: string;
  status: "available" | "registered" | "pending" | "failed";
  price: number;
  currency: string;
  registrationPeriod: number;
  userId: string;
  orderId?: string;
  resellerClubOrderId?: string;
  registeredAt?: Date;
  expiresAt?: Date;
}

const DomainSchema = new Schema<IDomain>(
  {
    domainName: {
      type: String,
      required: [true, "Domain name is required"],
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["available", "registered", "pending", "failed"],
      default: "available",
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
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    orderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    resellerClubOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    registeredAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
DomainSchema.index({ userId: 1, status: 1 });
DomainSchema.index({ domainName: 1 });
DomainSchema.index({ orderId: 1 });

// Check if the model already exists
let Domain: mongoose.Model<IDomain>;

try {
  Domain = mongoose.model<IDomain>("Domain");
} catch (error) {
  // Model doesn't exist, create it
  Domain = mongoose.model<IDomain>("Domain", DomainSchema);
}

export default Domain;
