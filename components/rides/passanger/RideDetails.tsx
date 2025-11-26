/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { app } from "../../../app/config/firebase-config";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  MdAccessTime,
  MdLocationOn,
  MdPerson,
  MdChurch,
  MdInfo,
  MdVerified,
  MdStar,
} from "react-icons/md";
import BookingForm from "@/components/booking/BookingForm";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import dynamic from "next/dynamic";
import RoutePreview from "@/components/maps/RoutePreview";

// Dynamic import for MapboxMap
const MapboxMap = dynamic(() => import("@/components/maps/MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
      <p className="text-slate-400">Chargement de la carte...</p>
    </div>
  ),
});

const db = getFirestore(app);

interface RideDetailsProps {
  rideId: string;
}

interface Driver {
  isStar: string | boolean | undefined;
  uid: string;
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  isDriver: boolean;
  churchIds: string[];
  isVerified?: boolean;
}

interface Ride {
  id: string;
  driverId: string;
  churchId: string;
  departureAddress: string;
  arrivalAddress: string;
  departureTime: Date;
  availableSeats: number;
  isRecurring: boolean;
  frequency?: "weekly" | "monthly";
  status: "active" | "cancelled";
  price?: number;
  waypoints?: string[];
  displayPhoneNumber: boolean;
  meetingPointNote?: string;
  // New fields for Mapbox
  departureLocation?: {
    lat: number;
    lng: number;
  };
  arrivalLocation?: {
    lat: number;
    lng: number;
  };
  routeInfo?: {
    distanceKm: string;
    durationMin: number;
  };
}

interface Church {
  id: string;
  name: string;
}

const RideDetails = ({ rideId }: RideDetailsProps) => {
  const [ride, setRide] = useState<Ride | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [church, setChurch] = useState<Church | null>(null);
  const [driverChurch, setDriverChurch] = useState<Church | null>(null);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const rideRef = doc(db, "rides", rideId);
        const rideDoc = await getDoc(rideRef);

        if (rideDoc.exists()) {
          const rideData = rideDoc.data();
          const driverId = rideData.driverId;

          const driverRef = doc(db, "users", driverId);
          const driverDoc = await getDoc(driverRef);

          if (driverDoc.exists()) {
            const driverData = driverDoc.data() as Driver;

            const verificationRef = doc(db, "driverVerifications", driverId);
            const verificationDoc = await getDoc(verificationRef);
            if (verificationDoc.exists()) {
              driverData.isVerified = verificationDoc.data().isVerified === true;
            } else {
              driverData.isVerified = false;
            }

            setDriver(driverData);
          }

          setRide({
            id: rideDoc.id,
            ...rideData,
            departureTime: rideData.departureTime.toDate(),
          } as Ride);

          if (rideData.churchId) {
            const churchDoc = await getDoc(
              doc(db, "churches", rideData.churchId)
            );
            if (churchDoc.exists()) {
              setChurch({
                id: churchDoc.id,
                name: churchDoc.data().name,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching ride details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
  }, [rideId]);

  useEffect(() => {
    const fetchDriverChurch = async () => {
      if (driver?.churchIds?.[0]) {
        const churchDoc = await getDoc(
          doc(db, "churches", driver.churchIds[0])
        );
        if (churchDoc.exists()) {
          setDriverChurch({
            id: churchDoc.id,
            name: churchDoc.data().name,
          });
        }
      }
    };

    if (driver) {
      fetchDriverChurch();
    }
  }, [driver]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!ride || !driver) {
    return <div>Trajet non trouvé</div>;
  }

  const departureDate = ride.departureTime;

  return (
    <Card className="p-4 sm:p-6 max-w-2xl mx-auto w-full">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 border-b pb-4">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
            <AvatarImage
              src={driver.profilePicture || "/default-avatar.png"}
              alt={driver.fullName}
            />
          </Avatar>

          <div className="flex flex-col items-center sm:items-start w-full">
            <div className="flex items-center justify-center sm:justify-start gap-2 w-full">
              <h2 className="text-lg sm:text-xl font-semibold text-center sm:text-left break-words max-w-[80%]">
                {driver.fullName}
              </h2>
              {driver.isVerified && (
                <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs">
                  <MdVerified className="text-orange-500" />
                  <span>Vérifié</span>
                </div>
              )}
              {driver.isStar && (
                <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-xs">
                  <MdStar className="text-yellow-500" />
                  <span>Star</span>
                </div>
              )}
            </div>

            <p className="text-gray-500 text-sm sm:text-base text-center sm:text-left">
              {ride.displayPhoneNumber ? driver.phoneNumber : ""}
            </p>

            {driverChurch && (
              <div className="flex items-center justify-center sm:justify-start gap-2 w-full">
                <MdChurch className="text-gray-500 text-lg flex-shrink-0" />
                <p className="text-gray-500 text-sm sm:text-base">
                  {driverChurch.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Map Visualization */}
        {ride.departureLocation && ride.arrivalLocation && (
          <div className="rounded-xl overflow-hidden shadow-sm border border-slate-100">
            <MapboxMap
              initialViewState={{
                latitude: ride.departureLocation.lat,
                longitude: ride.departureLocation.lng,
                zoom: 10
              }}
              height="300px"
              interactive={false} // Static view for details
              markers={[
                { latitude: ride.departureLocation.lat, longitude: ride.departureLocation.lng, color: "#22c55e" },
                { latitude: ride.arrivalLocation.lat, longitude: ride.arrivalLocation.lng, color: "#ef4444" }
              ]}
            >
              <RoutePreview
                start={ride.departureLocation}
                end={ride.arrivalLocation}
              />
            </MapboxMap>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MdAccessTime className="text-xl text-gray-500" />
            <div className="text-sm sm:text-base flex flex-wrap items-center gap-1">
              <p className="font-medium">
                {format(departureDate, "EEEE d MMMM yyyy", { locale: fr })}
              </p>
              <span className="text-gray-600">à</span>
              <p className="text-gray-600">{format(departureDate, "HH:mm")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MdLocationOn className="text-xl text-gray-500 mt-1" />
              <p className="text-sm sm:text-base break-words flex-1">
                De : {ride.departureAddress}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <MdLocationOn className="text-xl text-gray-500 mt-1" />
              <p className="text-sm sm:text-base break-words flex-1">
                À : {ride.arrivalAddress}
              </p>
            </div>

            {ride.routeInfo && (
              <div className="flex gap-4 ml-7 text-sm text-gray-500">
                <span>{ride.routeInfo.distanceKm} km</span>
                <span>•</span>
                <span>~{ride.routeInfo.durationMin} min</span>
              </div>
            )}

            {ride.meetingPointNote && (
              <div className="flex items-start gap-2 bg-orange-50 p-3 rounded-lg border-l-4 border-orange-200 mt-2">
                <MdInfo className="text-xl text-orange-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800 mb-1">
                    Point de rencontre précis :
                  </p>
                  <p className="text-sm text-orange-700 break-words">
                    {ride.meetingPointNote}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <MdPerson className="text-xl text-gray-500" />
              <p className="text-sm sm:text-base">
                {ride.availableSeats} places disponibles
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            className="w-full sm:max-w-xs mx-auto block"
            onClick={() => setIsModalOpen(true)}
            disabled={ride.availableSeats === 0}
          >
            {ride.availableSeats > 0 ? "Réserver" : "Complet"}
          </Button>
          <p className="mt-4 text-center">
            <Link
              href="/dashboard/passanger"
              className="text-orange-500 italic hover:underline hover:text-orange-600"
            >
              Retourner vers la page de recherche
            </Link>
          </p>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Réserver ce trajet"
          >
            <BookingForm
              ride={ride}
              onSuccess={() => {
                setIsModalOpen(false);
                window.location.reload();
              }}
            />
          </Modal>
        </div>
      </div>
    </Card>
  );
};

export default RideDetails;
