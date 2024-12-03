/* eslint-disable react-hooks/exhaustive-deps */
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
import { app } from "../../../app/config/firebase-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import RideCard from "./RideCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [churches, setChurches] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [selectedChurch, setSelectedChurch] = useState<string>("");

  // useEffect(() => {
  //   const fetchChurches = async () => {
  //     const churchesRef = collection(db, "churches");
  //     const churchesSnapshot = await getDocs(churchesRef);
  //     const churchesData = churchesSnapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       name: doc.data().name,
  //     }));
  //     setChurches(churchesData);
  //   };

  //   fetchChurches();
  // }, []);
  useEffect(() => {
    const fetchChurches = async () => {
      const churchesRef = collection(db, "churches");
      const churchesSnapshot = await getDocs(churchesRef);

      // Pour Jason & Djedou : ceci permet d'éviter les doublons des églises.
      const churchMap = new Map();
      churchesSnapshot.docs.forEach((doc) => {
        const church = doc.data();
        const normalizedName = church.name.trim().toLowerCase();
        if (!churchMap.has(normalizedName)) {
          churchMap.set(normalizedName, {
            id: doc.id,
            name: church.name.trim(),
          });
        }
      });

      const uniqueChurches = Array.from(churchMap.values());
      setChurches(uniqueChurches);
    };

    fetchChurches();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      console.log("Search Params:", searchParams);
      const startOfDay = new Date(searchParams.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(searchParams.date);
      endOfDay.setHours(23, 59, 59, 999);

      const ridesRef = collection(db, "rides");

      const conditions = [
        where("status", "==", "active"),
        where("departureTime", ">=", startOfDay),
        where("departureTime", "<=", endOfDay),
      ];

      if (selectedChurch && selectedChurch !== "all") {
        conditions.push(where("churchId", "==", selectedChurch));
      }

      if (searchParams.seats > 0) {
        conditions.push(where("availableSeats", ">=", searchParams.seats));
      }

      const q = query(ridesRef, ...conditions);
      const querySnapshot = await getDocs(q);

      const ridesData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const rideData = doc.data() as Ride;

          const departureMatch =
            !searchParams.departure ||
            rideData.departureAddress
              .toLowerCase()
              .includes(searchParams.departure.toLowerCase());

          const arrivalMatch =
            !searchParams.arrival ||
            rideData.arrivalAddress
              .toLowerCase()
              .includes(searchParams.arrival.toLowerCase());

          if (!departureMatch || !arrivalMatch) {
            return null;
          }

          const driverSnap = await getDocs(
            query(
              collection(db, "users"),
              where("uid", "==", rideData.driverId)
            )
          );
          const driverData = driverSnap.docs[0]?.data() as Driver;

          return {
            ...rideData,
            id: doc.id,
            driver: driverData,
          };
        })
      );

      const filteredRides = ridesData.filter(
        (ride): ride is Ride & { driver: Driver } => ride !== null
      );

      setRides(filteredRides);
    } catch (error) {
      console.error("Error fetching rides:", error);
      console.error("Détails de l'erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // const handleSearch = async () => {
  //   setLoading(true);
  //   try {
  //     console.log("Search Params:", searchParams);
  //     const startOfDay = new Date(searchParams.date);
  //     startOfDay.setHours(0, 0, 0, 0);

  //     const endOfDay = new Date(searchParams.date);
  //     endOfDay.setHours(23, 59, 59, 999);

  //     const ridesRef = collection(db, "rides");

  //     const conditions = [
  //       where("status", "==", "active"),
  //       where("departureTime", ">=", startOfDay),
  //       where("departureTime", "<=", endOfDay),
  //     ];

  //     if (selectedChurch) {
  //       conditions.push(where("churchId", "==", selectedChurch));
  //     }
  //     if (searchParams.seats > 0) {
  //       conditions.push(where("availableSeats", ">=", searchParams.seats));
  //     }

  //     const q = query(ridesRef, ...conditions);
  //     const querySnapshot = await getDocs(q);

  //     const ridesData = await Promise.all(
  //       querySnapshot.docs.map(async (doc) => {
  //         const rideData = doc.data() as Ride;

  //         const departureMatch =
  //           !searchParams.departure ||
  //           rideData.departureAddress
  //             .toLowerCase()
  //             .includes(searchParams.departure.toLowerCase());

  //         const arrivalMatch =
  //           !searchParams.arrival ||
  //           rideData.arrivalAddress
  //             .toLowerCase()
  //             .includes(searchParams.arrival.toLowerCase());

  //         if (!departureMatch || !arrivalMatch) {
  //           return null;
  //         }

  //         const driverSnap = await getDocs(
  //           query(
  //             collection(db, "users"),
  //             where("uid", "==", rideData.driverId)
  //           )
  //         );
  //         const driverData = driverSnap.docs[0]?.data() as Driver;

  //         return {
  //           ...rideData,
  //           id: doc.id,
  //           driver: driverData,
  //         };
  //       })
  //     );

  //     const filteredRides = ridesData.filter(
  //       (ride): ride is Ride & { driver: Driver } => ride !== null
  //     );

  //     setRides(filteredRides);
  //   } catch (error) {
  //     console.error("Error fetching rides:", error);
  //     console.error("Détails de l'erreur:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    handleSearch();
  }, []);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

            <Select
              value={selectedChurch || "all"}
              onValueChange={(value) => setSelectedChurch(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une église" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                <SelectItem value="all">Toutes les églises</SelectItem>
                {churches
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

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
            {selectedChurch && selectedChurch !== "all"
              ? `Aucun trajet disponible pour ${
                  churches.find((c) => c.id === selectedChurch)?.name
                }`
              : "Aucun trajet disponible"}
          </div>
        )}
      </div>

      {/* <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
      </div> */}
    </div>
  );
};

export default RideSearch;
