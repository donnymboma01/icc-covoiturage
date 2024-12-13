/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { MdEdit } from "react-icons/md";
import MapComponent from "./MapComponent";
import { toast } from "sonner";

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

interface RideEditDialogProps {
  ride: Ride;
  onSave: (updatedData: Partial<Ride>) => Promise<void>;
  carCapacity: number;
}

export function RideEditDialog({
  ride,
  onSave,
  carCapacity,
}: RideEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    departureAddress: ride.departureAddress,
    arrivalAddress: ride.arrivalAddress,
    departureTime: ride.departureTime.toDate(),
    availableSeats: ride.availableSeats,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        departureAddress: ride.departureAddress,
        arrivalAddress: ride.arrivalAddress,
        departureTime: ride.departureTime.toDate(),
        availableSeats: ride.availableSeats,
      });
    }
  }, [open, ride]);

  const validateSeats = (seats: number) => {
    if (seats <= 0) {
      toast.error("Le nombre de places doit être supérieur à 0");
      return false;
    }
    if (seats > carCapacity) {
      toast.error(
        `Vous ne pouvez pas proposer plus de ${carCapacity} places (capacité de votre véhicule)`
      );
      return false;
    }
    return true;
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     await onSave({
  //       ...formData,
  //       departureTime: Timestamp.fromDate(formData.departureTime),
  //     });
  //     setOpen(false);
  //     toast.success("Modifications enregistrées avec succès");
  //   } catch (error) {
  //     console.error("Error saving:", error);
  //     toast.error("Erreur lors de l'enregistrement");
  //   }
  // };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSeats(formData.availableSeats)) {
      return;
    }

    try {
      await onSave({
        ...formData,
        departureTime: Timestamp.fromDate(formData.departureTime),
      });
      setOpen(false);
      toast.success("Modifications enregistrées avec succès");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleSeatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > carCapacity) {
      toast.error(`Maximum ${carCapacity} places disponibles`);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      availableSeats: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          <MdEdit className="mr-2" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le nombre des places</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-4">
            {/* <div className="grid grid-cols-1 gap-4">
              <div>
                <label>Adresse de départ</label>
                <Input
                  value={formData.departureAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      departureAddress: e.target.value,
                    }))
                  }
                  className="mb-2"
                />
              </div>
              <div>
                <label>Adresse d'arrivée</label>
                <Input
                  value={formData.arrivalAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      arrivalAddress: e.target.value,
                    }))
                  }
                  className="mb-2"
                />
              </div>
            </div> */}

            {/* <div onClick={(e) => e.stopPropagation()}>
              <MapComponent
                onDepartureSelect={(address) =>
                  setFormData((prev) => ({
                    ...prev,
                    departureAddress: address,
                  }))
                }
                onArrivalSelect={(address) =>
                  setFormData((prev) => ({ ...prev, arrivalAddress: address }))
                }
                initialDepartureAddress={ride.departureAddress}
                initialArrivalAddress={ride.arrivalAddress}
              />
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* <div>
                <label>Date et heure de départ</label>
                <Input
                  type="datetime-local"
                  value={formData.departureTime.toISOString().slice(0, 16)}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      departureTime: new Date(e.target.value),
                    }))
                  }
                />
              </div> */}
              <div>
                <label>Nombre des places disponibles</label>
                {/* <Input
                  type="number"
                  value={formData.availableSeats}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      availableSeats: parseInt(e.target.value),
                    }))
                  }
                /> */}
                <Input
                  type="number"
                  value={formData.availableSeats}
                  onChange={handleSeatsChange}
                  min="1"
                  max={carCapacity}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
