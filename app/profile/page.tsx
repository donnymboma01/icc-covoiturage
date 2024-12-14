/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { getAuth, updateEmail, sendEmailVerification } from "firebase/auth";
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
import { toast } from "sonner";

const Profile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // const handleUpdateUser = async (data: Partial<UserData>) => {
  //   const user = auth.currentUser;
  //   if (user) {
  //     console.log("Updating user with data:", data); // Debug log
  //     const userRef = doc(db, "users", user.uid);
  //     try {
  //       await updateDoc(userRef, data);
  //       console.log("Update successful"); // Debug log

  //       setUserData((prevData) =>
  //         prevData
  //           ? {
  //               ...prevData,
  //               ...data,
  //             }
  //           : null
  //       );
  //     } catch (error) {
  //       console.error("Error updating user:", error); // Debug log
  //     }
  //   }
  // };

  // const handleUpdateUser = async (data: Partial<UserData>) => {
  //   const user = auth.currentUser;
  //   if (user) {
  //     const userRef = doc(db, "users", user.uid);

  //     try {
  //       if (data.email && data.email !== user.email) {
  //         await sendEmailVerification(user);
  //         toast.success(
  //           "Un email de vérification vous a été envoyé. Veuillez vérifier votre nouvelle adresse email."
  //         );
  //       }

  //       // Update other user data in Firestore
  //       const { email, ...otherData } = data;
  //       await updateDoc(userRef, otherData);

  //       setUserData((prevData) =>
  //         prevData
  //           ? {
  //               ...prevData,
  //               ...otherData,
  //             }
  //           : null
  //       );
  //     } catch (error: any) {
  //       console.error("Error updating user:", error);
  //       toast.error("Une erreur est survenue lors de la mise à jour du profil");
  //       throw error;
  //     }
  //   }
  // };
  const handleUpdateUser = async (data: Partial<UserData>) => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "users", user.uid);

      try {
        // Update email in Firebase Auth if it has changed
        if (data.email && data.email !== user.email) {
          await updateEmail(user, data.email);
        }

        // Update user data in Firestore
        await updateDoc(userRef, data);

        // Update local state
        setUserData((prevData) =>
          prevData
            ? {
                ...prevData,
                ...data,
              }
            : null
        );

        toast.success("Profil mis à jour avec succès");
      } catch (error: any) {
        console.error("Error updating user:", error);
        if (error.code === "auth/requires-recent-login") {
          toast.error("Veuillez vous reconnecter pour modifier votre email");
        } else {
          toast.error("Erreur lors de la mise à jour du profil");
        }
        throw error;
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
