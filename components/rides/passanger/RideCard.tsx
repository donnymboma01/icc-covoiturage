"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MdAccessTime, MdLocationOn, MdVerified, MdStar } from "react-icons/md";

interface RideCardProps {
  ride: {
    id: string;
    driverId: string;
    churchId: string;
    departureAddress: string;
    arrivalAddress: string;
    departureTime: Date;
    availableSeats: number;
    price?: number;
  };
  driver: {
    isStar: string | boolean | undefined;
    fullName: string;
    profilePicture?: string;
    isVerified?: boolean;
  };
  onClick?: () => void;
}

const RideCard = ({ ride, driver, onClick }: RideCardProps) => {
  const isPast = new Date() > ride.departureTime;
  const isFull = ride.availableSeats === 0;

  const getBadgeVariant = () => {
    if (isPast) return "destructive";
    if (isFull) return "secondary";
    return "default";
  };

  const getBadgeText = () => {
    if (isPast) return "Trajet terminé";
    if (isFull) return "Complet";
    return `${ride.availableSeats} place${
      ride.availableSeats > 1 ? "s" : ""
    } disponible${ride.availableSeats > 1 ? "s" : ""}`;
  };

  return (
    <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={driver.profilePicture || ""}
            alt={driver.fullName}
          />
        </Avatar>

        <div className="flex-1 space-y-2 w-full">
          <div className="flex flex-col items-center w-full mb-2">
            <div className="flex items-center justify-center gap-2 w-full">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{driver.fullName}</span>
                  {driver.isVerified && (
                    <Badge variant="outline" className="ml-1 bg-orange-100 text-orange-700 border-orange-200 flex items-center gap-1 px-1.5 py-0">
                      <MdVerified className="text-orange-500" />
                      <span className="text-xs">Vérifié</span>
                    </Badge>
                  )}
                  {driver.isStar && (
                    <Badge variant="outline" className="ml-1 bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1 px-1.5 py-0">
                      <MdStar className="text-yellow-500" />
                      <span className="text-xs">Star</span>
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-gray-500 text-center">Conducteur</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 text-center">
              {format(ride.departureTime, "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <MdAccessTime className="text-slate-400 shrink-0" />
              <span className="text-xs sm:text-sm">
                {format(ride.departureTime, "HH:mm")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MdLocationOn className="text-slate-400 shrink-0" />
              <span className="text-xs sm:text-sm truncate max-w-[250px]">
                {ride.departureAddress}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MdLocationOn className="text-slate-400 shrink-0" />
              <span className="text-xs sm:text-sm truncate max-w-[250px]">
                {ride.arrivalAddress}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2">
            <Badge variant={getBadgeVariant()}>{getBadgeText()}</Badge>
            <Button
              onClick={onClick}
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isPast || isFull}
            >
              Voir détails
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
export default RideCard;
