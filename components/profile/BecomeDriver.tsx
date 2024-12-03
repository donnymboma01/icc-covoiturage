/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Vehicle {
  brand: string;
  model: string;
  color: string;
  seats: number;
  licensePlate: string;
}

interface BecomeDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vehicleData: Vehicle) => Promise<void>;
}

export function BecomeDriverModal({
  isOpen,
  onClose,
  onSubmit,
}: BecomeDriverModalProps) {
  const [vehicleData, setVehicleData] = useState({
    brand: "",
    model: "",
    color: "",
    seats: 0,
    licensePlate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(vehicleData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Devenir conducteur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="brand">Marque</Label>
              <Input
                id="brand"
                value={vehicleData.brand}
                onChange={(e) =>
                  setVehicleData({ ...vehicleData, brand: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="model">Modèle</Label>
              <Input
                id="model"
                value={vehicleData.model}
                onChange={(e) =>
                  setVehicleData({ ...vehicleData, model: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="color">Couleur</Label>
              <Input
                id="color"
                value={vehicleData.color}
                onChange={(e) =>
                  setVehicleData({ ...vehicleData, color: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="seats">Nombre de places</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                max="9"
                value={vehicleData.seats}
                onChange={(e) =>
                  setVehicleData({
                    ...vehicleData,
                    seats: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="licensePlate">Plaque d'immatriculation</Label>
              <Input
                id="licensePlate"
                value={vehicleData.licensePlate}
                onChange={(e) =>
                  setVehicleData({
                    ...vehicleData,
                    licensePlate: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Valider</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
