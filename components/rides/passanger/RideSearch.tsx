/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  getFirestore,
} from "firebase/firestore";
// import { db } from "@/lib/firebase";
import { app } from "../../../app/config/firebase-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { DatePicker } from "@/components/ui/date-picker";
import { Calendar } from "@/components/ui/calendar";
import RideCard from "./RideCard";

interface Ride {
  id: string;
  driverId: string;
  churchId: string;
  departureAddress: string;
  arrivalAddress: string;
  departureTime: Timestamp;
  availableSeats: number;
  price?: number;
  status: "active" | "cancelled";
  waypoints: string[];
}

interface Driver {
  fullName: string;
  profilePicture?: string;
}

const db = getFirestore(app);

const RideSearch = () => {
  const [searchParams, setSearchParams] = useState({
    departure: "",
    arrival: "",
    date: new Date(),
    seats: 1,
  });

  const [rides, setRides] = useState<Array<Ride & { driver: Driver }>>([]);
  const [loading, setLoading] = useState(false);

  //   const handleSearch = async () => {
  //     setLoading(true);
  //     try {
  //       // Create a query against the rides collection
  //       const ridesRef = collection(db, "rides");
  //       const q = query(
  //         ridesRef,
  //         where("status", "==", "active"),
  //         where("availableSeats", ">=", searchParams.seats)
  //         // Add more query constraints based on departure/arrival if needed
  //       );

  //       const querySnapshot = await getDocs(q);
  //       const ridesData: Array<Ride & { driver: Driver }> = [];

  //       for (const doc of querySnapshot.docs) {
  //         const rideData = doc.data() as Ride;

  //         // Fetch driver information
  //         const driverDoc = await getDocs(
  //           query(collection(db, "users"), where("uid", "==", rideData.driverId))
  //         );

  //         const driverData = driverDoc.docs[0]?.data() as Driver;

  //         ridesData.push({
  //           ...rideData,
  //           id: doc.id,
  //           driver: {
  //             fullName: driverData.fullName,
  //             profilePicture: driverData.profilePicture,
  //           },
  //         });
  //       }

  //       setRides(ridesData);
  //     } catch (error) {
  //       console.error("Error fetching rides:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  const handleSearch = async () => {
    setLoading(true);
    try {
      console.log("Search Params:", searchParams);
      const startOfDay = new Date(searchParams.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(searchParams.date);
      endOfDay.setHours(23, 59, 59, 999);

      const ridesRef = collection(db, "rides");
      const q = query(
        ridesRef,
        where("status", "==", "active"),
        where("availableSeats", ">=", searchParams.seats),
        where("departureTime", ">=", startOfDay),
        where("departureTime", "<=", endOfDay)
      );

      const querySnapshot = await getDocs(q);
      const ridesData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const rideData = doc.data() as Ride;
          const driverSnap = await getDocs(
            query(
              collection(db, "users"),
              where("uid", "==", rideData.driverId)
            )
          );
          const driverData = driverSnap.docs[0]?.data() as Driver;
          return { ...rideData, id: doc.id, driver: driverData };
        })
      );

      setRides(ridesData as Array<Ride & { driver: Driver }>);
    } catch (error) {
      console.error("Error fetching rides:", error);
      console.error("Détails de l'erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Card className="p-4 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Input
                placeholder="Départ"
                value={searchParams.departure}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    departure: e.target.value,
                  })
                }
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Arrivée"
                value={searchParams.arrival}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, arrival: e.target.value })
                }
                className="w-full"
              />
            </div>

            <div className="w-full">
              <Calendar
                mode="single"
                selected={searchParams.date}
                onSelect={(date) =>
                  date && setSearchParams({ ...searchParams, date })
                }
                className="rounded-md border w-full"
              />
            </div>

            <div className="space-y-2">
              <Input
                type="number"
                min={1}
                placeholder="Nombre de places"
                value={searchParams.seats}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    seats: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto sm:min-w-[200px] mx-auto block"
            disabled={loading}
          >
            {loading ? "Recherche en cours..." : "Rechercher"}
          </Button>
        </form>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {rides.length > 0 ? (
          rides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={{
                ...ride,
                departureTime: ride.departureTime.toDate(),
              }}
              driver={ride.driver}
              onClick={() => {
                window.location.href = `/rides/${ride.id}`;
              }}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            Aucun trajet disponible
          </div>
        )}
      </div>
    </div>
  );

  // return (
  //   <div className="space-y-6">
  //     <Card className="p-6">
  //       <form
  //         onSubmit={(e) => {
  //           e.preventDefault();
  //           handleSearch();
  //         }}
  //         className="space-y-4"
  //       >
  //         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //           <Input
  //             placeholder="Départ"
  //             value={searchParams.departure}
  //             onChange={(e) =>
  //               setSearchParams({ ...searchParams, departure: e.target.value })
  //             }
  //           />
  //           <Input
  //             placeholder="Arrivée"
  //             value={searchParams.arrival}
  //             onChange={(e) =>
  //               setSearchParams({ ...searchParams, arrival: e.target.value })
  //             }
  //           />
  //           <Calendar
  //             mode="single"
  //             selected={searchParams.date}
  //             onSelect={(date) =>
  //               date && setSearchParams({ ...searchParams, date })
  //             }
  //             className="rounded-md border"
  //           />
  //           <Input
  //             type="number"
  //             min={1}
  //             placeholder="Nombre de places"
  //             value={searchParams.seats}
  //             onChange={(e) =>
  //               setSearchParams({
  //                 ...searchParams,
  //                 seats: parseInt(e.target.value),
  //               })
  //             }
  //           />
  //         </div>
  //         <Button type="submit" className="w-full" disabled={loading}>
  //           {loading ? "Recherche en cours..." : "Rechercher"}
  //         </Button>
  //       </form>
  //     </Card>

  //     <div className="space-y-4">
  //       {rides.length > 0 ? (
  //         rides.map((ride) => (
  //           <RideCard
  //             key={ride.id}
  //             ride={{
  //               ...ride,
  //               departureTime: ride.departureTime.toDate(),
  //             }}
  //             driver={ride.driver}
  //             onClick={() => {
  //               window.location.href = `/rides/${ride.id}`;
  //             }}
  //           />
  //         ))
  //       ) : (
  //         <div className="text-center py-8 text-gray-500">
  //           Aucun trajet disponible
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );
};

export default RideSearch;
