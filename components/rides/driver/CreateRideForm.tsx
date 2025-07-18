/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  getFirestore,
  onSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { app } from "@/app/config/firebase-config";
import { useAuth } from "@/app/hooks/useAuth";
import { toast } from "sonner";
import ChurchSelector from "./ChrurchSelector";
import RideSummary from "./RidesSummary";
import { ErrorBoundary } from "react-error-boundary";
import { geohashForLocation } from "geofire-common";
import { getCoordinates } from "../../../utils/geocoding";

export const prepareRideLocation = async (address: string) => {
  const coordinates = await getCoordinates(address);
  return {
    lat: coordinates.lat,
    lng: coordinates.lng,
    geohash: geohashForLocation([coordinates.lat, coordinates.lng]),
  };
};

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <div>Chargement de la carte...</div>,
});

interface RideFormData {
  churchId: string;
  churchName: string;
  departureAddress: string;
  arrivalAddress: string;
  departureTime: Date;
  availableSeats: number;
  price?: number;
  waypoints: string[];
  isRecurring: boolean;
  frequency?: "weekly" | "monthly";
  serviceType: string;
  displayPhoneNumber: boolean;
  meetingPointNote?: string;
}

interface Vehicle {
  seats: number;
}

const MapWithErrorBoundary = ({
  setFormData,
  formData,
  isMapVisible,
}: {
  setFormData: React.Dispatch<React.SetStateAction<RideFormData>>;
  formData: RideFormData;
  isMapVisible: boolean;
}) => {
  return (
    <ErrorBoundary
      fallback={
        <div>Une erreur est survenue lors du chargement de la carte</div>
      }
    >
      <MapComponent
        onDepartureSelect={(address) =>
          setFormData({ ...formData, departureAddress: address })
        }
        onArrivalSelect={(address) =>
          setFormData({ ...formData, arrivalAddress: address })
        }
        isMapVisible={isMapVisible}
      />
    </ErrorBoundary>
  );
};

const CreateRideForm = () => {
  const { user } = useAuth();
  const router = useRouter();
  const db = getFirestore(app);
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicleSeats, setVehicleSeats] = useState<number>(0);
  const [seatsError, setSeatsError] = useState<string>("");
  const [formData, setFormData] = useState<RideFormData>({
    churchId: "",
    churchName: "",
    departureAddress: "",
    arrivalAddress: "",
    departureTime: new Date(),
    availableSeats: 1,
    waypoints: [],
    isRecurring: false,
    serviceType: "",
    displayPhoneNumber: false,
  });
  const [isMapVisible, setIsMapVisible] = useState(true);

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // const loadVehicleData = async () => {
  //   if (!user?.uid) return;

  //   try {
  //     const vehicleQuery = query(
  //       collection(db, "vehicles"),
  //       where("userId", "==", user.uid),
  //       where("isActive", "==", true)
  //     );
  //     const vehicleSnapshot = await getDocs(vehicleQuery);

  //     if (!vehicleSnapshot.empty) {
  //       const vehicleData = vehicleSnapshot.docs[0].data() as Vehicle;
  //       setVehicleSeats(vehicleData.seats);
  //     }
  //   } catch (error) {
  //     console.error("Erreur lors du chargement du véhicule:", error);
  //   }
  // };

  // useEffect(() => {
  //   loadVehicleData();
  // }, [user]);

  useEffect(() => {
    if (!user?.uid) return;

    console.log("Setting up vehicle listener for user:", user.uid);

    const vehicleRef = collection(db, "vehicles");
    const q = query(
      vehicleRef,
      where("userId", "==", user.uid),
      where("isActive", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const vehicleData = snapshot.docs[0].data() as Vehicle;
        console.log("Firestore Vehicle Document:", snapshot.docs[0].id);
        console.log("Full Vehicle Data:", vehicleData);
        console.log("Current seats value in state:", vehicleSeats);
        console.log("New seats value from Firestore:", vehicleData.seats);
        setVehicleSeats(vehicleData.seats);
      } else {
        console.log("No active vehicle found for user");
      }
    }, (error) => {
      console.error("Vehicle snapshot error:", error);
    });

    return () => {
      console.log("Cleaning up vehicle listener");
      unsubscribe();
    };
  }, [user?.uid]);



  const handleCreateRide = async () => {
    if (!user?.isDriver) {
      toast.error("Vous devez être conducteur pour créer un trajet");
      return;
    }

    if (formData.availableSeats > vehicleSeats) {
      toast.error(
        "Le nombre de places proposées dépasse la capacité de votre véhicule"
      );
      return;
    }

    console.log("User status:", user?.isDriver);

    try {
      const departureLocation = await prepareRideLocation(
        formData.departureAddress
      );
      const arrivalLocation = await prepareRideLocation(
        formData.arrivalAddress
      );

      console.log("User:", user);
      const vehicleQuery = query(
        collection(db, "vehicles"),
        where("userId", "==", user.uid),
        where("isActive", "==", true)
      );
      const vehicleSnapshot = await getDocs(vehicleQuery);

      if (vehicleSnapshot.empty) {
        toast.error("Vous devez d'abord enregistrer un véhicule");
        return;
      }

      const rideData = {
        driverId: user.uid,
        churchId: formData.churchId,
        churchName: formData.churchName,
        departureAddress: formData.departureAddress,
        arrivalAddress: formData.arrivalAddress,
        departureLocation,
        arrivalLocation,
        departureTime: formData.departureTime,
        availableSeats: formData.availableSeats,
        isRecurring: formData.isRecurring,
        status: "active",
        waypoints: formData.waypoints,
        price: formData.price || 0,
        createdAt: new Date(),
        serviceType: formData.serviceType,
        ...(formData.isRecurring && { frequency: formData.frequency }),
        displayPhoneNumber: formData.displayPhoneNumber,
        meetingPointNote: formData.meetingPointNote || "",
      };

      const docRef = await addDoc(collection(db, "rides"), rideData);

      toast.success("Votre trajet a été créé");

      router.push("/rides/history");
      console.log("Departure Location:", departureLocation);
      console.log("Arrival Location:", arrivalLocation);
    } catch (error: unknown) {
      console.error("Détails complets de l'erreur:", error);
      if (error instanceof Error) {
        toast.error(`Impossible de créer le trajet : ${error.message}`);
      } else {
        toast.error(
          "Une erreur inconnue s'est produite lors de la création du trajet"
        );
      }
    }
  };

  const renderStepOne = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Type de service</h2>
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: "culte", label: "Culte du dimanche", icon: "🙏" },
          { id: "priere", label: "Réunion de prière", icon: "✝️" },
          { id: "evenement", label: "Semaine Royale", icon: "🎉" },
          { id: "autre", label: "Autre", icon: "📌" },
        ].map((service) => (
          <div
            key={service.id}
            onClick={() =>
              setFormData({ ...formData, serviceType: service.id })
            }
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${formData.serviceType === service.id
                ? "border-primary bg-primary/10"
                : "border-gray-200 hover:border-primary/50"
              }
            `}
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="text-2xl">{service.icon}</span>
              <span className="font-medium text-center">{service.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Informations du trajet</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="departureTime">Date et heure de départ</Label>
          <Input
            type="datetime-local"
            id="departureTime"
            onChange={(e) =>
              setFormData({
                ...formData,
                departureTime: new Date(e.target.value),
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="seats">Nombre de places disponibles</Label>
          <Input
            type="number"
            id="seats"
            min="1"
            max={vehicleSeats}
            value={formData.availableSeats}
            onChange={(e) => {
              const seats = parseInt(e.target.value);
              if (seats > vehicleSeats) {
                setSeatsError(
                  `Vous ne pouvez pas proposer plus de ${vehicleSeats} places (capacité de votre véhicule)`
                );
              } else {
                setSeatsError("");
              }
              setFormData({
                ...formData,
                availableSeats: seats,
              });
            }}
          />
          {seatsError && <p className="text-orange-500 mt-2">{seatsError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayPhoneNumber">
            Affichage du numéro de téléphone
          </Label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="displayPhoneNumber"
              checked={formData.displayPhoneNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayPhoneNumber: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">
              Autoriser l'affichage de mon numéro de téléphone aux passagers
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Adresses</h2>
      <div style={{ display: currentStep === 3 ? "block" : "none" }}>
        <MapWithErrorBoundary
          setFormData={setFormData}
          formData={formData}
          isMapVisible={isMapVisible}
        />


        <div className="mt-4">
          <Label htmlFor="meetingPointNote">Point de rencontre précis</Label>
          <Input
            id="meetingPointNote"
            placeholder="Ex: Devant l'entrée principale, près de l'arrêt de bus..."
            value={formData.meetingPointNote || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                meetingPointNote: e.target.value,
              })
            }
          />
          <p className="text-sm text-gray-500 mt-1">
            Précisez où exactement vous retrouverez vos passagers
          </p>
        </div>

        <div className="flex justify-center mt-4">
          <p
            className="text-orange-500 italic cursor-pointer hover:underline"
            onClick={() => setIsMapVisible(!isMapVisible)}
          >
            {isMapVisible ? "cacher la carte" : "afficher la carte"}
          </p>
        </div>
      </div>
    </div>
  );

  const renderStepFour = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Récapitulatif</h2>
      <RideSummary formData={formData} />
    </div>
  );

  const steps = {
    1: renderStepOne,
    2: renderStepTwo,
    3: renderStepThree,
    4: renderStepFour,
  };

  return (
    <main className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Créer un trajet</h1>
          <p className="text-slate-500">
            Proposez un trajet aux membres de votre église
          </p>
        </div>

        <Separator />

        <Card className="p-6">
          {steps[currentStep as keyof typeof steps]()}
          <div className="flex justify-between mt-6">
            {currentStep > 1 && (
              <Button onClick={handlePrevious} variant="outline">
                Précédent
              </Button>
            )}
            {currentStep < 4 ? (
              <Button onClick={handleNext} className="ml-auto">
                Suivant
              </Button>
            ) : (
              <Button
                onClick={handleCreateRide}
                className="ml-auto"
                disabled={
                  !formData.departureAddress || !formData.arrivalAddress
                }
              >
                Créer le trajet
              </Button>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
};

export default CreateRideForm;
