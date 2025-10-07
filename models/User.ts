import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  address: {
    line1: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
  };
  role: "admin" | "user";
  isActive: boolean;
  isActivated: boolean;
  activationToken?: string;
  activationTokenExpiry?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
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
      required: [true, "Password is required"],
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
      required: [true, "Phone number is required"],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    address: {
      line1: {
        type: String,
        required: [true, "Address line 1 is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
        default: "IN",
      },
      zipcode: {
        type: String,
        required: [true, "ZIP code is required"],
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

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
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
