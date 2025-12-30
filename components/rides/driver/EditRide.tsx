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
  onSave: (updatedData: Partial<Ride> & { seatsToAdd?: number }) => Promise<void>;
  carCapacity: number;
}

export function RideEditDialog({
  ride,
  onSave,
}: RideEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [seatsToAdd, setSeatsToAdd] = useState(1);

  useEffect(() => {
    if (open) {
      setSeatsToAdd(1);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (seatsToAdd < 1) {
      toast.error("Vous devez ajouter au moins 1 place");
      return;
    }

    try {
      await onSave({
        seatsToAdd: seatsToAdd,
      });
      setOpen(false);
      toast.success(`${seatsToAdd} place(s) ajoutée(s) avec succès`);
    } catch (error) {
      toast.error("Erreur lors de l'ajout des places");
    }
  };

  const handleSeatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      return;
    }
    setSeatsToAdd(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          <MdEdit className="mr-2" />
          Ajouter des places
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ajouter des places</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Places actuellement disponibles : <strong>{ride.availableSeats}</strong>
              </p>
            </div>

            <div>
              <label className="block mb-2 font-medium">Nombre de places à ajouter</label>
              <Input
                type="number"
                value={seatsToAdd}
                onChange={handleSeatsChange}
                min="1"
                max="10"
              />
              <p className="text-sm text-gray-500 mt-2">
                Après modification : {ride.availableSeats + seatsToAdd} place(s) disponible(s)
              </p>
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
            <Button type="submit" disabled={seatsToAdd < 1}>
              Ajouter {seatsToAdd} place(s)
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}