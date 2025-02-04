/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  distanceBetween,
  geohashForLocation,
  geohashQueryBounds,
} from "geofire-common";
import { app } from "../../../app/config/firebase-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import RideCard from "./RideCard";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/app/hooks/useAuth";
import { getCoordinates } from "@/utils/geocoding";

interface GeoLocation {
  lat: number;
  lng: number;
  geohash: string;
}

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
  departureLocation: GeoLocation;
  arrivalLocation: GeoLocation;
}

interface Driver {
  fullName: string;
  profilePicture?: string;
  isStar: string | boolean | undefined;
}

const getDriverData = async (driverId: string): Promise<Driver> => {
  const driverSnap = await getDocs(
    query(collection(db, "users"), where("uid", "==", driverId))
  );

  const driverData = driverSnap.docs[0]?.data() as Driver;
  return driverData;
};

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
  const [highlightedDates, setHighlightedDates] = useState<Date[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { user } = useAuth();

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

  const fetchAllAvailableRides = async () => {
    try {
      const ridesRef = collection(db, "rides");
      const q = query(
        ridesRef,
        where("status", "==", "active"),
        where("departureTime", ">=", new Date())
      );

      const querySnapshot = await getDocs(q);
      console.log("Trajets disponibles trouvés:", querySnapshot.size); // Debug

      const dates = querySnapshot.docs.map((doc) => {
        const rideData = doc.data();
        return rideData.departureTime.toDate();
      });

      const normalizedDates = dates.map(
        (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
      );

      console.log("Dates disponibles:", normalizedDates); // Debug
      setAvailableDates(normalizedDates);
    } catch (error) {
      console.error("Erreur lors du chargement des dates:", error);
    }
  };

  useEffect(() => {
    fetchAllAvailableRides();
  }, []);



  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      const startOfDay = new Date(searchParams.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchParams.date);
      endOfDay.setHours(23, 59, 59, 999);

      if (!searchParams.departure) {
        const ridesRef = collection(db, "rides");
        const q = query(
          ridesRef,
          where("status", "==", "active"),
          where("departureTime", ">=", startOfDay),
          where("departureTime", "<=", endOfDay)
        );

        const querySnapshot = await getDocs(q);
        const ridesData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const rideData = doc.data() as Ride;
            const driverData = await getDriverData(rideData.driverId);
            return {
              ...rideData,
              id: doc.id,
              driver: driverData,
            };
          })
        );
        setRides(ridesData);
        return;
      }

      const searchLocation = await getCoordinates(searchParams.departure);
      const radiusInKm = 10;
      const bounds = geohashQueryBounds(
        [searchLocation.lat, searchLocation.lng],
        radiusInKm * 1000
      );

      const ridesRef = collection(db, "rides");
      const promises = bounds.map((b) => {
        const q = query(
          ridesRef,
          where("departureLocation.geohash", ">=", b[0]),
          where("departureLocation.geohash", "<=", b[1]),
          where("status", "==", "active"),
          where("departureTime", ">=", startOfDay),
          where("departureTime", "<=", endOfDay)
        );
        return getDocs(q);
      });

      const snapshots = await Promise.all(promises);
      const matchingDocs = [];

      for (const snap of snapshots) {
        for (const doc of snap.docs) {
          const rideData = doc.data() as Ride;
          if (rideData.departureLocation) {
            const distanceInKm = distanceBetween(
              [searchLocation.lat, searchLocation.lng],
              [rideData.departureLocation.lat, rideData.departureLocation.lng]
            );
            if (distanceInKm <= radiusInKm) {
              matchingDocs.push({ ...rideData, id: doc.id });
            }
          }
        }
      }

      const ridesWithDrivers = await Promise.all(
        matchingDocs.map(async (ride) => {
          const driverData = await getDriverData(ride.driverId);
          return { ...ride, driver: driverData };
        })
      );

      setRides(ridesWithDrivers);
    } catch (error) {
      console.error("Search error details:", error);
      setRides([]);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Départ</Label>
              <Input
                placeholder="Entrez une ville, ou une adresse complète"
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
              <Label>Arrivée</Label>
              <Input
                placeholder="Entrez une ville, ou une adresse complète"
                value={searchParams.arrival}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, arrival: e.target.value })
                }
                className="w-full"
              />
            </div>



            <div className="w-full">
              <p className="text-sm text-muted-foreground italic mb-2 text-center sm:text-left">
                <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2 align-middle"></span>
                <em>
                  Les dates surlignées en orange indiquent des trajets
                  disponibles pour le covoiturage
                </em>
              </p>
              <Label>Date de départ</Label>
              <Calendar
                mode="single"
                selected={searchParams.date}
                onSelect={(date) => {
                  if (date) {
                    setSearchParams({ ...searchParams, date });
                  }
                }}
                // modifiers={{
                //   highlighted: (date) => {
                //     return (
                //       availableDates.some(
                //         (availableDate) =>
                //           date.getDate() === availableDate.getDate() &&
                //           date.getMonth() === availableDate.getMonth() &&
                //           date.getFullYear() === availableDate.getFullYear()
                //       ) &&
                //       !(
                //         date.getDate() === searchParams.date.getDate() &&
                //         date.getMonth() === searchParams.date.getMonth() &&
                //         date.getFullYear() === searchParams.date.getFullYear()
                //       )
                //     );
                //   },
                //   selected: (date) =>
                //     date.getDate() === searchParams.date.getDate() &&
                //     date.getMonth() === searchParams.date.getMonth() &&
                //     date.getFullYear() === searchParams.date.getFullYear(),
                // }}
                modifiers={{
                  highlighted: (date) => {
                    return availableDates.some(
                      (availableDate) =>
                        date.getDate() === availableDate.getDate() &&
                        date.getMonth() === availableDate.getMonth() &&
                        date.getFullYear() === availableDate.getFullYear()
                    );
                  },
                  selected: (date) =>
                    date.getDate() === searchParams.date.getDate() &&
                    date.getMonth() === searchParams.date.getMonth() &&
                    date.getFullYear() === searchParams.date.getFullYear()
                }}
                

                modifiersStyles={{
                  highlighted: {
                    backgroundColor: "#f97316",
                    color: "white",
                    borderRadius: "9999px",
                  },
                  selected: {
                    backgroundColor: "#1e293b",
                    color: "white",
                    borderRadius: "9999px",
                  },
                }}
                className="rounded-md border w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Nombre de places souhaitées</Label>
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

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full sm:w-auto sm:min-w-[200px] mx-auto block"
              disabled={loading || !user}
            >
              {loading ? "Recherche en cours..." : "Rechercher"}
            </Button>
            {!user && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                <span className="flex flex-wrap items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m0 0v2m0-2h2m-2 0H10"
                    />
                  </svg>
                  Pour rechercher et réserver des trajets, veuillez vous
                  <a
                    href="/auth/login"
                    className="text-orange-500 hover:text-orange-600 font-medium"
                  >
                    connecter
                  </a>
                </span>
              </p>
            )}
          </div>
        </form>
      </Card>


      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {hasSearched ? (
          rides.length > 0 ? (
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
            <div className="col-span-full">
              <div className="text-center p-8 bg-orange-50 rounded-lg border border-orange-200">
                <svg
                  className="w-12 h-12 text-orange-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun trajet disponible
                </h3>
                <p className="text-gray-600">
                  Désolé, nous n'avons trouvé aucun trajet correspondant à vos
                  critères de recherche. Essayez de modifier vos paramètres ou
                  choisissez une autre date.
                </p>
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default RideSearch;
