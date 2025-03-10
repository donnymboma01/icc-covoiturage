import { NextResponse } from "next/server";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/app/config/firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/config/firebase-config";

export async function POST(req: Request) {
  try {
    if (!db || !auth) {
      return NextResponse.json(
        { success: false, message: "Firebase not initialized" },
        { status: 500 }
      );
    }

    const { email, password, firstName, lastName, phone } = await req.json();

    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email,
      firstName,
      lastName,
      phone,
      isVerified: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, userId: user.uid });
  } catch (err: unknown) {
    console.error("Error during registration:", err);
    let errorMessage = "Failed to register user";
    
    if (err && typeof err === 'object' && 'code' in err) {
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered";
      }
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
} 