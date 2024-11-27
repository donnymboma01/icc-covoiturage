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
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { app } from "../../app/config/firebase-config";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/app/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MdAccessTime, MdLocationOn, MdPerson, MdEuro } from "react-icons/md";

const db = getFirestore(app);

interface Driver {
  uid: string;
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  isDriver: boolean;
  churchIds: string[];
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
}

const BookingForm = ({
  ride,
  onSuccess,
}: {
  ride: Ride;
  onSuccess: () => void;
}) => {
  const { user } = useAuth();
  const [seats, setSeats] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!user) return;

  //   setLoading(true);
  //   try {
  //     await addDoc(collection(db, "bookings"), {
  //       rideId: ride.id,
  //       passengerId: user.uid,
  //       bookingDate: new Date(),
  //       status: "pending",
  //       seatsBooked: seats,
  //       specialNotes: notes,
  //     });

  //     await updateDoc(doc(db, "rides", ride.id), {
  //       availableSeats: ride.availableSeats - seats,
  //     });

  //     onSuccess();
  //   } catch (error) {
  //     console.error("Error creating booking:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        throw new Error("Le profil de l'utilisateur n'existe pas.");
      }

      const bookingRef = await addDoc(collection(db, "bookings"), {
        rideId: ride.id,
        passengerId: user.uid,
        bookingDate: new Date(),
        status: "pending",
        seatsBooked: seats,
        specialNotes: notes,
      });

      const rideRef = doc(db, "rides", ride.id);
      await updateDoc(rideRef, {
        availableSeats: ride.availableSeats - seats,
      });

      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="seats">Nombre de places</Label>
        <Input
          id="seats"
          type="number"
          min={1}
          max={ride.availableSeats}
          value={seats}
          onChange={(e) => setSeats(parseInt(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes spéciales</Label>
        <Textarea
          id="notes"
          placeholder="Informations complémentaires pour le conducteur..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Réservation en cours..." : "Confirmer la réservation"}
      </Button>
    </form>
  );
};

export default BookingForm;
