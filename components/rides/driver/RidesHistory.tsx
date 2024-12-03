/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  getFirestore,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { app } from "@/app/config/firebase-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RideCard from "./RideCard";

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
  const [filter, setFilter] = useState<"all" | "active" | "cancelled">("all");
  const db = getFirestore(app);

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

  //   const filteredRides = rides.filter((ride) => {
  //     if (filter === "all") return true;
  //     return ride.status === filter;
  //   });
  const filteredRides = rides.filter((ride) => {
    const departureDate = ride.departureTime.toDate();
    const now = new Date();

    if (filter === "all") return true;
    if (filter === "cancelled") return ride.status === "cancelled";
    if (filter === "active") {
      return (
        ride.status === "active" &&
        departureDate >= now &&
        ride.availableSeats > 0
      );
    }
    return false;
  });

  const handleDeleteRide = async (rideId: string) => {
    const rideRef = doc(db, "rides", rideId);
    await deleteDoc(rideRef);
    fetchRides();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mes trajets publiés</h1>

      <div className="flex gap-2 mb-4">
        <Badge
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Tous
        </Badge>
        <Badge
          variant={filter === "active" ? "default" : "outline"}
          onClick={() => setFilter("active")}
        >
          Actifs
        </Badge>
        <Badge
          variant={filter === "cancelled" ? "default" : "outline"}
          onClick={() => setFilter("cancelled")}
        >
          Annulés
        </Badge>
      </div>

      <div className="grid gap-4">
        {filteredRides.map((ride) => (
          <RideCard
            key={ride.id}
            ride={ride}
            onDelete={() => handleDeleteRide(ride.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default RidesHistory;
