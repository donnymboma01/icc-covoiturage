import { NextResponse } from "next/server";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/config/firebase-config";

export async function POST(req: Request) {
  try {
    if (!auth || !db) {
      return NextResponse.json(
        { success: false, message: "Firebase not initialized" },
        { status: 500 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json(
        { success: false, message: "User data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isVerified: userData.isVerified,
      },
    });
  } catch (err: unknown) {
    console.error("Error during login:", err);
    let errorMessage = "Failed to login";

    if (err && typeof err === 'object' && 'code' in err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errorMessage = "Invalid email or password";
      }
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 401 }
    );
  }
} 