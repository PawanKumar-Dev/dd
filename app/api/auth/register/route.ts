import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { AuthService } from "@/lib/auth";
import { EmailService } from "@/lib/email";
import { InputValidator } from "@/lib/validation";
import crypto from "crypto";

// Force dynamic rendering - required for API routes
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      phoneCc,
      companyName,
      address,
    } = await request.json();

    // Validate all inputs
    const emailValidation = InputValidator.validateEmail(email);
    const passwordValidation = InputValidator.validatePassword(password);
    const firstNameValidation = InputValidator.validateName(
      firstName,
      "First name"
    );
    const lastNameValidation = InputValidator.validateName(
      lastName,
      "Last name"
    );
    const phoneValidation = InputValidator.validatePhone(phone);
    const phoneCcValidation = InputValidator.validatePhoneCc(phoneCc);
    const companyNameValidation = InputValidator.validateName(
      companyName,
      "Company name"
    );
    const addressValidation = InputValidator.validateAddress(address);

    const allErrors = [
      ...emailValidation.errors,
      ...passwordValidation.errors,
      ...firstNameValidation.errors,
      ...lastNameValidation.errors,
      ...phoneValidation.errors,
      ...phoneCcValidation.errors,
      ...companyNameValidation.errors,
      ...addressValidation.errors,
    ];

    if (allErrors.length > 0) {
      return NextResponse.json(
        { error: allErrors.join(", ") },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      email: emailValidation.sanitized,
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString("hex");
    const activationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user with sanitized data (not activated by default)
    const user = new User({
      email: emailValidation.sanitized,
      password: passwordValidation.sanitized,
      firstName: firstNameValidation.sanitized,
      lastName: lastNameValidation.sanitized,
      phone: phoneValidation.sanitized,
      phoneCc: phoneCcValidation.sanitized,
      companyName: companyNameValidation.sanitized,
      address: addressValidation.sanitized,
      role: "user",
      isActivated: false,
      activationToken,
      activationTokenExpiry,
      provider: "credentials", // Multi-step form registration
      profileCompleted: true, // Multi-step form users complete profile during registration
    });

    await user.save();

    // Send activation email (async, don't wait for it)
    EmailService.sendActivationEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      activationToken
    ).catch((error) => {
      console.error("Activation email failed:", error);
    });

    return NextResponse.json({
      message:
        "User created successfully. Please check your email to activate your account.",
      requiresActivation: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActivated: user.isActivated,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
