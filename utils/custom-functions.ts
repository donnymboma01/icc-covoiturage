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
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { app } from "@/app/config/firebase-config";

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
  updatedData: Partial<Ride>,
) => {
  if (db) {
    const rideRef = doc(db, "rides", rideId);
    await updateDoc(rideRef, updatedData);
  } else {
    throw new Error("Firestore database is not initialized");
  }
};

import { uploadFiles } from "@/lib/uploadthing";

export const uploadImageToUploadThing = async (
  file: File | Blob,
  fileName = "profile.jpg",
): Promise<string> => {
  try {
    const fileToUpload =
      file instanceof File
        ? file
        : new File([file], fileName, { type: file.type || "image/jpeg" });

    const res = await uploadFiles("profilePicture", {
      files: [fileToUpload],
    });
    if (!res || res.length === 0) {
      throw new Error("Échec du téléchargement d'image");
    }
    return (res[0] as any).ufsUrl || res[0].url;
  } catch (error) {
    console.error("Erreur de téléchargement d'image sur UploadThing: ", error);
    throw error;
  }
};

export const uploadImageToFirebase = async (
  file: File | Blob,
  _path?: string,
): Promise<string> => {
  return uploadImageToUploadThing(file);
};

export const cleanupFailedRegistration = async (user: any) => {
  try {
    if (db) {
      const userDoc = doc(db, "users", user.uid);
      await deleteDoc(userDoc);

      const vehicleQuery = query(
        collection(db, "vehicles"),
        where("userId", "==", user.uid),
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
