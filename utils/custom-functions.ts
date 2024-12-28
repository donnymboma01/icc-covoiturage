/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/app/config/firebase-config";
import {
  doc,
  updateDoc,
  Timestamp,
  deleteDoc,
  collection,
  where,
  getDocs,
  query,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/app/config/firebase-config";

interface Ride {
  id: string;
  driverId: string;
  churchId: string;
  departureAddress: string;
  arrivalAddress: string;
  departureTime: Timestamp;
  availableSeats: number;
  isRecurring: boolean;
  frequency?: "weekly" | "monthly";
  status: "active" | "cancelled";
  price?: number;
  waypoints?: string[];
}

export const updateRideInDatabase = async (
  rideId: string,
  updatedData: Partial<Ride>
) => {
  if (db) {
    const rideRef = doc(db, "rides", rideId);
    await updateDoc(rideRef, updatedData);
  } else {
    throw new Error("Firestore database is not initialized");
  }
};

export const uploadImageToFirebase = async (
  file: File,
  path: string
): Promise<string> => {
  const storage = getStorage(app);
  const storageRef = ref(storage, path);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Erreur de téléchargement d'image: ", error);
    throw error;
  }
};


export const cleanupFailedRegistration = async (user: any) => {
  try {
    if (db) {
 
      const userDoc = doc(db, "users", user.uid);
      await deleteDoc(userDoc);

      const vehicleQuery = query(
        collection(db, "vehicles"),
        where("userId", "==", user.uid)
      );
      const vehicleSnap = await getDocs(vehicleQuery);
      vehicleSnap.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      await user.delete();
    } else {
      throw new Error("Firestore database is not initialized");
    }
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
};
