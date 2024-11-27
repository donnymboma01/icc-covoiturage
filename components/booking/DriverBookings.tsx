/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
  getDocs,
  QuerySnapshot,
} from "firebase/firestore";
import { useAuth } from "@/app/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

interface Passenger {
  fullName: string;
  phoneNumber?: string;
}

interface Ride {
  departureAddress: string;
  arrivalAddress: string;
  departureTime: Timestamp;
}

const DriverBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [passengerDetails, setPassengerDetails] = useState<{
    [key: string]: Passenger;
  }>({});
  const [rideDetails, setRideDetails] = useState<{ [key: string]: Ride }>({});
  const [filter, setFilter] = useState<
    "pending" | "accepted" | "rejected" | "all"
  >("pending");

  const filterButtons = (
    <div className="flex gap-2 mb-4">
      <Badge
        onClick={() => setFilter("all")}
        variant={filter === "all" ? "default" : "outline"}
      >
        Toutes
      </Badge>
      <Badge
        onClick={() => setFilter("pending")}
        variant={filter === "pending" ? "default" : "outline"}
      >
        En attente
      </Badge>
      <Badge
        onClick={() => setFilter("accepted")}
        variant={filter === "accepted" ? "default" : "outline"}
      >
        Acceptées
      </Badge>
      <Badge
        onClick={() => setFilter("rejected")}
        variant={filter === "rejected" ? "default" : "outline"}
      >
        Refusées
      </Badge>
    </div>
  );

  //   useEffect(() => {
  //     if (!user) return;

  //     const db = getFirestore();
  //     let q = query(collection(db, "bookings"));

  //     // Ajout du filtre dans la requête
  //     if (filter !== "all") {
  //       q = query(collection(db, "bookings"), where("status", "==", filter));
  //     }

  //     const unsubscribe = onSnapshot(q, (snapshot) => {
  //       const bookingsData = snapshot.docs.map(
  //         (doc) =>
  //           ({
  //             id: doc.id,
  //             ...doc.data(),
  //           } as Booking)
  //       );
  //       setBookings(bookingsData);
  //       setLoading(false);
  //     });

  //     return () => unsubscribe();
  //   }, [user, filter]);
  useEffect(() => {
    if (!user) return;

    const db = getFirestore();

    const ridesQuery = query(
      collection(db, "rides"),
      where("driverId", "==", user.uid)
    );

    getDocs(ridesQuery).then((ridesSnapshot: QuerySnapshot) => {
      const rideIds = ridesSnapshot.docs.map((doc) => doc.id);

      if (rideIds.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      let bookingsQuery = query(
        collection(db, "bookings"),
        where("rideId", "in", rideIds)
      );

      if (filter !== "all") {
        bookingsQuery = query(
          collection(db, "bookings"),
          where("rideId", "in", rideIds),
          where("status", "==", filter)
        );
      }

      const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
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
    });
  }, [user, filter]);

  useEffect(() => {
    if (!bookings.length) return;

    const db = getFirestore();
    bookings.forEach(async (booking) => {
     
      const passengerDoc = await getDoc(doc(db, "users", booking.passengerId));
      if (passengerDoc.exists()) {
        setPassengerDetails((prev) => ({
          ...prev,
          [booking.passengerId]: passengerDoc.data() as Passenger,
        }));
      }

     
      const rideDoc = await getDoc(doc(db, "rides", booking.rideId));
      if (rideDoc.exists()) {
        setRideDetails((prev) => ({
          ...prev,
          [booking.rideId]: rideDoc.data() as Ride,
        }));
      }
    });
  }, [bookings]);

  //   useEffect(() => {
  //     if (!user) return;

  //     const db = getFirestore();
  //     const q = query(
  //       collection(db, "bookings"),
  //       where("status", "==", "pending")
  //     );

  //     const unsubscribe = onSnapshot(q, (snapshot) => {
  //       const bookingsData = snapshot.docs.map(
  //         (doc) =>
  //           ({
  //             id: doc.id,
  //             ...doc.data(),
  //           } as Booking)
  //       );
  //       setBookings(bookingsData);
  //       setLoading(false);
  //     });

  //     return () => unsubscribe();
  //   }, [user]);

  //   const handleBookingAction = async (
  //     bookingId: string,
  //     status: "accepted" | "rejected"
  //   ) => {
  //     const db = getFirestore();
  //     try {
  //       await updateDoc(doc(db, "bookings", bookingId), {
  //         status,
  //         updatedAt: new Date(),
  //       });
  //     } catch (error) {
  //       console.error("Error updating booking:", error);
  //     }
  //   };
  const handleBookingAction = async (
    booking: Booking,
    status: "accepted" | "rejected"
  ) => {
    const db = getFirestore();
    try {
     
      await updateDoc(doc(db, "bookings", booking.id), {
        status,
        updatedAt: Timestamp.now(),
      });

      if (status === "accepted") {
        const rideRef = doc(db, "rides", booking.rideId);
        const rideDoc = await getDoc(rideRef);

        if (rideDoc.exists()) {
          const currentSeats = rideDoc.data().availableSeats;
          await updateDoc(rideRef, {
            availableSeats: currentSeats - booking.seatsBooked,
          });
        }
      }
    } catch (error) {
      console.error("Error updating booking:", error);
    }
  };

  if (loading) return <div>Chargement des réservations...</div>;

  return (
    <div className="space-y-4 w-full px-4 sm:px-6 md:px-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">
        Demandes de réservation
      </h2>

      <div className="flex flex-wrap gap-2 mb-4">{filterButtons}</div>

      {bookings.length === 0 ? (
        <p className="text-sm sm:text-base">Aucune demande en attente</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-3 sm:p-4">
              <div className="space-y-3">
                {passengerDetails[booking.passengerId] && (
                  <div className="mb-2">
                    <h3 className="font-semibold text-sm sm:text-base">
                      Passager :
                    </h3>
                    <p className="text-sm">
                      {passengerDetails[booking.passengerId].fullName}
                    </p>
                    {passengerDetails[booking.passengerId].phoneNumber && (
                      <p className="text-sm">
                        Téléphone :{" "}
                        {passengerDetails[booking.passengerId].phoneNumber}
                      </p>
                    )}
                  </div>
                )}

                {rideDetails[booking.rideId] && (
                  <div className="mb-2">
                    <h3 className="font-semibold text-sm sm:text-base">
                      Détails du trajet :
                    </h3>
                    <p className="text-sm truncate">
                      De : {rideDetails[booking.rideId].departureAddress}
                    </p>
                    <p className="text-sm truncate">
                      À : {rideDetails[booking.rideId].arrivalAddress}
                    </p>
                    <p className="text-sm">
                      Départ :{" "}
                      {rideDetails[booking.rideId].departureTime
                        .toDate()
                        .toLocaleString("fr-FR")}
                    </p>
                  </div>
                )}

                <p className="text-sm">
                  Places demandées : {booking.seatsBooked}
                </p>
                {booking.specialNotes && (
                  <p className="text-sm break-words">
                    Notes : {booking.specialNotes}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Badge
                    onClick={() => handleBookingAction(booking, "accepted")}
                    variant="default"
                    className="text-center cursor-pointer"
                  >
                    Accepter
                  </Badge>
                  <Badge
                    onClick={() => handleBookingAction(booking, "rejected")}
                    variant="destructive"
                    className="text-center cursor-pointer"
                  >
                    Refuser
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  //   return (
  //     <div className="space-y-4">
  //       <h2 className="text-2xl font-bold">Demandes de réservation</h2>
  //       {filterButtons}
  //       {bookings.length === 0 ? (
  //         <p>Aucune demande en attente</p>
  //       ) : (
  //         bookings.map((booking) => (
  //           <Card key={booking.id} className="p-4">
  //             <div className="space-y-2">
  //               {passengerDetails[booking.passengerId] && (
  //                 <div className="mb-4">
  //                   <h3 className="font-semibold">Passager :</h3>
  //                   <p>Nom : {passengerDetails[booking.passengerId].fullName}</p>
  //                   {passengerDetails[booking.passengerId].phoneNumber && (
  //                     <p>
  //                       Téléphone :{" "}
  //                       {passengerDetails[booking.passengerId].phoneNumber}
  //                     </p>
  //                   )}
  //                 </div>
  //               )}

  //               {rideDetails[booking.rideId] && (
  //                 <div className="mb-4">
  //                   <h3 className="font-semibold">Détails du trajet :</h3>
  //                   <p>De : {rideDetails[booking.rideId].departureAddress}</p>
  //                   <p>À : {rideDetails[booking.rideId].arrivalAddress}</p>
  //                   <p>
  //                     Départ :{" "}
  //                     {rideDetails[booking.rideId].departureTime
  //                       .toDate()
  //                       .toLocaleString("fr-FR")}
  //                   </p>
  //                 </div>
  //               )}

  //               <p>Places demandées : {booking.seatsBooked}</p>
  //               {booking.specialNotes && <p>Notes : {booking.specialNotes}</p>}

  //               <div className="flex gap-2 mt-4">
  //                 <Badge
  //                   onClick={() => handleBookingAction(booking, "accepted")}
  //                   variant="default"
  //                 >
  //                   Accepter
  //                 </Badge>
  //                 <Badge
  //                   onClick={() => handleBookingAction(booking, "rejected")}
  //                   variant="destructive"
  //                 >
  //                   Refuser
  //                 </Badge>
  //               </div>
  //             </div>
  //           </Card>
  //         ))
  //       )}
  //     </div>
  //   );
};

export default DriverBookings;
