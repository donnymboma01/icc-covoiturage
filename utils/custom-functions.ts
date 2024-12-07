import { db } from "@/app/config/firebase-config";
import { doc, updateDoc, Timestamp } from "firebase/firestore";

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
