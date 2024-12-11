/* eslint-disable @typescript-eslint/no-unused-vars */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timestamp } from "firebase/firestore";
import {
  MdLocationOn,
  MdAccessTime,
  MdAirlineSeatReclineNormal,
  MdRepeat,
  MdWarning,
  MdDelete,
  MdEdit,
  MdCancel,
} from "react-icons/md";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RideEditDialog } from "./EditRide";

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

interface RideCardProps {
  ride: Ride;
  onDelete: () => void;
  onUpdate: (updatedData: Partial<Ride>) => Promise<void>;
}

const RideCard = ({
  ride,
  onDelete,
  onUpdate,
}: RideCardProps & { onDelete: () => void }) => {
  const departureDate = ride.departureTime.toDate();

  const getRideStatus = () => {
    if (ride.status === "cancelled") return "cancelled";
    if (departureDate < new Date()) return "expired";
    if (ride.availableSeats === 0) return "complet";
    return "active";
  };

  const getStatusVariant = (
    status: string
  ): "destructive" | "secondary" | "default" | "outline" => {
    switch (status) {
      case "active":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "expired":
        return "outline";
      case "complet":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Disponible";
      case "cancelled":
        return "Annulé";
      case "expired":
        return "Date dépassée";
      case "complet":
        return "Complet";
      default:
        return status;
    }
  };

  const currentStatus = getRideStatus();
  const isModifiable = currentStatus === "active";

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MdLocationOn className="text-blue-500 text-xl" />
            <div>
              <h3 className="font-semibold text-lg text-gray-800">
                {ride.departureAddress}
              </h3>
              <div className="h-4 border-l-2 border-dashed border-gray-300 ml-2" />
              <h3 className="font-semibold text-lg text-gray-800">
                {ride.arrivalAddress}
              </h3>
            </div>
          </div>
          <Badge variant={getStatusVariant(currentStatus)}>
            {getStatusLabel(currentStatus)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <MdAccessTime className="text-gray-500" />
            <span className="text-sm text-gray-600">
              {departureDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              <br />
              {departureDate.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <MdAirlineSeatReclineNormal className="text-gray-500" />
            <span className="text-sm text-gray-600">
              {ride.availableSeats} places disponibles
            </span>
          </div>
        </div>

        {ride.isRecurring && (
          <div className="flex items-center space-x-2 text-blue-600">
            <MdRepeat />
            <span className="text-sm">
              Trajet {ride.frequency === "weekly" ? "hebdomadaire" : "mensuel"}
            </span>
          </div>
        )}

        {currentStatus === "expired" && (
          <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-2 rounded-lg">
            <MdWarning />
            <span className="text-sm">Ce trajet est déjà passé</span>
          </div>
        )}

        {isModifiable && (
          <div className="flex space-x-2 pt-2">
            {isModifiable && (
              <div className="flex space-x-2 pt-2">
                <RideEditDialog ride={ride} onSave={onUpdate} />
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <MdCancel className="mr-2" />
                  Annuler
                </Button>
              </div>
            )}
          </div>
        )}
        {/* <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white border-0 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <MdDelete /> Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogContent className="sm:max-w-[425px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  <span>
                    Êtes-vous sûr de vouloir supprimer ce trajet ? Cette action
                    est irréversible.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>
                  Confirmer la suppression
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog> */}
      </div>
    </div>
  );
};
export default RideCard;
