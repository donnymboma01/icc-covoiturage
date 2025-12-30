/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  getFirestore,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { app } from "@/app/config/firebase-config";
import { Badge } from "@/components/ui/badge";
import RideCard from "./RideCard";
// import { FirebaseApp } from "firebase/app";

export interface Ride {
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
  waypoints: string[];
}

const RidesHistory = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "active" | "cancelled">(
    "active"
  );
  const db = getFirestore(app);

  const handleUpdateRide = async (
    rideId: string,
    updatedData: Partial<Ride> & { seatsToAdd?: number }
  ) => {
    const db = getFirestore();
    try {
      const rideRef = doc(db, "rides", rideId);
      const rideDoc = await getDoc(rideRef);

      if (!rideDoc.exists()) {
        throw new Error("Trajet non trouvé");
      }

      const currentRide = rideDoc.data();

      if (updatedData.seatsToAdd !== undefined && updatedData.seatsToAdd > 0) {
        const newAvailableSeats = (currentRide.availableSeats || 0) + updatedData.seatsToAdd;
        await updateDoc(rideRef, {
          availableSeats: newAvailableSeats,
          updatedAt: Timestamp.now(),
        });
      } else if (updatedData.status !== undefined) {
        await updateDoc(rideRef, {
          status: updatedData.status,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      throw error;
    }
  };

  const fetchRides = async () => {
    if (!user?.uid) return;

    const ridesRef = collection(db, "rides");
    const q = query(
      ridesRef,
      where("driverId", "==", user.uid),
      orderBy("departureTime", "desc")
    );

    const querySnapshot = await getDocs(q);
    const ridesData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ride[];
    setRides(ridesData);
  };

  useEffect(() => {
    fetchRides();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;

    const ridesRef = collection(db, "rides");
    const q = query(
      ridesRef,
      where("driverId", "==", user.uid),
      orderBy("departureTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ridesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ride[];
      setRides(ridesData);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredRides = rides.filter((ride) => {
    const departureDate = ride.departureTime.toDate();
    const now = new Date();

    switch (filter) {
      case "cancelled":
        return ride.status === "cancelled";
      case "active":
        return (
          ride.status === "active" &&
          departureDate >= now &&
          ride.availableSeats > 0
        );
      case "all":
        return departureDate >= now || ride.status === "cancelled";
      default:
        return false;
    }
  });

  const handleDeleteRide = async (rideId: string) => {
    const rideRef = doc(db, "rides", rideId);
    await deleteDoc(rideRef);
    fetchRides();
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl md:text-2xl font-semibold mb-4">
        Mes trajets publiés
      </h1>

      <div className="flex gap-1.5 mb-4">
        <Badge
          className="text-xs cursor-pointer"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Tous
        </Badge>
        <Badge
          className="text-xs cursor-pointer"
          variant={filter === "active" ? "default" : "outline"}
          onClick={() => setFilter("active")}
        >
          Actifs
        </Badge>
        <Badge
          className="text-xs cursor-pointer"
          variant={filter === "cancelled" ? "default" : "outline"}
          onClick={() => setFilter("cancelled")}
        >
          Annulés
        </Badge>
      </div>

      <div className="grid gap-3">
        {filteredRides.map((ride) => (
          <RideCard
            key={ride.id}
            ride={ride}
            onDelete={() => handleDeleteRide(ride.id)}
            onUpdate={(updatedData) => handleUpdateRide(ride.id, updatedData)}
          />
        ))}
      </div>
    </div>
  );
};
export default RidesHistory;
