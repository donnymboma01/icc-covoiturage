/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MdEmail,
  MdPhone,
  MdDirectionsCar,
  MdEdit,
  MdAdd,
  MdLocationOn,
  MdVerified,
  MdStar,
} from "react-icons/md";
import { FaCarSide, FaUserEdit } from "react-icons/fa";
import { EditProfileModal } from "./EditProfileModal";
import { BecomeDriverModal } from "./BecomeDriver";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { app } from "../../app/config/firebase-config";

interface Vehicle {
  brand: string;
  model: string;
  color: string;
  seats: number;
  licensePlate: string;
}

export interface UserData {
  uid: string;
  profilePicture?: string;
  fullName: string;
  isDriver: boolean;
  email: string;
  phoneNumber: string;
  vehicle?: Vehicle;
}

const UserProfile = ({
  user,
  onUpdateUser,
}: {
  user: UserData | null;
  onUpdateUser: (data: Partial<UserData>) => Promise<void>;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const db = getFirestore(app);

  const handleUpdateProfile = async (userData: Partial<UserData>) => {
    try {
      await onUpdateUser(userData);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleBecomeDriver = async (vehicleData: Vehicle) => {
    try {
      // Update user status to driver and add vehicle
      await onUpdateUser({
        isDriver: true,
        vehicle: vehicleData,
      });

      // Create vehicle document in Firestore
      const vehicleRef = doc(db, "Vehicles", user?.uid || "");
      await setDoc(vehicleRef, {
        ...vehicleData,
        userId: user?.uid,
        isActive: true,
      });
    } catch (error) {
      console.error("Error becoming driver:", error);
    }
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <Card className="p-4 sm:p-8 relative bg-gradient-to-r from-blue-600 to-blue-800">
          <Button
            variant="ghost"
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white"
            onClick={() => setIsEditing(true)}
          >
            <FaUserEdit className="mr-2" />
            <span className="hidden sm:inline">Modifier</span>
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <Avatar className="h-24 w-24 sm:h-40 sm:w-40 border-4 border-white shadow-xl">
              <AvatarImage
                src={
                  user?.profilePicture ||
                  "../../public/images/avatarprofile.png"
                }
              />
            </Avatar>

            <div className="text-white text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {user?.fullName}
              </h1>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-3 mb-4">
                <Badge className="bg-white text-blue-800">
                  {user?.isDriver ? "Conducteur" : "Passager"}
                </Badge>
                <Badge className="bg-slate-800">
                  <MdVerified className="mr-1" /> Vérifié
                </Badge>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <MdStar className="text-yellow-400" />
                <span className="text-sm sm:text-base">
                  Membre depuis {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <MdPhone className="text-blue-600" /> Contact
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <MdEmail className="text-lg sm:text-xl text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Email</p>
                  <p className="text-sm sm:text-base font-medium">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <MdPhone className="text-lg sm:text-xl text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Téléphone</p>
                  <p className="text-sm sm:text-base font-medium">
                    {user?.phoneNumber}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {!user?.isDriver && (
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-blue-50">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                Devenir conducteur
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Partagez vos trajets et rejoignez notre communauté de
                conducteurs
              </p>
              <Button
                className="w-full text-sm sm:text-base"
                onClick={() => setShowDriverForm(true)}
              >
                <FaCarSide className="mr-2" /> Devenir conducteur
              </Button>
            </Card>
          )}
        </div>

        {user?.isDriver && user.vehicle && (
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <MdDirectionsCar className="text-blue-600" />
              Véhicule
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <p className="text-sm text-gray-500">Marque</p>
                <p className="font-medium">{user.vehicle.brand}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Modèle</p>
                <p className="font-medium">{user.vehicle.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Couleur</p>
                <p className="font-medium">{user.vehicle.color}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nombre de places</p>
                <p className="font-medium">{user.vehicle.seats}</p>
              </div>
              <div className="col-span-full sm:col-span-2">
                <p className="text-sm text-gray-500">
                  Plaque d'immatriculation
                </p>
                <p className="font-medium">{user.vehicle.licensePlate}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
      {isEditing && (
        <EditProfileModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSubmit={handleUpdateProfile}
          currentUser={user}
        />
      )}

      {showDriverForm && (
        <BecomeDriverModal
          isOpen={showDriverForm}
          onClose={() => setShowDriverForm(false)}
          onSubmit={handleBecomeDriver}
        />
      )}
    </main>
  );
};

export default UserProfile;
