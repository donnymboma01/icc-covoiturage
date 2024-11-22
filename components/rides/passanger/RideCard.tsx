"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MdAccessTime, MdLocationOn } from "react-icons/md";

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
    fullName: string;
    profilePicture?: string;
  };
  onClick?: () => void;
}

const RideCard = ({ ride, driver, onClick }: RideCardProps) => {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={driver.profilePicture || "/default-avatar.png"} alt={driver.fullName} />
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{driver.fullName}</h3>
              <p className="text-sm text-slate-500">
                {format(ride.departureTime, "EEEE d MMMM", { locale: fr })}
              </p>
            </div>
            {ride.price && (
              <span className="font-semibold text-green-600">{ride.price}€</span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MdAccessTime className="text-slate-400" />
              <span className="text-sm">
                {format(ride.departureTime, "HH:mm")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MdLocationOn className="text-slate-400" />
              <span className="text-sm truncate">{ride.departureAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <MdLocationOn className="text-slate-400" />
              <span className="text-sm truncate">{ride.arrivalAddress}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-slate-600">
              {ride.availableSeats} place{ride.availableSeats > 1 ? 's' : ''} disponible{ride.availableSeats > 1 ? 's' : ''}
            </span>
            <Button onClick={onClick} variant="outline">
              Voir détails
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RideCard;
