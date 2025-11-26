/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";
import { useState, useEffect, useRef } from "react";
import LocationSharingControl from "../rides/LocationSharingControl";
import LiveTracking from "../maps/LiveTracking";
import ChatWindow from "../messaging/ChatWindow";
import UnreadMessagesIndicator from "../messaging/UnreadMessagesIndicator";
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
  serverTimestamp,
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
import { Button } from "../ui/button";

const handleBookingStatusUpdate = async (
  bookingId: string,
  newStatus: string
) => {
  const db = getFirestore();
  const bookingRef = doc(db, "bookings", bookingId);
  await updateDoc(bookingRef, {
    status: newStatus,
    lastStatusUpdate: serverTimestamp(),
    viewed: false,
  });
};


interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  seatsBooked: number;
  specialNotes: string;
  bookingDate: Timestamp;
  rejectionReason?: string;
  viewed: boolean;
  driverResponseNote?: string; // Note de réponse du conducteur au passager
}

interface Ride {
  departureAddress: string;
  arrivalAddress: string;
  departureTime: Timestamp;
  driverId: string;
  price: number;
  meetingPointNote?: string;
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

  const [activeTab, setActiveTab] = useState<"current" | "upcoming" | "past">(
    "current"
  );

  const [selectedBookingForTracking, setSelectedBookingForTracking] = useState<string | null>(null);

  // États pour la messagerie
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<{
    id: string;
    name: string;
    avatar?: string;
    rideId: string;
    rideInfo?: {
      departure: string;
      arrival: string;
      date: string;
    };
  } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);

  const filterBookings = (bookings: Booking[]) => {
    const now = new Date();

    return {
      current: bookings.filter((booking) => {
        const rideDateTime = rideDetails[booking.rideId]?.departureTime.toDate();
        return rideDateTime > now;
      }),
      upcoming: bookings.filter((booking) => {
        const rideDateTime = rideDetails[booking.rideId]?.departureTime.toDate();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return rideDateTime >= tomorrow;
      }),
      past: bookings.filter((booking) => {
        const rideDateTime = rideDetails[booking.rideId]?.departureTime.toDate();
        return rideDateTime <= now;
      }),
    };
  };


  useEffect(() => {
    console.log("Current bookings:", bookings);
    console.log("Current ride details:", rideDetails);
  }, [bookings, rideDetails]);

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
      const bookingsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          rideId: data.rideId,
          passengerId: data.passengerId,
          status: data.status,
          seatsBooked: data.seatsBooked,
          specialNotes: data.specialNotes,
          bookingDate: data.bookingDate,
          rejectionReason: data.rejectionReason,
          viewed: data.viewed ?? false,
          driverResponseNote: data.driverResponseNote,
        } as Booking;
      });

      setBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

  const handleCancelBooking = async (bookingId: string) => {
    const db = getFirestore();
    try {
      const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
      const bookingData = bookingDoc.data();

      if (!bookingData) {
        console.error("No booking data found");
        return;
      }

      await updateDoc(doc(db, "bookings", bookingId), {
        status: "cancelled",
        updatedAt: Timestamp.now(),
      });

      const rideRef = doc(db, "rides", bookingData.rideId);
      const rideDoc = await getDoc(rideRef);
      const rideData = rideDoc.data();

      if (!rideData) {
        console.error("aucun trajet trouvé");
        return;
      }

      const newSeats = (rideData.availableSeats || 0) + bookingData.seatsBooked;
      await updateDoc(rideRef, {
        availableSeats: newSeats,
      });

      console.log(
        `Mise à jour du trajet ${bookingData.rideId} avec ${newSeats} places disponibles`
      );
    } catch (error) {
      console.error("Erreru lors de la suppression:", error);
    }
  };

  const handleToggleLocationSharing = (bookingId: string) => {
    setSelectedBookingForTracking(
      selectedBookingForTracking === bookingId ? null : bookingId
    );

    if (selectedBookingForTracking !== bookingId) {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  };

  const handleOpenChat = (rideId: string, driverId: string, driverName: string) => {
    const ride = rideDetails[rideId];
    const driver = driverDetails[driverId];

    setSelectedDriver({
      id: driverId,
      name: driverName,
      avatar: driver?.profilePicture,
      rideId: rideId,
      rideInfo: ride ? {
        departure: ride.departureAddress,
        arrival: ride.arrivalAddress,
        date: ride.departureTime.toDate().toLocaleDateString("fr-FR")
      } : undefined
    });
    setIsChatOpen(true);
  };

  if (loading) return <div>Chargement de vos réservations...</div>;

  return (
    <div className="space-y-4 w-full px-4 sm:px-6 md:px-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Mes Réservations</h2>

      <div className="flex space-x-2 mb-6">
        <Badge
          variant={activeTab === "current" ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary/80 transition-colors px-4 py-2"
          onClick={() => setActiveTab("current")}
        >
          En cours ({filterBookings(bookings).current.length})
        </Badge>
        <Badge
          variant={activeTab === "upcoming" ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary/80 transition-colors px-4 py-2"
          onClick={() => setActiveTab("upcoming")}
        >
          À venir ({filterBookings(bookings).upcoming.length})
        </Badge>
        <Badge
          variant={activeTab === "past" ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary/80 transition-colors px-4 py-2"
          onClick={() => setActiveTab("past")}
        >
          Passée(s) ({filterBookings(bookings).past.length})
        </Badge>
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm sm:text-base">
          <strong>Vous n'avez pas encore de réservations</strong>
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filterBookings(bookings)[activeTab].map((booking) => {
            const ride = rideDetails[booking.rideId];
            const driver = ride ? driverDetails[ride.driverId] : null;

            return (
              <Card key={booking.id} className="p-4 sm:p-6">
                <div className="space-y-4 text-sm sm:text-base">
                  <div className="flex flex-col space-y-2 mb-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          <strong>Réservé le :</strong>
                        </span>{" "}
                        {booking.bookingDate
                          .toDate()
                          .toLocaleDateString("fr-FR")}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">
                          <strong>Places réservées :</strong>
                        </span>{" "}
                        {booking.seatsBooked}
                      </p>
                      {booking.specialNotes && (
                        <p className="text-sm">
                          <span className="font-medium">
                            <strong>Notes :</strong>
                          </span>{" "}
                          {booking.specialNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {booking.status === "rejected" && booking.rejectionReason && (
                    <p className="text-sm text-red-600">
                      <strong>Raison du refus :</strong>{" "}
                      {booking.rejectionReason}
                    </p>
                  )}

                  {ride && (
                    <div className="space-y-2">
                      <p className="truncate">
                        <span className="font-medium">
                          <strong>De :</strong>
                        </span>{" "}
                        {ride.departureAddress}
                      </p>
                      <p className="truncate">
                        <span className="font-medium">
                          <strong>À :</strong>
                        </span>{" "}
                        {ride.arrivalAddress}
                      </p>
                      <p className="break-words">
                        <span className="font-medium">
                          <strong>Date & Heure :</strong>
                        </span>{" "}
                        {ride.departureTime.toDate().toLocaleString("fr-FR")}
                      </p>
                    </div>
                  )}

                  {driver && (
                    <div className="space-y-2 mt-4 border-t pt-4">
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
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden">
                        {driver.profilePicture && (
                          <Image
                            src={driver.profilePicture}
                            alt={`Photo de ${driver.fullName}`}
                            layout="fill"
                            objectFit="cover"
                          />
                        )}
                      </div>
                      {booking.status === "accepted" &&
                        ride.meetingPointNote && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm font-medium text-blue-800 mb-1">
                              <strong>Note générale du trajet :</strong>
                            </p>
                            <p className="text-sm text-blue-700 whitespace-pre-wrap">
                              {ride.meetingPointNote}
                            </p>
                          </div>
                        )}

                      {booking.status === "accepted" &&
                        booking.driverResponseNote && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-sm font-medium text-green-800 mb-1">
                              <strong>Réponse personnalisée du conducteur :</strong>
                            </p>
                            <p className="text-sm text-green-700 whitespace-pre-wrap">
                              {booking.driverResponseNote}
                            </p>
                          </div>
                        )}

                      {booking.status === "accepted" && (
                        <div className="mt-4 space-y-2">
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              onClick={() => handleToggleLocationSharing(booking.id)}
                            >
                              {selectedBookingForTracking === booking.id
                                ? "Masquer la carte"
                                : "Voir/Partager la localisation"}
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => handleOpenChat(booking.rideId, ride.driverId, driver.fullName)}
                              className="flex items-center gap-2 relative"
                            >
                              💬 Contacter le conducteur
                              <UnreadMessagesIndicator />
                            </Button>
                          </div>

                          {selectedBookingForTracking === booking.id && (
                            <div className="mt-4 space-y-4" ref={mapRef}>
                              <LocationSharingControl
                                bookingId={booking.id}
                                passengerId={user?.uid || ""}
                                driverId={rideDetails[booking.rideId]?.driverId || ""}
                                currentUserId={user?.uid || ""}
                                userType="passenger"
                              />

                              <LiveTracking
                                bookingId={booking.id}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab !== "past" && booking.status === "pending" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Badge
                              variant="destructive"
                              className="mt-4 w-full sm:w-auto text-center cursor-pointer"
                            >
                              Annuler la réservation
                            </Badge>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Confirmer l'annulation
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir annuler cette réservation ?
                                Les places seront remises à disposition pour
                                d'autres passagers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Non, garder la réservation
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                Oui, annuler la réservation
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {activeTab === "past" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Badge
                              variant="destructive"
                              className="mt-4 w-full sm:w-auto text-center cursor-pointer hover:bg-red-700 transition-colors"
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
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Fenêtre de chat */}
      {selectedDriver && (
        <ChatWindow
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedDriver(null);
          }}
          otherUserId={selectedDriver.id}
          otherUserName={selectedDriver.name}
          otherUserAvatar={selectedDriver.avatar}
          rideId={selectedDriver.rideId}
          rideInfo={selectedDriver.rideInfo}
        />
      )}
    </div>
  );
};

export default PassengerBookings;
