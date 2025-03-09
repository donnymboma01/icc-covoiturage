"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/app/config/firebase-config";

interface DriverVerificationGuardProps {
  children: React.ReactNode;
}

const DriverVerificationGuard = ({ children }: DriverVerificationGuardProps) => {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkDriverVerification = async () => {
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

        if (!userData || !userData.isDriver) {
          setIsVerifying(false);
          return;
        }

        const verificationRef = doc(db, "driverVerifications", currentUser.uid);
        const verificationDoc = await getDoc(verificationRef);
        
        if (!verificationDoc.exists() || !verificationDoc.data().isVerified) {
          document.cookie = `pendingDriverId=${currentUser.uid}; path=/; max-age=86400`;
          router.push("/verify-driver");
          return;
        }

        setIsVerifying(false);
      } catch (error) {
        console.error("Error checking driver verification:", error);
        setIsVerifying(false);
      }
    };

    checkDriverVerification();
  }, [router]);

  if (isVerifying) {
    return <div>Vérification en cours...</div>;
  }

  return <>{children}</>;
};

export default DriverVerificationGuard; 