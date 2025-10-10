import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // For now, we'll use a simple token validation
    // In production, you should verify the JWT token properly
    const user = await User.findOne({ email: token }).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user settings
    const settings = {
      notifications: {
        email: true,
        sms: false,
        domainExpiry: true,
        paymentReminders: true,
      },
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Get user from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // For now, we'll use a simple token validation
    // In production, you should verify the JWT token properly
    const user = await User.findOne({ email: token });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();

    // Update user profile if provided
    if (body.profile) {
      const { firstName, lastName, email, phone, company, address } =
        body.profile;

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (company) user.company = company;
      if (address) user.address = address;
    }

    // Update password if provided
    if (body.password) {
      const { currentPassword, newPassword } = body.password;

      // In production, verify current password with bcrypt
      // For now, we'll just update the password
      if (newPassword) {
        user.password = newPassword; // In production, hash this password
      }
    }

    await user.save();

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
