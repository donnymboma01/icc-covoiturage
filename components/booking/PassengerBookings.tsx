/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
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
} from "firebase/firestore";

import { useAuth } from "@/app/hooks/useAuth";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import StatusBadge from "../ui/statusbadge";

interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  status: "pending" | "accepted" | "rejected";
  seatsBooked: number;
  specialNotes: string;
  bookingDate: Timestamp;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Acceptée";
      case "rejected":
        return "Refusée";
      default:
        return "En attente";
    }
  };

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

  if (loading) return <div>Chargement de vos réservations...</div>;

  return (
    <div className="space-y-4 w-full px-4 sm:px-6 md:px-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Mes Réservations</h2>
      {bookings.length === 0 ? (
        <p className="text-sm sm:text-base">
          Vous n'avez pas encore de réservations
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-3 sm:p-4">
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                  <p>Places réservées : {booking.seatsBooked}</p>
                  <StatusBadge status={booking.status} />
                </div>

                {rideDetails[booking.rideId] && (
                  <div className="space-y-1">
                    <p className="truncate">
                      <span className="font-medium">De :</span>{" "}
                      {rideDetails[booking.rideId].departureAddress}
                    </p>
                    <p className="truncate">
                      <span className="font-medium">À :</span>{" "}
                      {rideDetails[booking.rideId].arrivalAddress}
                    </p>
                    <p className="break-words">
                      <span className="font-medium">Départ :</span>{" "}
                      {rideDetails[booking.rideId].departureTime
                        .toDate()
                        .toLocaleString("fr-FR")}
                    </p>
                  </div>
                )}

                <p className="text-sm">
                  <span className="font-medium">Réservé le :</span>{" "}
                  {booking.bookingDate.toDate().toLocaleDateString("fr-FR")}
                </p>

                {booking.specialNotes && (
                  <p className="text-sm break-words">
                    <span className="font-medium">Notes :</span>{" "}
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  //   return (
  //     <div className="space-y-4">
  //       <h2 className="text-2xl font-bold">Mes Réservations</h2>
  //       {bookings.length === 0 ? (
  //         <p>Vous n'avez pas encore de réservations</p>
  //       ) : (
  //         bookings.map((booking) => (
  //           //   <Card key={booking.id} className="p-4">
  //           //     <div className="space-y-2">
  //           //       <p>
  //           //         {" "}
  //           //         <strong>Nombre de places réservées :</strong>{" "}
  //           //         {booking.seatsBooked}
  //           //       </p>
  //           //       <p className={getStatusColor(booking.status)}>
  //           //         <strong>Statut :</strong> {getStatusText(booking.status)}
  //           //       </p>
  //           //       <p>
  //           //         <strong>Date de réservation :</strong>{" "}
  //           //         {booking.bookingDate.toDate().toLocaleDateString("fr-FR")}
  //           //       </p>
  //           //       {booking.specialNotes && (
  //           //         <p>
  //           //           {" "}
  //           //           <strong>Message envoyé : </strong> {booking.specialNotes}
  //           //         </p>
  //           //       )}
  //           //     </div>
  //           //   </Card>
  //           <Card key={booking.id} className="p-4">
  //             <div className="space-y-2">
  //               <p>Places réservées : {booking.seatsBooked}</p>
  //               <StatusBadge status={booking.status} />

  //               {rideDetails[booking.rideId] && (
  //                 <>
  //                   <p>De : {rideDetails[booking.rideId].departureAddress}</p>
  //                   <p>À : {rideDetails[booking.rideId].arrivalAddress}</p>
  //                   <p>
  //                     Départ :{" "}
  //                     {rideDetails[booking.rideId].departureTime
  //                       .toDate()
  //                       .toLocaleString("fr-FR")}
  //                   </p>
  //                 </>
  //               )}

  //               <p>
  //                 Date de réservation :{" "}
  //                 {booking.bookingDate.toDate().toLocaleDateString("fr-FR")}
  //               </p>
  //               {booking.specialNotes && <p>Notes : {booking.specialNotes}</p>}
  //             </div>

  //             {booking.status === "pending" && (
  //               <Badge
  //                 onClick={() => handleCancelBooking(booking.id)}
  //                 variant="destructive"
  //                 className="mt-2"
  //               >
  //                 Annuler la réservation
  //               </Badge>
  //             )}
  //           </Card>
  //         ))
  //       )}
  //     </div>
  //   );
};

export default PassengerBookings;
