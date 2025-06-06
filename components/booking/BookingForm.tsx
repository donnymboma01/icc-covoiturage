/* eslint-disable react/no-unescaped-entities */
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
import { toast } from "sonner";
import { MdAccessTime, MdLocationOn, MdPerson, MdEuro } from "react-icons/md";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { Loader2 } from "lucide-react";

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
  const [error, setError] = useState<string>("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // const router = useRouter();

  const validateSeats = (value: number | string) => {
    if (value === "" || value === undefined) {
      setError("Veuillez entrer le nombre de places souhaité");
      return false;
    }

    const numValue = Number(value);

    if (isNaN(numValue)) {
      setError("Veuillez entrer uniquement des chiffres");
      return false;
    }

    if (!Number.isInteger(numValue)) {
      setError("Le nombre de places doit être un nombre entier");
      return false;
    }

    if (numValue <= 0) {
      setError("Vous devez réserver au moins 1 place");
      return false;
    }

    if (numValue > ride.availableSeats) {
      setError(
        `Il ne reste que ${ride.availableSeats} place${
          ride.availableSeats > 1 ? "s" : ""
        } disponible${ride.availableSeats > 1 ? "s" : ""}`
      );
      return false;
    }

    setError("");
    return true;
  };

  const handleSeatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSeats(Number(value));
    validateSeats(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateSeats(seats)) return;

    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        throw new Error("Le profil de l'utilisateur n'existe pas.");
      }

      const rideRef = doc(db, "rides", ride.id);
      const rideDoc = await getDoc(rideRef);
      const currentRideData = rideDoc.data();

      if (!currentRideData) {
        throw new Error("Le trajet n'existe plus");
      }

      const currentAvailableSeats = currentRideData.availableSeats;
      if (currentAvailableSeats < seats) {
        setError(
          `Désolé, il ne reste que ${currentAvailableSeats} place(s) disponible(s)`
        );
        return;
      }

      await addDoc(collection(db, "bookings"), {
        rideId: ride.id,
        passengerId: user.uid,
        bookingDate: new Date(),
        status: "pending",
        seatsBooked: seats,
        specialNotes: notes,
      });

      await updateDoc(rideRef, {
        availableSeats: currentAvailableSeats - seats,
      });

      setShowSuccessDialog(true);
      toast.success("Votre reservation a bien été prise en compte");

      const redirectTimer = setTimeout(() => {
        window.location.href = "/dashboard/passanger/bookings";
      }, 5000);

      return () => clearTimeout(redirectTimer);
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error);
      setError("Une erreur est survenue lors de la réservation");
      toast.error("Une erreur est survenue lors de la réservation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seats">Nombre de places</Label>
          <Input
            id="seats"
            type="number"
            min={1}
            max={ride.availableSeats}
            value={seats}
            onChange={handleSeatsChange}
            required
            pattern="[0-9]*"
            className={error ? "border-red-500" : ""}
          />

          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <p className="text-sm text-gray-500">
            Places disponibles: {ride.availableSeats}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <p className="text-sm text-blue-800 mb-2">
                Bien que ce service soit basé sur le bénévolat, une
                contribution pour le carburant serait grandement appréciée par le
                conducteur. C'est une belle façon de partager les frais et
                d'encourager ce service d'entraide.
              </p>
              <p className="text-xs text-blue-600 italic">
                "Que chacun donne comme il l'a résolu en son cœur, sans tristesse
                ni contrainte; car Dieu aime celui qui donne avec joie." - 2
                Corinthiens 9:7
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Ecrivez un message pour le conducteur</Label>
          <Textarea
            id="notes"
            placeholder="Informations complémentaires pour le conducteur..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            loading || !!error || seats <= 0 || seats > ride.availableSeats
          }
        >
          {loading ? "Réservation en cours..." : "Confirmer la réservation"}
        </Button>
      </form>

      <Dialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        modal={true}
      >
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center space-y-4 py-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
            <DialogTitle className="text-2xl font-bold text-green-600">
              Réservation confirmée !
            </DialogTitle>

            <div className="flex items-center space-x-2 text-amber-600">
              <Clock className="h-5 w-5" />
              <p className="text-lg font-medium">Rappel important</p>
            </div>

            <p className="text-gray-600 px-4">
              Pour le confort de tous les passagers et du conducteur, merci
              d'être présent(e)
              <span className="font-bold"> 15 minutes avant</span> l'heure de
              départ prévue.
            </p>

            <div className="mt-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">
                Redirection vers vos réservations...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingForm;
