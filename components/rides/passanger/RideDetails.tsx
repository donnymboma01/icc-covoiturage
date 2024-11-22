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
} from "firebase/firestore";
import { app } from "../../../app/config/firebase-config";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { MdAccessTime, MdLocationOn, MdPerson, MdEuro } from "react-icons/md";
import BookingForm from "@/components/booking/BookingForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const db = getFirestore(app);

interface RideDetailsProps {
  rideId: string;
}

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

const RideDetails = ({ rideId }: RideDetailsProps) => {
  const [ride, setRide] = useState<Ride | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const rideDoc = await getDoc(doc(db, "rides", rideId));
        if (rideDoc.exists()) {
          const rideData = rideDoc.data() as Omit<Ride, "id">;
          setRide({
            id: rideDoc.id,
            ...rideData,
            // departureTime:
            //   rideData.departureTime instanceof Date
            //     ? rideData.departureTime
            //     : new Date(rideData.departureTime),
          });
          const driverDoc = await getDocs(
            query(
              collection(db, "users"),
              where("uid", "==", rideData.driverId)
            )
          );

          if (!driverDoc.empty) {
            const driverData = driverDoc.docs[0].data() as Driver;
            setDriver({
              uid: driverData.uid,
              fullName: driverData.fullName,
              phoneNumber: driverData.phoneNumber,
              profilePicture: driverData.profilePicture,
              isDriver: driverData.isDriver,
              churchIds: driverData.churchIds,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching ride details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRideDetails();
  }, [rideId]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!ride || !driver) {
    return <div>Trajet non trouvé</div>;
  }

  // const handleBooking = async () => {
  //   // Implement booking logic here
  // };

  // return (
  //   <Card className="p-6 max-w-2xl mx-auto">
  //     <div className="space-y-6">
  //       <div className="flex items-center gap-4 border-b pb-4">
  //         <Avatar className="h-16 w-16">
  //           <AvatarImage
  //             src={driver.profilePicture || "/default-avatar.png"}
  //             alt={driver.fullName}
  //           />
  //         </Avatar>
  //         <div>
  //           <h2 className="text-xl font-semibold">{driver.fullName}</h2>
  //           <p className="text-gray-500">{driver.phoneNumber}</p>
  //         </div>
  //       </div>

  //       <div className="space-y-4">
  //         <div className="flex items-center gap-2">
  //           <MdAccessTime className="text-xl text-gray-500" />
  //           <div>
  //             <p className="font-medium">
  //               {ride.departureTime instanceof Date
  //                 ? format(ride.departureTime, "EEEE d MMMM yyyy", {
  //                     locale: fr,
  //                   })
  //                 : "Date inconnue"}
  //             </p>
  //             <p className="text-gray-600">
  //               {ride.departureTime instanceof Date
  //                 ? format(ride.departureTime, "HH:mm")
  //                 : "Heure inconnue"}
  //             </p>
  //           </div>
  //         </div>

  //         <div className="space-y-2">
  //           <div className="flex items-center gap-2">
  //             <MdLocationOn className="text-xl text-gray-500" />
  //             <p>Départ: {ride.departureAddress}</p>
  //           </div>
  //           <div className="flex items-center gap-2">
  //             <MdLocationOn className="text-xl text-gray-500" />
  //             <p>Arrivée: {ride.arrivalAddress}</p>
  //           </div>
  //         </div>

  //         <div className="flex items-center gap-2">
  //           <MdPerson className="text-xl text-gray-500" />
  //           <p>{ride.availableSeats} places disponibles</p>
  //         </div>

  //         {ride.price && (
  //           <div className="flex items-center gap-2">
  //             <MdEuro className="text-xl text-gray-500" />
  //             <p>{ride.price}€ par personne</p>
  //           </div>
  //         )}
  //       </div>

  //       <div className="pt-4 border-t">
  //         {/* <Button
  //           onClick={handleBooking}
  //           className="w-full"
  //           disabled={ride.availableSeats === 0}
  //         >
  //           {ride.availableSeats > 0 ? "Réserver" : "Complet"}
  //         </Button> */}
  //         <div className="pt-4 border-t">
  //           <Dialog>
  //             <DialogTrigger asChild>
  //               <Button className="w-full" disabled={ride.availableSeats === 0}>
  //                 {ride.availableSeats > 0 ? "Réserver" : "Complet"}
  //               </Button>
  //             </DialogTrigger>
  //             <DialogContent>
  //               <DialogHeader>
  //                 <DialogTitle>Réserver ce trajet</DialogTitle>
  //               </DialogHeader>
  //               <BookingForm
  //                 ride={ride}
  //                 onSuccess={() => {
  //                   window.location.reload();
  //                 }}
  //               />
  //             </DialogContent>
  //           </Dialog>
  //         </div>
  //       </div>
  //     </div>
  //   </Card>
  // );
  return (
    <Card className="p-4 sm:p-6 max-w-2xl mx-auto w-full">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 border-b pb-4">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
            <AvatarImage
              src={driver.profilePicture || "/default-avatar.png"}
              alt={driver.fullName}
            />
          </Avatar>
          <div className="text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-semibold">
              {driver.fullName}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              {driver.phoneNumber}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <MdAccessTime className="text-xl text-gray-500" />
            <div className="text-sm sm:text-base">
              <p className="font-medium">
                {ride.departureTime instanceof Date
                  ? format(ride.departureTime, "EEEE d MMMM yyyy", {
                      locale: fr,
                    })
                  : "Date inconnue"}
              </p>
              <p className="text-gray-600">
                {ride.departureTime instanceof Date
                  ? format(ride.departureTime, "HH:mm")
                  : "Heure inconnue"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MdLocationOn className="text-xl text-gray-500 mt-1" />
              <p className="text-sm sm:text-base break-words flex-1">
                Départ: {ride.departureAddress}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <MdLocationOn className="text-xl text-gray-500 mt-1" />
              <p className="text-sm sm:text-base break-words flex-1">
                Arrivée: {ride.arrivalAddress}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <MdPerson className="text-xl text-gray-500" />
              <p className="text-sm sm:text-base">
                {ride.availableSeats} places disponibles
              </p>
            </div>

            {ride.price && (
              <div className="flex items-center gap-2">
                <MdEuro className="text-xl text-gray-500" />
                <p className="text-sm sm:text-base">
                  {ride.price}€ par personne
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="w-full sm:max-w-xs mx-auto block"
                disabled={ride.availableSeats === 0}
              >
                {ride.availableSeats > 0 ? "Réserver" : "Complet"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Réserver ce trajet</DialogTitle>
              </DialogHeader>
              <BookingForm
                ride={ride}
                onSuccess={() => {
                  window.location.reload();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
};
export default RideDetails;
