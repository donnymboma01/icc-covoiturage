/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import {
  collection,
  getDocs,
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
  const [filter, setFilter] = useState<"all" | "active" | "cancelled">("active");
  const db = getFirestore(app);

  // const handleUpdateRide = async (
  //   rideId: string,
  //   updatedData: Partial<Ride>
  // ) => {
  //   try {
  //     const rideRef = doc(db, "rides", rideId);
  //     await updateDoc(rideRef, updatedData);
  //     await fetchRides();
  //   } catch (error) {
  //     console.error("Error updating ride:", error);
  //   }
  // };

  const handleUpdateRide = async (
    rideId: string,
    updatedData: Partial<Ride>
  ) => {
    const db = getFirestore();
    try {
      // Add validation for available seats
      if (updatedData.availableSeats !== undefined) {
        const bookingsRef = collection(db, "bookings");
        const q = query(
          bookingsRef,
          where("rideId", "==", rideId),
          where("status", "==", "accepted")
        );
        const bookingsSnapshot = await getDocs(q);

        const totalBookedSeats = bookingsSnapshot.docs.reduce(
          (total, doc) => total + doc.data().seatsBooked,
          0
        );

        if (updatedData.availableSeats < totalBookedSeats) {
          throw new Error(
            "Cannot reduce seats below number of accepted bookings"
          );
        }
      }

      const rideRef = doc(db, "rides", rideId);
      await updateDoc(rideRef, {
        ...updatedData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      throw error;
    }
  };

  // const handleUpdateRide = async (
  //   rideId: string,
  //   updatedData: Partial<Ride>
  // ) => {
  //   const db = getFirestore();
  //   try {
  //     const rideRef = doc(db, "rides", rideId);
  //     await updateDoc(rideRef, {
  //       ...updatedData,
  //       updatedAt: Timestamp.now(),
  //     });

  //     if (updatedData.status === "cancelled") {
  //       const bookingsRef = collection(db, "bookings");
  //       const q = query(bookingsRef, where("rideId", "==", rideId));
  //       const bookingsSnapshot = await getDocs(q);

  //       const batch = writeBatch(db);
  //       bookingsSnapshot.docs.forEach((doc) => {
  //         batch.update(doc.ref, {
  //           status: "cancelled",
  //           updatedAt: Timestamp.now(),
  //         });
  //       });
  //       await batch.commit();
  //     }
  //   } catch (error) {
  //     console.error("Erreur lors de la mise à jour:", error);
  //   }
  // };

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

  // const filteredRides = rides.filter((ride) => {
  //   const departureDate = ride.departureTime.toDate();
  //   const now = new Date();

  //   if (filter === "all") return true;
  //   if (filter === "cancelled") return ride.status === "cancelled";
  //   if (filter === "active") {
  //     return (
  //       ride.status === "active" &&
  //       departureDate >= now &&
  //       ride.availableSeats > 0
  //     );
  //   }
  //   return false;
  // });

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
            onUpdate={(updatedData) => handleUpdateRide(ride.id, updatedData)}
          />
        ))}
      </div>
    </div>
  );
};
export default RidesHistory;
