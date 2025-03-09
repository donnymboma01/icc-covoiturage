"use client";

import React, { useEffect, useState } from "react";
import { getAuth, updateEmail } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  setDoc
} from "firebase/firestore";
import { toast } from "sonner";
import { app } from "../config/firebase-config";
import UserProfile, { UserData } from "../../components/profile/UserProfile";

const Profile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const fetchUserAndVehicleData = async (userId: string) => {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    if (userData?.isDriver) {
      const vehicleRef = doc(db, "vehicles", userId);
      const vehicleDoc = await getDoc(vehicleRef);
      if (vehicleDoc.exists()) {
        userData.vehicle = vehicleDoc.data();
      }
    }
    return userData;
  };

  const handleUpdateUser = async (data: Partial<UserData>) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      if (data.email && data.email !== user.email) {
        await updateEmail(user, data.email);
      }

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, data);

      if (data.isDriver && data.vehicle) {
        const vehicleRef = doc(db, "vehicles", user.uid);
        await setDoc(vehicleRef, {
          ...data.vehicle,
          userId: user.uid,
          isActive: true
        });
      }

      const freshData = await fetchUserAndVehicleData(user.uid);
      setUserData(freshData as UserData);

      toast.success("Profil mis à jour avec succès");
    } catch (error: unknown) {
      console.error("Error updating user:", error);
      if (error instanceof Error && 'code' in error) {
        toast.error(error.code === "auth/requires-recent-login"
          ? "Veuillez vous reconnecter pour modifier votre email"
          : "Erreur lors de la mise à jour du profil"
        );
      } else {
        toast.error("Erreur lors de la mise à jour du profil");
      }
      throw error;
    }
  };
   
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const freshData = await fetchUserAndVehicleData(user.uid);
          setUserData(freshData as UserData);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-slate-600">Aucune donnée utilisateur trouvée</p>
      </div>
    );
  }

  return <UserProfile user={userData} onUpdateUser={handleUpdateUser} />;
};

export default Profile;
