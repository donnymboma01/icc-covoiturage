/* eslint-disable react/no-unescaped-entities */
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { useAuth } from "@/app/hooks/useAuth";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import StatusBadge from "../ui/statusbadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  status: "pending" | "accepted" | "rejected";
  seatsBooked: number;
  specialNotes: string;
  bookingDate: Timestamp;
  rejectionReason?: string;
}

interface Ride {
  departureAddress: string;
  arrivalAddress: string;
  departureTime: Timestamp;
  driverId: string;
  price: number;
}

interface Driver {
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
}

const PassengerBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rideDetails, setRideDetails] = useState<{ [key: string]: Ride }>({});
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [driverDetails, setDriverDetails] = useState<{ [key: string]: Driver }>(
    {}
  );

  useEffect(() => {
    if (!bookings.length) return;

    const db = getFirestore();
    bookings.forEach(async (booking) => {
      const rideDoc = await getDoc(doc(db, "rides", booking.rideId));
      if (rideDoc.exists()) {
        setRideDetails((prev) => ({
          ...prev,
          [booking.rideId]: rideDoc.data() as Ride,
        }));
      }
    });
  }, [bookings]);

  useEffect(() => {
    if (!bookings.length || !rideDetails) return;

    const db = getFirestore();

    Object.values(rideDetails).forEach(async (ride) => {
      if (ride.driverId) {
        const driverDoc = await getDoc(doc(db, "users", ride.driverId));
        if (driverDoc.exists()) {
          setDriverDetails((prev) => ({
            ...prev,
            [ride.driverId]: driverDoc.data() as Driver,
          }));
        }
      }
    });
  }, [bookings, rideDetails]);

  useEffect(() => {
    if (!user) return;

    const db = getFirestore();
    const q = query(
      collection(db, "bookings"),
      where("passengerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Booking)
      );
      setBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    const db = getFirestore();
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "cancelled",
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  // const handleDeleteBooking = async (bookingId: string) => {
  //   const db = getFirestore();
  //   try {
  //     await deleteDoc(doc(db, "bookings", bookingId));
  //   } catch (error) {
  //     console.error("Erreur lors de la suppression:", error);
  //   }
  // };
  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;

    const db = getFirestore();
    try {
      await deleteDoc(doc(db, "bookings", bookingToDelete));
      setBookingToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const isBookingPast = (departureTime: Timestamp) => {
    const now = Timestamp.now();
    return departureTime.seconds < now.seconds;
  };

  if (loading) return <div>Chargement de vos réservations...</div>;

  return (
    <div className="space-y-4 w-full px-4 sm:px-6 md:px-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Mes Réservations</h2>
      {bookings.length === 0 ? (
        <p className="text-sm sm:text-base">
          <strong> Vous n'avez pas encore de réservations</strong>
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => {
            const ride = rideDetails[booking.rideId];
            const driver = ride ? driverDetails[ride.driverId] : null;

            return (
              <Card key={booking.id} className="p-3 sm:p-4">
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                    <StatusBadge status={booking.status} />
                    {booking.status === "rejected" &&
                      booking.rejectionReason && (
                        <p className="text-sm text-red-600">
                          <strong>Raison du refus :</strong>{" "}
                          {booking.rejectionReason}
                        </p>
                      )}
                    <p>
                      <strong>Places réservées : </strong>
                      {booking.seatsBooked}
                    </p>
                  </div>

                  {ride && (
                    <div className="space-y-1">
                      <p className="truncate">
                        <span className="font-medium">
                          <strong>De :</strong>
                        </span>{" "}
                        {ride.departureAddress}
                      </p>
                      <p className="truncate">
                        <span className="font-medium">
                          <strong>À : </strong>
                        </span>{" "}
                        {ride.arrivalAddress}
                      </p>
                      <p className="break-words">
                        <span className="font-medium">
                          <strong>Départ :</strong>
                        </span>{" "}
                        {ride.departureTime.toDate().toLocaleString("fr-FR")}
                      </p>
                      {/* <p>
                        <span className="font-medium">Prix :</span> {ride.price}
                        €
                      </p> */}
                    </div>
                  )}

                  {driver && (
                    <div className="space-y-1 mt-2 border-t pt-2">
                      <p className="font-medium text-gray-700">
                        <strong>Informations conducteur :</strong>
                      </p>
                      <p>{driver.fullName}</p>
                      {driver.phoneNumber && (
                        <p className="text-sm">
                          <span className="font-medium">Tél :</span>{" "}
                          {driver.phoneNumber}
                        </p>
                      )}
                      {driver.profilePicture && (
                        <Image
                          src={driver.profilePicture}
                          alt={`Photo de ${driver.fullName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  <p className="text-sm">
                    <span className="font-medium">
                      <strong>Réservé le :</strong>
                    </span>{" "}
                    {booking.bookingDate.toDate().toLocaleDateString("fr-FR")}
                  </p>

                  {booking.specialNotes && (
                    <p className="text-sm break-words">
                      <span className="font-medium">
                        <strong>Le message que vous avez laissé :</strong>
                      </span>{" "}
                      {booking.specialNotes}
                    </p>
                  )}

                  {booking.status === "pending" && (
                    <Badge
                      onClick={() => handleCancelBooking(booking.id)}
                      variant="destructive"
                      className="mt-2 w-full sm:w-auto text-center cursor-pointer"
                    >
                      Annuler la réservation
                    </Badge>
                  )}
                </div>
                {(booking.status === "rejected" ||
                  (ride && isBookingPast(ride.departureTime))) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Badge
                        variant="destructive"
                        className="mt-2 w-full sm:w-auto text-center cursor-pointer hover:bg-red-700 transition-colors"
                        onClick={() => setBookingToDelete(booking.id)}
                      >
                        Supprimer la réservation
                      </Badge>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. La réservation sera
                          définitivement supprimée.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={() => setBookingToDelete(null)}
                        >
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBooking}>
                          Confirmer la suppression
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PassengerBookings;
