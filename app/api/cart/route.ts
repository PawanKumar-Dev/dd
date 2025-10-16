import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Helper function to get minimum registration period for TLD
const getMinRegistrationPeriod = (domainName: string): number => {
  const tld = domainName.split(".").pop()?.toLowerCase();

  // TLD-specific minimum registration periods
  const minPeriods: { [key: string]: number } = {
    ai: 2, // .ai domains require minimum 2 years
    co: 2, // .co domains require minimum 2 years
    io: 1, // .io domains allow 1 year
    com: 1, // .com domains allow 1 year
    net: 1, // .net domains allow 1 year
    org: 1, // .org domains allow 1 year
    // Add more TLDs as needed
  };

  return minPeriods[tld || ""] || 1; // Default to 1 year if TLD not specified
};

// Helper function to validate and correct cart items
const validateAndCorrectCartItems = (items: any[]): any[] => {
  return items.map((item) => {
    const minPeriod = getMinRegistrationPeriod(item.domainName);
    if (item.registrationPeriod < minPeriod) {
      return { ...item, registrationPeriod: minPeriod };
    }
    return item;
  });
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get user with cart data
    const userData = await User.findById(user._id).select("cart");
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate and correct cart items
    const validatedCart = validateAndCorrectCartItems(userData.cart || []);

    // If cart was corrected, save it back to the database
    if (JSON.stringify(validatedCart) !== JSON.stringify(userData.cart)) {
      await User.findByIdAndUpdate(user._id, { cart: validatedCart });
    }

    return NextResponse.json({
      success: true,
      cart: validatedCart,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cart } = await request.json();

    if (!Array.isArray(cart)) {
      return NextResponse.json({ error: "Invalid cart data" }, { status: 400 });
    }

    await connectDB();

    // Validate and correct cart items before saving
    const validatedCart = validateAndCorrectCartItems(cart);

    // Update user's cart with validated data
    await User.findByIdAndUpdate(user._id, { cart: validatedCart });

    return NextResponse.json({
      success: true,
      message: "Cart updated successfully",
    });
  } catch (error) {
    console.error("Update cart error:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Clear user's cart
    await User.findByIdAndUpdate(user._id, { cart: [] });

    return NextResponse.json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
