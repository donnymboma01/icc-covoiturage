/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect, useRef } from "react";
import LocationSharingControl from "../rides/LocationSharingControl";
import LiveTracking from "../maps/LiveTracking";
import ChatWindow from "../messaging/ChatWindow";
import UnreadMessagesIndicator from "../messaging/UnreadMessagesIndicator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { MdVerified } from "react-icons/md";
import { sendBookingAcceptedMessage } from "@/utils/messaging-service";

const REJECTION_REASONS = [
  "Horaires ne correspondent plus",
  "Trajet modifié",
  "Véhicule complet",
  "Plus disponible ce jour-là",
  "Autre",
];

interface RejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

interface AcceptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  noteValue: string;
  onNoteChange: (value: string) => void;
}

interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  status: "pending" | "accepted" | "rejected" | "archived";
  seatsBooked: number;
  specialNotes: string;
  bookingDate: Timestamp;
  driverResponseNote?: string;
}

interface Passenger {
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  isVerified?: boolean;
  isStar: string | boolean | undefined;
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
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [meetingNote, setMeetingNote] = useState("");

  const [selectedBookingForTracking, setSelectedBookingForTracking] = useState<string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<{
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

  const [passengerDetails, setPassengerDetails] = useState<{
    [key: string]: Passenger;
  }>({});
  const [rideDetails, setRideDetails] = useState<{ [key: string]: Ride }>({});
  const [filter, setFilter] = useState<
    "pending" | "accepted" | "rejected" | "all" | "archived"
  >("pending");

  const mapRef = useRef<HTMLDivElement>(null);

  const isRideExpired = (departureTime: Timestamp) => {
    return departureTime.toDate() < new Date();
  };

  const filterButtons = (
    <div className="flex flex-wrap gap-1.5 mb-4">
      <Badge
        onClick={() => setFilter("pending")}
        variant={filter === "pending" ? "default" : "outline"}
        className="cursor-pointer hover:scale-105 transition-transform px-2 py-1 text-xs sm:text-sm sm:px-3 sm:py-1.5"
      >
        En attente
      </Badge>
      <Badge
        onClick={() => setFilter("accepted")}
        variant={filter === "accepted" ? "default" : "outline"}
        className="cursor-pointer hover:scale-105 transition-transform px-2 py-1 text-xs sm:text-sm sm:px-3 sm:py-1.5"
      >
        Acceptées
      </Badge>
      <Badge
        onClick={() => setFilter("rejected")}
        variant={filter === "rejected" ? "default" : "outline"}
        className="cursor-pointer hover:scale-105 transition-transform px-2 py-1 text-xs sm:text-sm sm:px-3 sm:py-1.5"
      >
        Refusées
      </Badge>
      <Badge
        onClick={() => setFilter("archived")}
        variant={filter === "archived" ? "default" : "outline"}
        className="cursor-pointer hover:scale-105 transition-transform px-2 py-1 text-xs sm:text-sm sm:px-3 sm:py-1.5"
      >
        Archivées
      </Badge>
    </div>
  );

  useEffect(() => {
    const archiveExpiredBookings = async () => {
      const db = getFirestore();
      bookings.forEach(async (booking) => {
        const ride = rideDetails[booking.rideId];
        if (
          ride &&
          isRideExpired(ride.departureTime) &&
          booking.status === "pending"
        ) {
          await updateDoc(doc(db, "bookings", booking.id), {
            status: "archived",
            updatedAt: Timestamp.now(),
          });
        }
      });
    };

    if (Object.keys(rideDetails).length > 0) {
      archiveExpiredBookings();
    }
  }, [rideDetails]);

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

  const handleBookingAction = async (
    booking: Booking,
    status: "accepted" | "rejected"
  ) => {
    if (status === "rejected") {
      setSelectedBooking(booking);
      setIsRejectDialogOpen(true);
      return;
    }

    if (status === "accepted") {
      setSelectedBooking(booking);
      setIsAcceptDialogOpen(true);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!selectedBooking) return;

    const db = getFirestore();
    try {
      await updateDoc(doc(db, "bookings", selectedBooking.id), {
        status: "rejected",
        rejectionReason: reason,
        updatedAt: Timestamp.now(),
      });

      const rideRef = doc(db, "rides", selectedBooking.rideId);
      const rideDoc = await getDoc(rideRef);

      if (rideDoc.exists()) {
        const currentSeats = rideDoc.data().availableSeats;
        await updateDoc(rideRef, {
          availableSeats: currentSeats + selectedBooking.seatsBooked,
        });
      }

      setIsRejectDialogOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la reservation:", error);
    }
  };

  const handleAcceptBooking = async (booking: Booking) => {
    const db = getFirestore();
    try {
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "accepted",
        updatedAt: Timestamp.now(),
        driverResponseNote: meetingNote,
      });

      if (user?.uid && passengerDetails[booking.passengerId]) {
        await sendBookingAcceptedMessage(
          user.uid,
          booking.passengerId,
          booking.rideId,
          user.fullName || "Le conducteur",
          passengerDetails[booking.passengerId].fullName
        );
      }

      setIsAcceptDialogOpen(false);
      setMeetingNote("");
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error);
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

  const handleOpenChat = (rideId: string, passengerId: string, passengerName: string) => {
    const ride = rideDetails[rideId];
    const passenger = passengerDetails[passengerId];

    setSelectedPassenger({
      id: passengerId,
      name: passengerName,
      avatar: passenger?.profilePicture,
      rideId: rideId,
      rideInfo: ride ? {
        departure: ride.departureAddress,
        arrival: ride.arrivalAddress,
        date: ride.departureTime.toDate().toLocaleDateString("fr-FR")
      } : undefined
    });
    setIsChatOpen(true);
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
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage
                          src={
                            passengerDetails[booking.passengerId]
                              .profilePicture || "/images/avatarprofile.png"
                          }
                          alt={passengerDetails[booking.passengerId].fullName}
                        />
                      </Avatar>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base">
                          {passengerDetails[booking.passengerId].fullName}
                        </h3>
                        {passengerDetails[booking.passengerId].isStar && (
                          <MdVerified className="text-amber-500 h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </div>
                      {passengerDetails[booking.passengerId].phoneNumber && (
                        <p className="text-sm text-gray-600">
                          {passengerDetails[booking.passengerId].phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {rideDetails[booking.rideId] && (
                  <>
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

                    <p className="text-sm">
                      Places demandées : {booking.seatsBooked}
                    </p>
                    {booking.specialNotes && (
                      <p className="text-sm break-words">
                        Notes : {booking.specialNotes}
                      </p>
                    )}

                    {isRideExpired(rideDetails[booking.rideId].departureTime) &&
                      booking.status === "pending" && (
                        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800 font-medium">
                            Ce trajet est déjà passé. La demande a été
                            automatiquement archivée.
                          </p>
                        </div>
                      )}

                    {!isRideExpired(
                      rideDetails[booking.rideId].departureTime
                    ) && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-3">
                          {booking.status === "pending" && (
                            <>
                              <Badge
                                onClick={() =>
                                  handleBookingAction(booking, "accepted")
                                }
                                variant="default"
                                className="text-center cursor-pointer hover:scale-105 transition-transform bg-green-600 hover:bg-green-700 flex items-center justify-center w-full sm:w-auto"
                              >
                                Accepter
                              </Badge>
                              <Badge
                                onClick={() =>
                                  handleBookingAction(booking, "rejected")
                                }
                                variant="destructive"
                                className="text-center cursor-pointer hover:scale-105 transition-transform bg-red-600 hover:bg-red-700 flex items-center justify-center w-full sm:w-auto"
                              >
                                Refuser
                              </Badge>
                            </>
                          )}
                          {booking.status === "accepted" && (
                            <Badge
                              onClick={() =>
                                handleBookingAction(booking, "rejected")
                              }
                              variant="destructive"
                              className="text-center cursor-pointer hover:scale-105 transition-transform bg-red-600 hover:bg-red-700 flex items-center justify-center w-full sm:w-auto mx-auto sm:mx-0"
                            >
                              Refuser
                            </Badge>
                          )}


                          {booking.status === "rejected" && (
                            <Badge
                              onClick={() =>
                                handleBookingAction(booking, "accepted")
                              }
                              variant="default"
                              className="text-center cursor-pointer hover:scale-105 transition-transform bg-green-600 hover:bg-green-700 flex items-center justify-center w-full sm:w-auto mx-auto sm:mx-0"
                            >
                              Accepter
                            </Badge>
                          )}
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
                            onClick={() => handleOpenChat(booking.rideId, booking.passengerId, passengerDetails[booking.passengerId]?.fullName || "Passager")}
                            className="flex items-center gap-2 relative"
                          >
                            💬 Contacter le passager
                            <UnreadMessagesIndicator />
                          </Button>
                        </div>

                        {selectedBookingForTracking === booking.id && (
                          <div className="mt-4 space-y-4" ref={mapRef}>
                            <LocationSharingControl
                              bookingId={booking.id}
                              passengerId={booking.passengerId}
                              driverId={user?.uid || ""}
                              currentUserId={user?.uid || ""}
                              userType="driver"
                            />

                            <LiveTracking
                              bookingId={booking.id}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleConfirmReject}
      />

      <AcceptDialog
        isOpen={isAcceptDialogOpen}
        onClose={() => setIsAcceptDialogOpen(false)}
        onConfirm={() =>
          selectedBooking && handleAcceptBooking(selectedBooking)
        }
        noteValue={meetingNote}
        onNoteChange={setMeetingNote}
      />

      {/* Fenêtre de chat */}
      {selectedPassenger && (
        <ChatWindow
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedPassenger(null);
          }}
          otherUserId={selectedPassenger.id}
          otherUserName={selectedPassenger.name}
          otherUserAvatar={selectedPassenger.avatar}
          rideId={selectedPassenger.rideId}
          rideInfo={selectedPassenger.rideInfo}
        />
      )}
    </div>
  );
};

export default DriverBookings;

const RejectDialog = ({ isOpen, onClose, onConfirm }: RejectDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer le refus</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">
            Êtes-vous sûr de vouloir refuser cette demande ?
          </p>
          <Select onValueChange={setSelectedReason} value={selectedReason}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une raison" />
            </SelectTrigger>
            <SelectContent>
              {REJECTION_REASONS.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(selectedReason)}
            disabled={!selectedReason}
          >
            Confirmer le refus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AcceptDialog = ({
  isOpen,
  onClose,
  onConfirm,
  noteValue,
  onNoteChange,
}: AcceptDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Réponse personnalisée au passager</DialogTitle>
          <DialogDescription className="text-foreground/70">
            Ajoutez une note spécifique pour ce passager (différente de la note générale du trajet).
            Précisez des informations particulières pour faciliter la rencontre.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <textarea
            className="min-h-[100px] p-3 border rounded-md bg-background text-foreground"
            placeholder="Ex: Pour vous, je serai 10 min en avance. Appelez-moi quand vous arrivez au parking. Attention, l'entrée principale est fermée, utilisez l'entrée côté rue Victor Hugo."
            value={noteValue}
            onChange={(e) => onNoteChange(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => onConfirm(noteValue)}>Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
