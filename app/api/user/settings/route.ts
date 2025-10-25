import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { AuthService } from "@/lib/auth";

// Force dynamic rendering - required for API routes
export const dynamic = 'force-dynamic';

function checkProfileCompletion(user: any): boolean {
  // Check if all required fields are filled
  const hasPhone = user.phone && user.phone.trim() !== "";
  const hasPhoneCc = user.phoneCc && user.phoneCc.trim() !== "";
  const hasCompanyName = user.companyName && user.companyName.trim() !== "";
  const hasAddress = user.address?.line1 && user.address.line1.trim() !== "";
  const hasCity = user.address?.city && user.address.city.trim() !== "";
  const hasState = user.address?.state && user.address.state.trim() !== "";
  const hasCountry =
    user.address?.country && user.address.country.trim() !== "";
  const hasZipcode =
    user.address?.zipcode && user.address.zipcode.trim() !== "";

  return (
    hasPhone &&
    hasPhoneCc &&
    hasCompanyName &&
    hasAddress &&
    hasCity &&
    hasState &&
    hasCountry &&
    hasZipcode
  );
}

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
        phoneCc,
        companyName,
        address,
      } = body.profile;

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (phoneCc) user.phoneCc = phoneCc;
      if (companyName) user.companyName = companyName;

      // Initialize address object if it doesn't exist
      if (!user.address) {
        user.address = {
          line1: "",
          city: "",
          state: "",
          country: "IN", // Default to India
          zipcode: "",
        };
      }

      // Update nested address object
      if (address) {
        if (address.line1 !== undefined) user.address.line1 = address.line1;
        if (address.city !== undefined) user.address.city = address.city;
        if (address.state !== undefined) user.address.state = address.state;
        if (address.country !== undefined) user.address.country = address.country;
        if (address.zipcode !== undefined) user.address.zipcode = address.zipcode;
      }

      // Check if profile is completed based on required fields
      const isProfileComplete = checkProfileCompletion(user);
      user.profileCompleted = isProfileComplete;

      console.log('Profile update:', {
        userId: user._id,
        isProfileComplete,
        phone: user.phone,
        phoneCc: user.phoneCc,
        companyName: user.companyName,
        address: user.address
      });
    }

    // Update password if provided
    if (body.password) {
      const { currentPassword, newPassword } = body.password;

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Check if user has an existing password (credentials user)
      if (user.password) {
        // Verify current password
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required" },
            { status: 400 }
          );
        }

        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 401 }
          );
        }
      } else {
        // Social login user setting password for the first time
        // No need to verify current password
        // Keep provider as-is (tracks original registration method)
      }

      // Set new password (will be hashed by pre-save hook)
      user.password = newPassword;
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
