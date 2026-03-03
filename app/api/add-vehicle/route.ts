import { NextResponse } from "next/server";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/app/config/firebase-config";
import { rateLimitByIP, RATE_LIMITS, createRateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rateLimit = rateLimitByIP(req, RATE_LIMITS.AUTHENTICATED);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(RATE_LIMITS.AUTHENTICATED, rateLimit.resetIn);
  }

  try {
    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database not initialized" },
        { status: 500 }
      );
    }

    const { userId, vehicle } = await req.json();

    if (!userId || !vehicle) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      vehicles: arrayUnion(vehicle),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error adding vehicle:", err);
    return NextResponse.json(
      { success: false, message: "Failed to add vehicle" },
      { status: 500 }
    );
  }
} 