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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return !!user?.fcmToken;
  });

  const [churches, setChurches] = useState<Array<{ id: string; name: string }>>(
    []
  );

  const db = getFirestore(app);

  const handleUpdateProfile = async (userData: Partial<UserData>) => {
    try {
      const updateData = {
        ...userData,
        churchIds: userData.churchIds,
      };

      await onUpdateUser(updateData);

      if (updateData.churchIds?.[0]) {
        const churchRef = doc(db, "churches", updateData.churchIds[0]);
        const churchSnap = await getDoc(churchRef);
        if (churchSnap.exists()) {
          setChurchData(churchSnap.data() as { name: string });
        }
      }

      toast.success("Profil mis à jour avec succès");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    }
  };

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
      console.log("Fetched churches:", uniqueChurches);
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

  // console.log("Is iOS:", isIOSDevice());
  // const handleEnableNotifications = async () => {
  //   try {
  //     if (notificationsEnabled) {
  //       await onUpdateUser({ fcmToken: null });
  //       setNotificationsEnabled(false);
  //       toast.success("Notifications désactivées avec succès");
  //       console.log("Token FCM supprimé");
  //       return;
  //     }

  //     if (!("Notification" in window)) {
  //       toast.error("Votre navigateur ne supporte pas les notifications");
  //       return;
  //     }

  //     const permission = await Notification.requestPermission();

  //     if (permission === "granted") {
  //       const newToken = await requestPermission();
  //       console.log("Token FCM reçu:", newToken); 

  //       if (newToken && user?.uid) {
  //         await onUpdateUser({ fcmToken: newToken });
  //         setNotificationsEnabled(true);
  //         toast.success("Notifications activées avec succès");
  //       } else {
  //         toast.error("Impossible d'obtenir le token de notification");
  //       }
  //     } else {
  //       toast.error("Permission de notification refusée");
  //     }
  //   } catch (error) {
  //     console.error("Erreur lors de l'activation des notifications:", error);
  //     toast.error("Erreur lors de l'activation des notifications");
  //   }
  // };

  const handleEnableNotifications = async () => {
    try {
      if (notificationsEnabled) {
        await onUpdateUser({ fcmToken: null });
        setNotificationsEnabled(false);
        toast.success("Notifications désactivées");
        return;
      }

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        const newToken = await requestPermission();
        console.log("Mobile FCM Token:", newToken);

        if (newToken && user?.uid) {
          await onUpdateUser({ fcmToken: newToken });
          setNotificationsEnabled(true);
          toast.success("Notifications activées");
        }
      } else {
        const newToken = await requestPermission();
        console.log("Desktop FCM Token:", newToken);

        if (newToken && user?.uid) {
          await onUpdateUser({ fcmToken: newToken });
          setNotificationsEnabled(true);
          toast.success("Notifications activées");
        }
      }
    } catch (error) {
      console.error("Erreur notifications:", error);
    }
  };




  // const handleEnableNotifications = async () => {
  //   try {
  //     if (notificationsEnabled) {
  //       await onUpdateUser({
  //         fcmToken: null,
  //       });
  //       setNotificationsEnabled(false);
  //       toast.success("Notifications désactivées avec succès");
  //       return;
  //     }

  //     if (isIOSDevice()) {
  //       try {
  //         const newToken = await requestPermission();
  //         if (newToken && user?.uid) {
  //           await onUpdateUser({
  //             fcmToken: newToken,
  //           });
  //           setNotificationsEnabled(true);
  //           toast.success("Notifications activées avec succès");
  //         } else {
  //           toast.error("Impossible d'obtenir le token de notification");
  //         }
  //       } catch (error) {
  //         console.error("Erreur FCM:", error);
  //         toast.error("Erreur lors de l'activation des notifications");
  //       }
  //       return;
  //     }

  //     const permission = await Notification.requestPermission();
  //     if (permission === "granted") {
  //       const newToken = await requestPermission();
  //       if (newToken && user?.uid) {
  //         await onUpdateUser({
  //           fcmToken: newToken,
  //         });
  //         setNotificationsEnabled(true);
  //         toast.success("Notifications activées avec succès");
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Erreur:", error);
  //     toast.error("Erreur lors de la gestion des notifications");
  //   }
  // };

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
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="container mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <Card className="p-4 sm:p-8 relative bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-2">
            {/* <Button
              variant="ghost"
              className="text-white"
              onClick={() => setShowFeedbackModal(true)}
            >
              <MdFlag className="mr-2" />
              <span className="hidden sm:inline">Signaler</span>
            </Button> */}
            <Button
              variant="ghost"
              className="text-white flex flex-col items-center"
              onClick={() => setIsEditing(true)}
            >
              <FaUserEdit className="text-xl mb-1" />
              <span className="text-xs">Modifier</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-40 sm:w-40 border-4 border-white shadow-xl">
                <AvatarImage src={user?.profilePicture || UserAvatar.src} />
              </Avatar>
            </div>

            <div className="text-white w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center sm:justify-start gap-2 break-words">
                <span className="max-w-[200px] sm:max-w-none truncate">
                  {user?.fullName}
                </span>
                {isVerifiedUser(user) && (
                  <MdVerified className="text-amber-500 text-xl" />
                )}
              </h1>

              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-3 mb-4">
                <Badge className="bg-slate-800 ">
                  {user?.isDriver ? "Conducteur" : "Passager"}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <MdLocationOn className="text-yellow-400" />
                  <span className="text-sm sm:text-base">
                    {churchData?.name || "Église non spécifiée"}
                  </span>
                </div>

                {user?.isStar && user?.ministry && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 w-full">
                    <MdStar className="text-yellow-400 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-center sm:text-left truncate">
                      {user.ministry}
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
