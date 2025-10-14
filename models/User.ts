import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  password?: string; // Made optional for social login users
  firstName: string;
  lastName: string;
  phone?: string; // Made optional for social login users
  phoneCc?: string; // Made optional for social login users
  companyName?: string; // Made optional for social login users
  address?: {
    // Made optional for social login users
    line1: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
  };
  role: "admin" | "user";
  isActive: boolean;
  isActivated: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  activationToken?: string;
  activationTokenExpiry?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  // Social login fields
  provider?: string; // 'google', 'facebook', 'credentials'
  providerId?: string; // Social provider user ID
  profileCompleted?: boolean; // Track if user has completed profile setup
  cart?: Array<{
    domainName: string;
    price: number;
    currency: string;
    registrationPeriod: number;
  }>;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.provider || this.provider === "credentials";
      },
      minlength: 6,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    phoneCc: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    address: {
      line1: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
        default: "IN",
      },
      zipcode: {
        type: String,
        trim: true,
      },
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isActivated: {
      type: Boolean,
      default: false,
    },
    // Social login fields
    provider: {
      type: String,
      enum: ["google", "facebook", "credentials"],
      default: "credentials",
    },
    providerId: {
      type: String,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    activationToken: {
      type: String,
    },
    activationTokenExpiry: {
      type: Date,
    },
    resetToken: {
      type: String,
    },
    resetTokenExpiry: {
      type: Date,
    },
    cart: [
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
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (only for credential-based users)
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  // Only hash password for credential-based users
  if (this.provider === "credentials" || !this.provider) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error: any) {
      next(error);
    }
  } else {
    next();
  }
});

// Compare password method (only for credential-based users)
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // Social login users don't have passwords
  if (this.provider && this.provider !== "credentials") {
    return false;
  }

  if (!this.password) {
    return false;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

// Check if the model already exists
let User: mongoose.Model<IUser>;

try {
  User = mongoose.model<IUser>("User");
} catch (error) {
  // Model doesn't exist, create it
  User = mongoose.model<IUser>("User", UserSchema);
}

export default User;
