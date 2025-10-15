import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user from JWT token
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return user data as settings
    const settings = {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        address: user.address?.line1 || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        country: user.address?.country || "",
        zipCode: user.address?.zipcode || "",
        company: user.companyName || "",
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

    // Get user from JWT token
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Update user profile if provided
    if (body.profile) {
      const {
        firstName,
        lastName,
        email,
        phone,
        company,
        address,
        city,
        state,
        country,
        zipCode,
      } = body.profile;

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (company) user.companyName = company;

      // Update nested address object
      if (address || city || state || country || zipCode) {
        if (!user.address) {
          user.address = {
            line1: "",
            city: "",
            state: "",
            country: "",
            zipcode: "",
          };
        }
        if (address) user.address.line1 = address;
        if (city) user.address.city = city;
        if (state) user.address.state = state;
        if (country) user.address.country = country;
        if (zipCode) user.address.zipcode = zipCode;
      }

      // Mark profile as completed when user updates their profile
      user.profileCompleted = true;
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
