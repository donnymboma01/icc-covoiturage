/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import {
  MdEmail,
  MdPhone,
  MdDirectionsCar,
  MdEdit,
  MdAdd,
  MdLocationOn,
  MdVerified,
  MdStar,
  MdNotifications,
} from "react-icons/md";
import { FaCarSide, FaUserEdit } from "react-icons/fa";
import { EditProfileModal } from "./EditProfileModal";
import { BecomeDriverModal } from "./BecomeDriver";
import {
  doc,
  setDoc,
  getFirestore,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { app } from "../../app/config/firebase-config";
import { useNotifications } from "@/app/hooks/useNotifications";
import UserAvatar from "../../public/images/avatarprofile.png";

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
  fcmToken?: string | null;
  churchIds?: string[];
}

const verses = [
  {
    text: "Celui qui arrose sera lui-même arrosé.",
    reference: "Proverbes 11:25",
  },
  {
    text: "Que chacun de vous, au lieu de considérer ses propres intérêts, considère aussi ceux des autres.",
    reference: "Philippiens 2:4",
  },
];

const UserProfile = ({
  user,
  onUpdateUser,
}: {
  user: UserData | null;
  onUpdateUser: (data: Partial<UserData>) => Promise<void>;
}) => {
  const { requestPermission, token, isEnabled } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [churchData, setChurchData] = useState<{ name: string } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [churches, setChurches] = useState<Array<{ id: string; name: string }>>(
    []
  );

  const db = getFirestore(app);

  // const handleUpdateProfile = async (userData: Partial<UserData>) => {
  //   try {
  //     await onUpdateUser(userData);
  //   } catch (error) {
  //     console.error("Error updating profile:", error);
  //   }
  // };
  const handleUpdateProfile = async (userData: Partial<UserData>) => {
    try {
      console.log("Updating user with data:", userData);
      await onUpdateUser(userData);

      if (userData.churchIds?.[0]) {
        const churchRef = doc(db, "churches", userData.churchIds[0]);
        const churchSnap = await getDoc(churchRef);
        if (churchSnap.exists()) {
          setChurchData(churchSnap.data() as { name: string });
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  useEffect(() => {
    setNotificationsEnabled(isEnabled);
  }, [isEnabled]);

  // Pour Jason & Djedou: Nous allons utiliser cette fonction pour
  // vérifier les informations d'un utilisateur avant de lui attribuer une certification.
  const isVerifiedUser = (user: UserData | null): boolean => {
    if (!user) return false;

    const phoneNumberRegex = /^\d+$/;

    return Boolean(
      user.fullName &&
        user.profilePicture &&
        user.email &&
        user.phoneNumber &&
        phoneNumberRegex.test(user.phoneNumber)
    );
  };

  useEffect(() => {
    const fetchChurches = async () => {
      const churchesCollection = collection(db, "churches");
      const churchesSnapshot = await getDocs(churchesCollection);
      const churchMap = new Map();

      churchesSnapshot.docs.forEach((doc) => {
        const church = doc.data();
        const normalizedName = church.name.trim().toLowerCase();

        if (!churchMap.has(normalizedName)) {
          churchMap.set(normalizedName, {
            id: doc.id,
            name: church.name.trim(),
          });
        }
      });

      const uniqueChurches = Array.from(churchMap.values());
      uniqueChurches.sort((a, b) => a.name.localeCompare(b.name));
      console.log("Fetched churches:", uniqueChurches); // Add this line
      setChurches(uniqueChurches);
    };

    fetchChurches();
  }, [db]);

  const handleEnableNotifications = async () => {
    if (!notificationsEnabled) {
      try {
        await requestPermission();
        if (token && user?.uid) {
          await onUpdateUser({
            fcmToken: token,
          });
          setNotificationsEnabled(true);
        }
      } catch (error) {
        console.error("Error enabling notifications:", error);
      }
    } else {
      if (user?.uid) {
        await onUpdateUser({
          fcmToken: null,
        });
        setNotificationsEnabled(false);
      }
    }
  };

  const handleBecomeDriver = async (vehicleData: Vehicle) => {
    try {
      await onUpdateUser({
        isDriver: true,
        vehicle: vehicleData,
      });

      const vehicleRef = doc(db, "Vehicles", user?.uid || "");
      await setDoc(vehicleRef, {
        ...vehicleData,
        userId: user?.uid,
        isActive: true,
      });
    } catch (error) {
      console.error("Erreur en passant à l'état de conducteur :", error);
    }
  };

  useEffect(() => {
    const fetchChurchData = async () => {
      if (user?.churchIds?.[0]) {
        const churchRef = doc(db, "churches", user.churchIds[0]);
        const churchSnap = await getDoc(churchRef);
        if (churchSnap.exists()) {
          setChurchData(churchSnap.data() as { name: string });
        }
      }
    };
    fetchChurchData();
  }, [user?.churchIds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVerseIndex((prevIndex) => (prevIndex + 1) % verses.length);
    }, 50000);

    return () => clearInterval(interval);
  }, []);

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
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-40 sm:w-40 border-4 border-white shadow-xl">
                <AvatarImage src={user?.profilePicture || UserAvatar.src} />
              </Avatar>
              <button
                onClick={() => setIsEditing(true)}
                className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700 transition-colors"
              >
                <MdEdit size={20} />
              </button>
            </div>

            <div className="text-white text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {user?.fullName}
              </h1>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-3 mb-4">
                <Badge className="bg-slate-800 ">
                  {user?.isDriver ? "Conducteur" : "Passager"}
                </Badge>
                {/* {isVerifiedUser(user) && (
                  <Badge className="bg-slate-800">
                    <MdVerified className="mr-1" /> Vérifié
                  </Badge>
                )} */}
                <Badge className="bg-slate-800">
                  <MdVerified className="mr-1" /> Vérifié
                </Badge>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <MdLocationOn className="text-yellow-400" />
                <span className="text-sm sm:text-base">
                  {churchData?.name || "Église non spécifiée"}
                </span>
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

              <Button
                onClick={handleEnableNotifications}
                className="flex items-center gap-2 w-full"
              >
                <MdNotifications />
                {notificationsEnabled
                  ? "Désactiver les notifications"
                  : "Activer les notifications"}
              </Button>

              {/* <Button
                onClick={handleEnableNotifications}
                className="flex items-center gap-2 w-full"
              >
                <MdNotifications />
                {notificationsEnabled
                  ? "Désactiver les notifications"
                  : "Activer les notifications"}
              </Button> */}
            </div>
          </Card>

          {!user?.isDriver && (
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-between h-full">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                  Devenir conducteur
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  {verses[currentVerseIndex].text} (
                  {verses[currentVerseIndex].reference})
                </p>
              </div>
              <Button
                className="w-full text-sm sm:text-base mt-4"
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
          churches={churches}
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
