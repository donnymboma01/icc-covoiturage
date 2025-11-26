/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import dynamic from "next/dynamic";
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
import { FaMap, FaList, FaTimes } from "react-icons/fa";

// Dynamic import for MapboxMap to avoid SSR issues
const MapboxMap = dynamic(() => import("@/components/maps/MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
      <p className="text-slate-400">Chargement de la carte...</p>
    </div>
  ),
});

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

const db = getFirestore(app);

const getDriverData = async (driverId: string): Promise<Driver> => {
  const driverSnap = await getDocs(
    query(collection(db, "users"), where("uid", "==", driverId))
  );

  const driverData = driverSnap.docs[0]?.data() as Driver;

  const verificationSnap = await getDoc(doc(db, "driverVerifications", driverId));
  if (verificationSnap.exists()) {
    const verificationData = verificationSnap.data();
    driverData.isVerified = verificationData.isVerified === true;
  } else {
    driverData.isVerified = false;
  }

  return driverData;
};

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
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showNt2026Image, setShowNt2026Image] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [allAvailableRides, setAllAvailableRides] = useState<Array<Ride & { driver: Driver }>>([]);
  const [selectedRide, setSelectedRide] = useState<(Ride & { driver: Driver }) | null>(null);

  const { user } = useAuth();

  // Memoized available dates set for O(1) lookup
  const availableDatesSet = useMemo(() => {
    const set = new Set<string>();
    availableDates.forEach(date => {
      set.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    });
    return set;
  }, [availableDates]);

  // Memoized function to check if date has available rides
  const hasRidesOnDate = useCallback((date: Date) => {
    return availableDatesSet.has(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  }, [availableDatesSet]);

  // Memoized rides for map view
  const ridesWithLocation = useMemo(() => 
    allAvailableRides.filter(ride => ride.departureLocation?.lat && ride.departureLocation?.lng),
    [allAvailableRides]
  );

  // Memoized markers for map
  const mapMarkers = useMemo(() => 
    ridesWithLocation.map(ride => ({
      longitude: ride.departureLocation.lng,
      latitude: ride.departureLocation.lat,
      color: "#f97316",
    })),
    [ridesWithLocation]
  );

  // Memoized center calculation for map
  const mapCenter = useMemo(() => {
    if (mapMarkers.length === 0) return { lat: 50.8503, lng: 4.3517 };
    return {
      lat: mapMarkers.reduce((sum: number, m) => sum + m.latitude, 0) / mapMarkers.length,
      lng: mapMarkers.reduce((sum: number, m) => sum + m.longitude, 0) / mapMarkers.length,
    };
  }, [mapMarkers]);

  const searchResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChurches = async () => {
      const churchesRef = collection(db, "churches");
      const churchesSnapshot = await getDocs(churchesRef);

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

  const fetchAllRidesForMap = async () => {
    try {
      const ridesRef = collection(db, "rides");
      const q = query(
        ridesRef,
        where("status", "==", "active"),
        where("departureTime", ">=", new Date())
      );

      const querySnapshot = await getDocs(q);

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

      setAllAvailableRides(ridesWithDrivers);
    } catch (error) {
      console.error("Erreur lors du chargement des trajets:", error);
    }
  };

  useEffect(() => {
    fetchAllAvailableRides();
  }, []);

  useEffect(() => {
    if (showMapView) {
      fetchAllRidesForMap();
    }
  }, [showMapView]);

  const handleDepartureChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({ ...prev, departure: e.target.value }));
  }, []);

  const handleArrivalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({ ...prev, arrival: e.target.value }));
  }, []);

  const handleChurchChange = useCallback((value: string) => {
    setSearchParams(prev => ({ ...prev, churchId: value }));
  }, []);

  const handleSeatsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({ ...prev, seats: parseInt(e.target.value) || 1 }));
  }, []);

  const handleRideClick = useCallback((rideId: string) => {
    window.location.href = `/rides/${rideId}`;
  }, []);

  const handleCloseMapView = useCallback(() => {
    setShowMapView(false);
    setSelectedRide(null);
  }, []);

  const handleOpenMapView = useCallback(() => {
    setShowMapView(true);
  }, []);

  const handleSearch = async (currentSearchParams = searchParams) => {
    setLoading(true);
    setHasSearched(true);

    const searchDate = currentSearchParams.date;
    const nt2026Date = new Date(2025, 11, 31); 

    const normalizeDate = (date: Date) => {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      return newDate;
    };

    const normalizedSearchDate = normalizeDate(searchDate);
    const normalizedNt2026Date = normalizeDate(nt2026Date);

    if (normalizedSearchDate.getTime() === normalizedNt2026Date.getTime()) {
      setShowNt2026Image(true);
    } else {
      setShowNt2026Image(false);
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

  const renderMapView = () => {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          
          <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaMap className="text-orange-500" />
                Tous les trajets disponibles
              </h2>
              <p className="text-sm text-muted-foreground">
                {ridesWithLocation.length} trajet{ridesWithLocation.length > 1 ? 's' : ''} disponible{ridesWithLocation.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleCloseMapView}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          
          <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)]">
            {/* Map */}
            <div className="flex-1 h-[300px] lg:h-full">
              {ridesWithLocation.length > 0 ? (
                <MapboxMap
                  initialViewState={{
                    latitude: mapCenter.lat,
                    longitude: mapCenter.lng,
                    zoom: 9
                  }}
                  markers={mapMarkers}
                  onMapClick={() => setSelectedRide(null)}
                  height="100%"
                  width="100%"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <div className="text-center p-8">
                    <FaMap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Aucun trajet disponible
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucun trajet n'est disponible pour le moment
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Rides List Sidebar */}
            <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l dark:border-slate-700 overflow-y-auto bg-gray-50 dark:bg-slate-800">
              <div className="p-4 space-y-3">
                {ridesWithLocation.length > 0 ? (
                  ridesWithLocation.map((ride) => (
                    <Card
                      key={ride.id}
                      className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                        selectedRide?.id === ride.id 
                          ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                          : 'hover:bg-white dark:hover:bg-slate-700'
                      }`}
                      onClick={() => setSelectedRide(ride)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">
                            {ride.driver.fullName?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {ride.departureAddress}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            → {ride.arrivalAddress}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                              {(ride.departureTime as Timestamp).toDate().toLocaleDateString('fr-FR', { 
                                day: '2-digit',
                                month: 'short'
                              })} à {(ride.departureTime as Timestamp).toDate().toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {ride.availableSeats} place{ride.availableSeats > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedRide?.id === ride.id && (
                        <div className="mt-3 pt-3 border-t dark:border-slate-600">
                          <Button
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/rides/${ride.id}`;
                            }}
                          >
                            Voir les détails
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>Aucun trajet avec localisation disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                onChange={handleDepartureChange}
                className="w-full dark:text-white dark:bg-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label>Arrivée</Label>
              <Input
                placeholder="Entrez une ville, ou une adresse complète"
                value={searchParams.arrival}
                onChange={handleArrivalChange}
                className="w-full dark:text-white dark:bg-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label>Église (optionnel)</Label>
              <Select
                value={searchParams.churchId}
                onValueChange={handleChurchChange}
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
              <p className="text-sm text-muted-foreground italic mb-2 text-center sm:text-left">
                <span className="inline-block w-3 h-3 bg-blue-300 rounded-full mr-2 align-middle"></span>
                <em>
                  Les dates surlignées en bleu clair indiquent des événements
                  spéciaux de l'église pour proposer des trajets.
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
                  highlighted: hasRidesOnDate,
                  nt2026: (date) => {
                    if (hasRidesOnDate(date)) return false;
                    // 31 décembre 2025
                    return (
                      date.getFullYear() === 2025 &&
                      date.getMonth() === 11 &&
                      date.getDate() === 31
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
                  nt2026: {
                    backgroundColor: "#bae6fd",
                    color: "#0369a1",
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
                onChange={handleSeatsChange}
                className="w-full dark:text-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                type="submit"
                className="w-full sm:w-auto sm:min-w-[200px]"
                disabled={loading || !user}
              >
                <FaList className="mr-2" />
                {loading ? "Recherche en cours..." : "Rechercher"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto sm:min-w-[200px] border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                onClick={handleOpenMapView}
                disabled={!user}
              >
                <FaMap className="mr-2" />
                Voir sur la carte
              </Button>
            </div>
            
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

      {/* Map View Modal */}
      {showMapView && renderMapView()}

      <div
        ref={searchResultsRef}
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {showNt2026Image && hasSearched && (
          <div className="my-4 w-full flex justify-center col-span-full">
            <Image
              src="/images/nt2026.png"
              alt="Nouvelle An 2026 ICC Covoiturage - 31 décembre 2025"
              width={1200}
              height={630}
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
                onClick={() => handleRideClick(ride.id)}
              />
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center p-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Aucun trajet disponible
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
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
