"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/app/config/firebase-config";

interface PassengerVerificationGuardProps {
  children: React.ReactNode;
}

const PassengerVerificationGuard = ({ children }: PassengerVerificationGuardProps) => {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkPassengerVerification = async () => {
      const auth = getAuth(app);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setIsVerifying(false);
        return;
      }

      try {
        const db = getFirestore(app);
        
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (!userData) {
          setIsVerifying(false);
          return;
        }

        // Si c'est un conducteur, le DriverVerificationGuard s'en occupera
        if (userData.isDriver) {
          setIsVerifying(false);
          return;
        }

        const verificationRef = doc(db, "passengerVerifications", currentUser.uid);
        const verificationDoc = await getDoc(verificationRef);
        
        if (!verificationDoc.exists() || !verificationDoc.data().isVerified) {
          if (typeof document !== 'undefined') {
            document.cookie = `pendingPassengerId=${currentUser.uid}; path=/; max-age=86400`;
          }
          router.push("/verify-passenger");
          return;
        }

        setIsVerifying(false);
      } catch (error) {
        console.error("Error checking passenger verification:", error);
        setIsVerifying(false);
      }
    };

    checkPassengerVerification();
  }, [router]);

  if (isVerifying) {
    return <div>Vérification en cours...</div>;
  }

  return <>{children}</>;
};

export default PassengerVerificationGuard; 