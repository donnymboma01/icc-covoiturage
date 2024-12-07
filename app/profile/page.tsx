/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { app } from "../config/firebase-config";
import UserProfile from "../../components/profile/UserProfile";
import { UserData } from "../../components/profile/UserProfile";

const Profile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // const handleUpdateUser = async (data: Partial<UserData>) => {
  //   const user = auth.currentUser;
  //   if (user) {
  //     const userRef = doc(db, "users", user.uid);
  //     await updateDoc(userRef, data);

  //     setUserData((prevData) =>
  //       prevData
  //         ? {
  //             ...prevData,
  //             ...data,
  //           }
  //         : null
  //     );
  //   }
  // };
  const handleUpdateUser = async (data: Partial<UserData>) => {
    const user = auth.currentUser;
    if (user) {
      console.log("Updating user with data:", data); // Debug log
      const userRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userRef, data);
        console.log("Update successful"); // Debug log

        setUserData((prevData) =>
          prevData
            ? {
                ...prevData,
                ...data,
              }
            : null
        );
      } catch (error) {
        console.error("Error updating user:", error); // Debug log
      }
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data();

          if (userData) {
            if (userData.isDriver) {
              const vehicleQuery = query(
                collection(db, "vehicles"),
                where("userId", "==", user.uid)
              );
              const vehicleSnapshot = await getDocs(vehicleQuery);
              if (!vehicleSnapshot.empty) {
                const vehicleData = vehicleSnapshot.docs[0].data();
                userData.vehicle = vehicleData;
              }
            }
            setUserData(userData as any);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [db]);

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
        <p className="text-lg text-slate-600">
          Aucune donnée utilisateur trouvée
        </p>
      </div>
    );
  }

  return <UserProfile user={userData} onUpdateUser={handleUpdateUser} />;
};

export default Profile;
