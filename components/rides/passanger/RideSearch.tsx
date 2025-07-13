/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  getFirestore,
  getDoc,
  doc,
} from "firebase/firestore";
import {
  distanceBetween,
  geohashForLocation,
  geohashQueryBounds,
} from "geofire-common";
import Image from "next/image";
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
  isVerified?: boolean;
}

const getDriverData = async (driverId: string): Promise<Driver> => {
  const driverSnap = await getDocs(
    query(collection(db, "users"), where("uid", "==", driverId))
  );

  const driverData = driverSnap.docs[0]?.data() as Driver;

  // Vérifier si le conducteur est vérifié
  const verificationSnap = await getDoc(doc(db, "driverVerifications", driverId));
  if (verificationSnap.exists()) {
    const verificationData = verificationSnap.data();
    driverData.isVerified = verificationData.isVerified === true;
  } else {
    driverData.isVerified = false;
  }

  return driverData;
};

const db = getFirestore(app);

const RideSearch = () => {
  const [searchParams, setSearchParams] = useState({
    departure: "",
    arrival: "",
    date: new Date(),
    seats: 1,
    churchId: "all",
  });

  const [rides, setRides] = useState<Array<Ride & { driver: Driver }>>([]);
  const [loading, setLoading] = useState(false);
  const [churches, setChurches] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [highlightedDates, setHighlightedDates] = useState<Date[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSpecialEventImage, setShowSpecialEventImage] = useState(false);
  const [showDimancheImage, setShowDimancheImage] = useState(false);

  const { user } = useAuth();

  const searchResultsRef = useRef<HTMLDivElement>(null);

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
      uniqueChurches.sort((a, b) => a.name.localeCompare(b.name));
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

      setAvailableDates(normalizedDates);

      if (hasSearched) return;

      const ridesWithDrivers = await Promise.all(
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

      const sortedRides = ridesWithDrivers.sort((a, b) => {
        return (
          (a.departureTime as Timestamp).toDate().getTime() -
          (b.departureTime as Timestamp).toDate().getTime()
        );
      });

      setRides(sortedRides);
    } catch (error) {
      console.error("Erreur lors du chargement des trajets:", error);
    }
  };

  useEffect(() => {
    fetchAllAvailableRides();
  }, []);

  const handleSearch = async (currentSearchParams = searchParams) => {
    setLoading(true);
    setHasSearched(true);

    // Contrôler l'affichage de l'image spéciale
    const searchDate = currentSearchParams.date;
    const startDate = new Date(2025, 5, 30); // Juin (mois 5)
    const endDate = new Date(2025, 6, 6);   // Juillet (mois 6)
    const dimancheDate = new Date(2025, 6, 20); // 20 juillet 2025

    const normalizeDate = (date: Date) => {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      return newDate;
    };

    const normalizedSearchDate = normalizeDate(searchDate);
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);
    const normalizedDimancheDate = normalizeDate(dimancheDate);

    if (
      normalizedSearchDate >= normalizedStartDate &&
      normalizedSearchDate <= normalizedEndDate
    ) {
      setShowSpecialEventImage(true);
    } else {
      setShowSpecialEventImage(false);
    }

    if (normalizedSearchDate.getTime() === normalizedDimancheDate.getTime()) {
      setShowDimancheImage(true);
    } else {
      setShowDimancheImage(false);
    }


    try {
      const startOfDay = new Date(currentSearchParams.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(currentSearchParams.date);
      endOfDay.setHours(23, 59, 59, 999);

      let baseQuery = query(
        collection(db, "rides"),
        where("status", "==", "active"),
        where("departureTime", ">=", startOfDay),
        where("departureTime", "<=", endOfDay)
      );


      let filteredDriverIds: string[] = [];
      if (currentSearchParams.churchId !== "all") {

        const usersRef = collection(db, "users");
        const usersQuery = query(
          usersRef,
          where("churchIds", "array-contains", currentSearchParams.churchId),
          where("isDriver", "==", true)
        );

        const usersSnapshot = await getDocs(usersQuery);
        filteredDriverIds = usersSnapshot.docs.map(doc => doc.id);

        if (filteredDriverIds.length === 0) {
          setRides([]);
          setLoading(false);
          return;
        }

        baseQuery = query(
          collection(db, "rides"),
          where("status", "==", "active"),
          where("departureTime", ">=", startOfDay),
          where("departureTime", "<=", endOfDay),
          where("driverId", "in", filteredDriverIds.slice(0, 10))
        );
      }

      if (!currentSearchParams.departure) {
        const querySnapshot = await getDocs(baseQuery);
        let allDocs = querySnapshot.docs;

        if (currentSearchParams.churchId !== "all" && filteredDriverIds.length > 10) {
          for (let i = 10; i < filteredDriverIds.length; i += 10) {
            const batchDriverIds = filteredDriverIds.slice(i, i + 10);
            if (batchDriverIds.length > 0) {
              const batchQuery = query(
                collection(db, "rides"),
                where("status", "==", "active"),
                where("departureTime", ">=", startOfDay),
                where("departureTime", "<=", endOfDay),
                where("driverId", "in", batchDriverIds)
              );
              const batchSnapshot = await getDocs(batchQuery);
              allDocs = [...allDocs, ...batchSnapshot.docs];
            }
          }
        }

        const ridesData = await Promise.all(
          allDocs.map(async (doc) => {
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

        setTimeout(() => {
          if (searchResultsRef.current) {
            searchResultsRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);

        return;
      }

      const searchLocation = await getCoordinates(currentSearchParams.departure);
      const radiusInKm = 10;
      const bounds = geohashQueryBounds(
        [searchLocation.lat, searchLocation.lng],
        radiusInKm * 1000
      );

      const ridesRef = collection(db, "rides");
      const promises = bounds.map((b) => {
        let geoQuery = query(
          ridesRef,
          where("departureLocation.geohash", ">=", b[0]),
          where("departureLocation.geohash", "<=", b[1]),
          where("status", "==", "active"),
          where("departureTime", ">=", startOfDay),
          where("departureTime", "<=", endOfDay)
        );

        if (searchParams.churchId !== "all" && filteredDriverIds.length > 0) {
          geoQuery = query(
            ridesRef,
            where("departureLocation.geohash", ">=", b[0]),
            where("departureLocation.geohash", "<=", b[1]),
            where("status", "==", "active"),
            where("departureTime", ">=", startOfDay),
            where("departureTime", "<=", endOfDay),
            where("driverId", "in", filteredDriverIds.slice(0, 10))
          );
        }

        return getDocs(geoQuery);
      });

      const snapshots = await Promise.all(promises);
      const matchingDocs = [];

      for (const snap of snapshots) {
        for (const doc of snap.docs) {
          const rideData = doc.data() as Ride;

          if (searchParams.churchId !== "all" && filteredDriverIds.length > 10 &&
            !filteredDriverIds.slice(0, 10).includes(rideData.driverId)) {
            if (!filteredDriverIds.includes(rideData.driverId)) {
              continue;
            }
          }

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

      setTimeout(() => {
        if (searchResultsRef.current) {
          searchResultsRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);

      return;
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
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

            <div className="space-y-2">
              <Label>Église (optionnel)</Label>
              <Select
                value={searchParams.churchId}
                onValueChange={(value) =>
                  setSearchParams({ ...searchParams, churchId: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Toutes les églises" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les églises</SelectItem>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    const newParams = { ...searchParams, date };
                    setSearchParams(newParams);
                    handleSearch(newParams);
                  }
                }}
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

      <div
        ref={searchResultsRef}
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {showDimancheImage && hasSearched && (
          <div className="my-4 w-full flex justify-center col-span-full">
            <Image
              src="/images/dimanche.png"
              alt="Dimanche spécial ICC Covoiturage"
              width={1200}
              height={630}
              className="w-full h-auto md:w-auto md:max-w-2xl rounded-lg shadow-md"
            />
          </div>
        )}
        {showSpecialEventImage && hasSearched && (
          <div className="my-4 w-full flex justify-center col-span-full">
            <Image
              src="/images/royale.png"
              alt="Événement spécial ICC Covoiturage"
              width={1200} // Ajout de la largeur
              height={630} // Ajout de la hauteur
              className="w-full h-auto md:w-auto md:max-w-2xl rounded-lg shadow-md"
            />
          </div>
        )}
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
