import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { AuthService } from "@/lib/auth";

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

      // Update nested address object
      if (address) {
        if (!user.address) {
          user.address = {
            line1: "",
            city: "",
            state: "",
            country: "",
            zipcode: "",
          };
        }
        if (address.line1) user.address.line1 = address.line1;
        if (address.city) user.address.city = address.city;
        if (address.state) user.address.state = address.state;
        if (address.country) user.address.country = address.country;
        if (address.zipcode) user.address.zipcode = address.zipcode;
      }

      // Check if profile is completed based on required fields
      const isProfileComplete = checkProfileCompletion(user);
      user.profileCompleted = isProfileComplete;
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
