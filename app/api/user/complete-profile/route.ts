import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { AuthService } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, phoneCc, companyName, address } = await request.json();

    // Validate required fields
    if (!phone || !phoneCc || !companyName || !address) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate address fields
    const { line1, city, state, country, zipcode } = address;
    if (!line1 || !city || !state || !country || !zipcode) {
      return NextResponse.json(
        { error: "All address fields are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        phone,
        phoneCc,
        companyName,
        address: {
          line1,
          city,
          state,
          country,
          zipcode,
        },
        profileCompleted: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile completed successfully",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        phoneCc: updatedUser.phoneCc,
        companyName: updatedUser.companyName,
        address: updatedUser.address,
        profileCompleted: updatedUser.profileCompleted,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Profile completion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
