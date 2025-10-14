import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Find the order
    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Soft delete the order
    await Order.findByIdAndUpdate(params.id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    console.log(
      `✅ [ADMIN] Order soft deleted: ${order.orderId} by admin: ${user.email}`
    );

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
      deletedOrderId: order.orderId,
    });
  } catch (error) {
    console.error("Failed to delete order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Find the order
    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Un-archive the order
    await Order.findByIdAndUpdate(params.id, {
      isDeleted: false,
      $unset: { deletedAt: 1 },
    });

    console.log(
      `✅ [ADMIN] Order un-archived: ${order.orderId} by admin: ${user.email}`
    );

    return NextResponse.json({
      success: true,
      message: "Order un-archived successfully",
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("Failed to un-archive order:", error);
    return NextResponse.json(
      { error: "Failed to un-archive order" },
      { status: 500 }
    );
  }
}
