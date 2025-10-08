import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import Settings from "@/models/Settings";
import { connectToDatabase } from "@/lib/mongoose";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get promotional pricing setting
    let setting = await Settings.findOne({
      key: "promotional_pricing_enabled",
    });

    // If setting doesn't exist, create it with default value
    if (!setting) {
      setting = new Settings({
        key: "promotional_pricing_enabled",
        value: true, // Default to enabled
        description:
          "Enable or disable promotional pricing display in domain search results",
        category: "pricing",
        updatedBy: user.email,
      });
      await setting.save();
    }

    return NextResponse.json({
      success: true,
      enabled: setting.value,
      description: setting.description,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy,
    });
  } catch (error) {
    console.error("Promotional pricing setting fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotional pricing setting" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enabled } = await request.json();

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Enabled must be a boolean value" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Update promotional pricing setting
    const setting = await Settings.findOneAndUpdate(
      { key: "promotional_pricing_enabled" },
      {
        key: "promotional_pricing_enabled",
        value: enabled,
        description:
          "Enable or disable promotional pricing display in domain search results",
        category: "pricing",
        updatedAt: new Date(),
        updatedBy: user.email,
      },
      { upsert: true, new: true }
    );

    console.log(
      `🎯 [ADMIN] Promotional pricing ${enabled ? "enabled" : "disabled"} by ${
        user.email
      }`
    );

    return NextResponse.json({
      success: true,
      enabled: setting.value,
      description: setting.description,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy,
    });
  } catch (error) {
    console.error("Promotional pricing setting update error:", error);
    return NextResponse.json(
      { error: "Failed to update promotional pricing setting" },
      { status: 500 }
    );
  }
}
