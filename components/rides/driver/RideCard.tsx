/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  collection,
  query,
  Timestamp,
  where,
  getDocs,
  writeBatch,
  getFirestore,
  doc,
  onSnapshot,
} from "firebase/firestore";
import {
  MdLocationOn,
  MdAccessTime,
  MdAirlineSeatReclineNormal,
  MdRepeat,
  MdWarning,
  MdDelete,
  MdEdit,
  MdCancel,
} from "react-icons/md";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RideEditDialog } from "./EditRide";
// import { toast } from "sonner";

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

interface RideCardProps {
  ride: Ride;
  onDelete: () => void;
  onUpdate: (updatedData: Partial<Ride>) => Promise<void>;
}

const RideCard = ({
  ride,
  onDelete,
  onUpdate,
}: RideCardProps & { onDelete: () => void }) => {
  const departureDate = ride.departureTime.toDate();
  const [currentRide, setCurrentRide] = useState(ride);
  const db = getFirestore();

  const getRideStatus = () => {
    if (ride.status === "cancelled") return "cancelled";
    if (departureDate < new Date()) return "expired";
    if (ride.availableSeats === 0) return "complet";
    return "active";
  };

  const getStatusVariant = (
    status: string
  ): "destructive" | "secondary" | "default" | "outline" => {
    switch (status) {
      case "active":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "expired":
        return "outline";
      case "complet":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Disponible";
      case "cancelled":
        return "Annulé";
      case "expired":
        return "Date dépassée";
      case "complet":
        return "Complet";
      default:
        return status;
    }
  };

  const handleSeatUpdate = async (newSeats: number) => {
    if (newSeats < 1) {
      alert("Le nombre de places doit être supérieur à 0");
      return;
    }

    try {
      await onUpdate({
        availableSeats: newSeats,
      });
    } catch (error) {
      alert(
        "Impossible de modifier le nombre de places - des réservations sont déjà confirmées"
      );
    }
  };

  useEffect(() => {
    const rideRef = doc(db, "rides", ride.id);

    const unsubscribe = onSnapshot(rideRef, (doc) => {
      if (doc.exists()) {
        const updatedRideData = doc.data();
        setCurrentRide((current) => ({
          ...current,
          availableSeats: updatedRideData.availableSeats,
        }));
      }
    });

    return () => unsubscribe();
  }, [ride.id]);

  const handleCancelRide = async () => {
    const db = getFirestore();
    try {
      await onUpdate({
        status: "cancelled",
      });

      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef, where("rideId", "==", ride.id));
      const bookingsSnapshot = await getDocs(q);

      const batch = writeBatch(db);
      bookingsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: "cancelled",
          updatedAt: Timestamp.now(),
        });
      });
      await batch.commit();
      console.log("trajet annulé avec succès");
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
    }
  };

  const isModifiable = () => {
    const now = new Date();
    const departureDate = ride.departureTime.toDate();
    return (
      departureDate > now &&
      (ride.status === "active" || ride.status === "cancelled")
    );
  };

  const handleReactivateRide = async () => {
    if (!isModifiable()) {
      return;
    }

    try {
      await onUpdate({
        status: "active",
      });
    } catch (error) {
      console.error("Erreur lors de la réactivation:", error);
    }
  };

  const currentStatus = getRideStatus();

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MdLocationOn className="text-blue-500 text-xl" />
            <div>
              <h3 className="font-semibold text-lg text-gray-800">
                {ride.departureAddress}
              </h3>
              <div className="h-4 border-l-2 border-dashed border-gray-300 ml-2" />
              <h3 className="font-semibold text-lg text-gray-800">
                {ride.arrivalAddress}
              </h3>
            </div>
          </div>
          <Badge variant={getStatusVariant(currentStatus)}>
            {getStatusLabel(currentStatus)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <MdAccessTime className="text-gray-500" />
            <span className="text-sm text-gray-600">
              {departureDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              <br />
              {departureDate.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <MdAirlineSeatReclineNormal className="text-gray-500" />
            {/* <span className="text-sm text-gray-600">
              {ride.availableSeats} places disponibles
            </span> */}
            <span className="text-sm text-gray-600">
              {currentRide.availableSeats} places disponibles
            </span>
          </div>
        </div>

        {ride.isRecurring && (
          <div className="flex items-center space-x-2 text-blue-600">
            <MdRepeat />
            <span className="text-sm">
              Trajet {ride.frequency === "weekly" ? "hebdomadaire" : "mensuel"}
            </span>
          </div>
        )}

        {currentStatus === "expired" && (
          <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-2 rounded-lg">
            <MdWarning />
            <span className="text-sm">Ce trajet est déjà passé</span>
          </div>
        )}

        {isModifiable() && (
          <div className="flex space-x-2 pt-2">
            {ride.status === "active" && (
              <RideEditDialog
                ride={ride}
                onSave={onUpdate}
                carCapacity={ride.availableSeats}
              />
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <MdCancel className="mr-2" />
                  {ride.status === "cancelled"
                    ? "Proposer ce trajet"
                    : "Annuler ce trajet"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {ride.status === "cancelled"
                      ? "Réactiver le trajet"
                      : "Annuler le trajet"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {ride.status === "cancelled"
                      ? "Voulez-vous remettre ce trajet à disposition ?"
                      : "Êtes-vous sûr de vouloir annuler ce trajet ?"}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={
                      ride.status === "cancelled"
                        ? handleReactivateRide
                        : handleCancelRide
                    }
                  >
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        {/* <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white border-0 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <MdDelete /> Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogContent className="sm:max-w-[425px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  <span>
                    Êtes-vous sûr de vouloir supprimer ce trajet ? Cette action
                    est irréversible.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>
                  Confirmer la suppression
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog> */}
      </div>
    </div>
  );
};
export default RideCard;
