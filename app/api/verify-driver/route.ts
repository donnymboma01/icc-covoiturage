import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/config/firebase-config";

export async function POST(req: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database not initialized" },
        { status: 500 }
      );
    }

    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const storedCode = userData.verificationCode;
    const codeExpiry = userData.verificationCodeExpiry?.toDate();

    if (!storedCode || !codeExpiry) {
      return NextResponse.json(
        { success: false, message: "No verification code found" },
        { status: 400 }
      );
    }

    if (new Date() > codeExpiry) {
      return NextResponse.json(
        { success: false, message: "Verification code has expired" },
        { status: 400 }
      );
    }

    if (code !== storedCode) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 400 }
      );
    }

    await updateDoc(userRef, {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error verifying driver:", err);
    return NextResponse.json(
      { success: false, message: "Failed to verify driver" },
      { status: 500 }
    );
  }
} 