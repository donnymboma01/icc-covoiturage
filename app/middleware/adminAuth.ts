import { NextResponse } from "next/server";
import { getAuth, User } from "firebase/auth";
import { doc, getDoc, DocumentData, getFirestore } from "firebase/firestore";
//import { db } from "@/app/config/firebase-config";
import { app } from "../config/firebase-config";

interface AdminUser extends DocumentData {
  isAdmin: boolean;
  email: string;
  fullName: string;
}

export async function checkAdminAuth(request: Request) {
  const db = getFirestore(app);

  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Non authentifié" },
        { status: 401 }
      );
    }

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const userData = userDoc.data() as AdminUser;

    if (!userData.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Accès non autorisé" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Erreur lors de la vérification admin:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
