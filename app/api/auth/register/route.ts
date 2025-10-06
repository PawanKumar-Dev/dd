import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { AuthService } from "@/lib/auth";
import { EmailService } from "@/lib/email";
import { InputValidator } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

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

    const allErrors = [
      ...emailValidation.errors,
      ...passwordValidation.errors,
      ...firstNameValidation.errors,
      ...lastNameValidation.errors,
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

    // Create new user with sanitized data
    const user = new User({
      email: emailValidation.sanitized,
      password: passwordValidation.sanitized,
      firstName: firstNameValidation.sanitized,
      lastName: lastNameValidation.sanitized,
      role: "user",
    });

    await user.save();

    // Generate token
    const token = AuthService.generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Send welcome email (async, don't wait for it)
    EmailService.sendWelcomeEmail(
      user.email,
      `${user.firstName} ${user.lastName}`
    ).catch((error) => {
      console.error("Welcome email failed:", error);
    });

    return NextResponse.json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
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
