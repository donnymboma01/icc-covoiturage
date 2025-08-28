/* eslint-disable @typescript-eslint/no-explicit-any */
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
  MdFlag,
  MdVerified,
  MdStar,
  MdNotifications,
} from "react-icons/md";
import { FaCarSide, FaUserEdit } from "react-icons/fa";
import { EditProfileModal } from "./EditProfileModal";
import { BecomeDriverModal } from "./BecomeDriver";
import { toast } from "sonner";
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
import FeedbackModal from "../feedback/FeedbackModal";
import { getAuth, updateEmail } from "firebase/auth";

interface Vehicle {
  brand: string;
  model: string;
  color: string;
  seats: number;
  licensePlate: string;
}

export interface UserData {
  ministry: string | boolean | undefined;
  uid: string;
  profilePicture?: string;
  fullName: string;
  isDriver: boolean;
  email: string;
  phoneNumber: string;
  vehicle?: Vehicle;
  fcmToken?: string | null;
  churchIds?: string[];
  isStar: string | boolean | undefined;
  isVerified?: boolean;
  driverStatus?: "pending" | "approved" | "rejected";
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
  onUpdateUser: (data: Partial<UserData> & { driverStatus?: "pending" | "approved" | "rejected" }) => Promise<void>;
}) => {
  const { requestPermission, token, isEnabled } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [churchData, setChurchData] = useState<{ name: string } | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [localUserData, setLocalUserData] = useState(user);

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return !!user?.fcmToken;
  });

  const [churches, setChurches] = useState<Array<{ id: string; name: string }>>(
    []
  );

  const db = getFirestore(app);

  useEffect(() => {
    setLocalUserData(user);
  }, [user]);

  const handleUpdateProfile = async (userData: Partial<UserData>) => {
    try {
      console.log('Current state before update:', localUserData);
      console.log('Incoming update data:', userData);

      if (userData.vehicle && userData.isDriver && user?.uid) {
        const vehicleRef = doc(db, "vehicles", user.uid);

        const vehicleDoc = await getDoc(vehicleRef);
        const currentVehicleData = vehicleDoc.exists() ? vehicleDoc.data() : {};

        const mergedVehicleData = {
          ...currentVehicleData,
          ...userData.vehicle,
          userId: user.uid,
          isActive: true,
        };

        await setDoc(vehicleRef, mergedVehicleData);

        const updatedUserData = {
          ...userData,
          vehicle: mergedVehicleData,
        };


        await onUpdateUser(updatedUserData);

        setLocalUserData(prev => ({
          ...prev,
          ...updatedUserData,
        } as UserData));


        console.log('Updated state:', localUserData);
      } else {

        await onUpdateUser(userData);
        setLocalUserData(prev => ({
          ...prev,
          ...userData,
        } as UserData));
      }

      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    }
  };



  useEffect(() => {
    if (user) {
      const syncData = async () => {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserData;

        if (userData.isDriver) {
          const vehicleRef = doc(db, "vehicles", user.uid);
          const vehicleDoc = await getDoc(vehicleRef);
          if (vehicleDoc.exists()) {
            userData.vehicle = vehicleDoc.data() as Vehicle;
          }
        }

        setLocalUserData(userData);
      };

      syncData();
    }
  }, [user, db]);


  useEffect(() => {
    setNotificationsEnabled(isEnabled);
  }, [isEnabled]);


  const isVerifiedUser = (user: UserData | null): boolean => {
    if (!user) return false;

    const nameValidation = (name: string): boolean => {
      const nameRegex = /^[A-Za-zÀ-ÿ](?:[A-Za-zÀ-ÿ''\s-]*[A-Za-zÀ-ÿ])?$/;

      const hasValidLength = name.length >= 2 && name.length <= 50;
      const noConsecutiveSymbols = !/[''-]{2,}/.test(name);
      const noLeadingTrailingSpaces = name.trim() === name;

      return (
        nameRegex.test(name) &&
        hasValidLength &&
        noConsecutiveSymbols &&
        noLeadingTrailingSpaces
      );
    };

    const phoneNumberRegex = /^\d+$/;

    const hasValidProfilePicture = Boolean(
      user.profilePicture &&
      user.profilePicture !== "" &&
      !user.profilePicture.includes("avatarprofile.png")
    );

    return Boolean(
      user.fullName &&
      nameValidation(user.fullName) &&
      hasValidProfilePicture &&
      user.email &&
      user.phoneNumber &&
      phoneNumberRegex.test(user.phoneNumber) &&
      user.isStar &&
      (!user.isDriver || (user.isDriver && user.vehicle?.licensePlate))
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
      setChurches(uniqueChurches);
    };

    fetchChurches();
  }, [db]);

  const isIOSDevice = () => {
    return (
      typeof window !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent)
    );
  };

  const handleEnableNotifications = async () => {
    try {
      if (notificationsEnabled) {
        await onUpdateUser({ fcmToken: null });
        setNotificationsEnabled(false);
        toast.success("Notifications désactivées");
        return;
      }

      if (!("Notification" in window)) {
        toast.error("Votre navigateur ne supporte pas les notifications");
        return;
      }

      if (!("serviceWorker" in navigator)) {
        toast.error("Votre navigateur ne supporte pas les notifications push");
        return;
      }

      console.log("Début de l'activation des notifications...");
      const newToken = await requestPermission();
      console.log("Token reçu:", newToken);

      if (newToken && user?.uid) {
        await onUpdateUser({ fcmToken: newToken });
        setNotificationsEnabled(true);
        toast.success("🔔 Notifications activées avec succès !");
        
        if (Notification.permission === "granted") {
          new Notification("Notifications activées !", {
            body: "Vous recevrez maintenant les notifications de covoiturage",
            icon: "/icon-192x192.png"
          });
        }
      } else {
        toast.error("Impossible d'activer les notifications. Vérifiez vos paramètres de navigateur.");
      }
    } catch (error) {
      console.error("Erreur notifications:", error);
      toast.error("Erreur lors de l'activation des notifications");
    }
  };



  useEffect(() => {
    const checkNotificationSupport = () => {
      if (typeof window !== "undefined" && "Notification" in window) {
        setNotificationsEnabled(Notification.permission === "granted");
      } else {
        setNotificationsEnabled(false);
      }
    };

    checkNotificationSupport();
  }, []);

  const handleBecomeDriver = async (vehicleData: Vehicle) => {
    try {
      const updateData: UserData = {
        ...localUserData as UserData,
        isDriver: true,
        vehicle: vehicleData,
        driverStatus: "pending"
      };

      await onUpdateUser(updateData);

      const vehicleRef = doc(db, "vehicles", user?.uid || "");
      await setDoc(vehicleRef, {
        ...vehicleData,
        userId: user?.uid,
        isActive: true,
      });

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      await setDoc(doc(db, "driverVerifications", user?.uid || ""), {
        userId: user?.uid,
        verificationCode,
        isVerified: false,
        createdAt: new Date()
      });

      document.cookie = `pendingDriverId=${user?.uid}; path=/; max-age=86400; SameSite=Strict`;

      const emailResponse = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          verificationCode,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error("Erreur lors de l'envoi de l'email de vérification");
      }

      toast.success("Vous êtes maintenant conducteur ! Veuillez vérifier votre email pour activer votre compte.");

      window.location.href = "/verify-driver";
    } catch (error) {
      console.error("Erreur en passant à l'état de conducteur :", error);
      toast.error("Une erreur est survenue lors de la conversion en conducteur");
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
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="container mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <Card className="p-4 sm:p-8 relative bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              className="text-white flex flex-col items-center"
              onClick={() => setIsEditing(true)}
            >
              <FaUserEdit className="text-xl mb-1" />
              <span className="text-xs">Modifier</span>
            </Button>
            <Button
              variant="ghost"
              className="text-white"
              onClick={() => setShowFeedbackModal(true)}
            >
              <MdFlag className="mr-2" />
              <span className="sm:hidden">Signaler</span>
              <span className="hidden sm:inline">Signaler problème</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-40 sm:w-40 border-4 border-white shadow-xl">
                <AvatarImage src={localUserData?.profilePicture || UserAvatar.src} />
              </Avatar>
              {localUserData?.isDriver && localUserData?.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                  <MdVerified className="text-orange-500 h-6 w-6" />
                </div>
              )}
            </div>

            <div className="text-white w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center sm:justify-start gap-2 break-words">
                <span className="max-w-[200px] sm:max-w-none truncate">
                  {localUserData?.fullName}
                </span>
              </h1>

              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-3 mb-4">
                <Badge className={`
                  ${localUserData?.isDriver && localUserData?.isVerified
                    ? "bg-orange-500 text-white"
                    : "bg-slate-800"} 
                  flex items-center gap-2
                `}>
                  {localUserData?.isDriver ? "Conducteur" : "Passager"}
                  {localUserData?.isDriver && localUserData?.isVerified && (
                    <span className="text-xs bg-white/20 px-1 rounded">vérifié</span>
                  )}
                </Badge>
                {isVerifiedUser(localUserData) && (
                  <Badge className="bg-green-600">
                    Profil complet
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <MdLocationOn className="text-yellow-400" />
                  <span className="text-sm sm:text-base">
                    {churchData?.name || "Église non spécifiée"}
                  </span>
                </div>

                {localUserData?.isStar && localUserData?.ministry && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 w-full">
                    <MdStar className="text-yellow-400 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-center sm:text-left truncate">
                      {localUserData.ministry}
                    </span>
                  </div>
                )}
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
              <div className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <MdEmail className="text-lg sm:text-xl text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm sm:text-base font-medium dark:text-gray-200">
                    {localUserData?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <MdPhone className="text-lg sm:text-xl text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                  <p className="text-sm sm:text-base font-medium dark:text-gray-200">
                    {localUserData?.phoneNumber}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleEnableNotifications}
                className="flex items-center justify-center gap-2 w-full p-4"
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <MdNotifications size={20} />
                <span className="text-sm">
                  {notificationsEnabled
                    ? "Désactiver les notifications"
                    : "Activer les notifications"}
                </span>
              </Button>
            </div>
          </Card>

          {!localUserData?.isDriver && (
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

        {localUserData?.isDriver && localUserData?.vehicle && (
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <MdDirectionsCar className="text-blue-600" />
              Véhicule
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <p className="text-sm text-gray-500">Marque</p>
                <p className="font-medium">{localUserData.vehicle?.brand}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Modèle</p>
                <p className="font-medium">{localUserData.vehicle?.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Couleur</p>
                <p className="font-medium">{localUserData.vehicle?.color}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nombre de places</p>
                <p className="font-medium">{localUserData.vehicle?.seats}</p>
              </div>
              <div className="col-span-full sm:col-span-2">
                <p className="text-sm text-gray-500">Plaque d'immatriculation</p>
                <p className="font-medium">{localUserData.vehicle?.licensePlate}</p>
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

      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          userId={user?.uid || ""}
          userType={user?.isDriver ? "driver" : "passenger"}
        />
      )}
    </main>
  );
};

export default UserProfile;
