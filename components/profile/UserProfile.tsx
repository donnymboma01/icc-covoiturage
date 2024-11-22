/* eslint-disable react/no-unescaped-entities */
"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { MdEmail, MdPhone, MdDirectionsCar } from "react-icons/md";

interface Vehicle {
  brand: string;
  model: string;
  color: string;
  seats: number;
  licensePlate: string;
}

interface UserData {
  profilePicture?: string;
  fullName: string;
  isDriver: boolean;
  email: string;
  phoneNumber: string;
  vehicle?: Vehicle;
}

const UserProfile = ({ user }: { user: UserData | null }) => {
  if (!user) {
    return null;
  }
  return (
    <main className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
            <AvatarImage
              src={user.profilePicture || "/default-avatar.png"}
              alt={user.fullName}
            />
          </Avatar>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{user.fullName}</h1>
            <Badge variant="secondary" className="bg-slate-800 text-white">
              {user.isDriver ? "Conducteur" : "Passager"}
            </Badge>
          </div>
        </div>

        <Separator />

        <Card className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <MdEmail className="text-xl text-slate-600" />
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MdPhone className="text-xl text-slate-600" />
              <div>
                <p className="text-sm text-slate-500">Téléphone</p>
                <p className="font-medium">{user.phoneNumber}</p>
              </div>
            </div>

            {user.isDriver && user.vehicle && (
              <div className="pt-4 space-y-3">
                {/* <div className="flex items-center space-x-2">
                  <MdDirectionsCar className="text-xl text-slate-600" />
                  <h3 className="font-semibold">Véhicule</h3>
                </div> */}

                {/* <div className="ml-7 space-y-2">
                  <p className="text-sm">
                    <span className="text-slate-500">Marque/Modèle:</span>{" "}
                    {user.vehicle.brand} {user.vehicle.model}
                  </p>
                  <p className="text-sm">
                    <span className="text-slate-500">Couleur:</span>{" "}
                    {user.vehicle.color}
                  </p>
                  <p className="text-sm">
                    <span className="text-slate-500">Places:</span>{" "}
                    {user.vehicle.seats}
                  </p>
                  <p className="text-sm">
                    <span className="text-slate-500">Immatriculation:</span>{" "}
                    {user.vehicle.licensePlate}
                  </p>
                </div> */}
              </div>
            )}
          </div>
        </Card>
        {user.isDriver && (
          <Card className="mt-6 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MdDirectionsCar className="text-2xl text-slate-600" />
                <h2 className="text-xl font-semibold">
                  Informations du véhicule
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Marque</p>
                  <p className="font-medium">{user.vehicle?.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Modèle</p>
                  <p className="font-medium">{user.vehicle?.model}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Couleur</p>
                  <p className="font-medium">{user.vehicle?.color}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Nombre de places</p>
                  <p className="font-medium">{user.vehicle?.seats}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">
                    Plaque d'immatriculation
                  </p>
                  <p className="font-medium">{user.vehicle?.licensePlate}</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
};

export default UserProfile;
