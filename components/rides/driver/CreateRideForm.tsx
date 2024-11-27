/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  getFirestore,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { app } from "@/app/config/firebase-config";
import { useAuth } from "@/app/hooks/useAuth";
import { toast } from "sonner";
import ChurchSelector from "./ChrurchSelector";
import RideSummary from "./RidesSummary";

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
}

const CreateRideForm = () => {
  const { user } = useAuth();
  const router = useRouter();
  const db = getFirestore(app);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RideFormData>({
    churchId: "",
    churchName: "",
    departureAddress: "",
    arrivalAddress: "",
    departureTime: new Date(),
    availableSeats: 1,
    waypoints: [],
    isRecurring: false,
  });

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleCreateRide = async () => {
    if (!user?.isDriver) {
      toast.error("Vous devez être conducteur pour créer un trajet");
      return;
    }

    console.log("User status:", user?.isDriver);

    try {
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

      // const rideData = {
      //   driverId: user.uid,
      //   churchId: formData.churchId,
      //   departureAddress: formData.departureAddress,
      //   arrivalAddress: formData.arrivalAddress,
      //   departureTime: formData.departureTime,
      //   availableSeats: formData.availableSeats,
      //   isRecurring: formData.isRecurring,
      //   frequency: formData.frequency,
      //   status: "active",
      //   waypoints: formData.waypoints,
      //   price: formData.price || 0,
      //   createdAt: new Date(),
      // };
      const rideData = {
        driverId: user.uid,
        churchId: formData.churchId,
        churchName: formData.churchName,
        departureAddress: formData.departureAddress,
        arrivalAddress: formData.arrivalAddress,
        departureTime: formData.departureTime,
        availableSeats: formData.availableSeats,
        isRecurring: formData.isRecurring,
        status: "active",
        waypoints: formData.waypoints,
        price: formData.price || 0,
        createdAt: new Date(),
        ...(formData.isRecurring && { frequency: formData.frequency }),
      };

      const docRef = await addDoc(collection(db, "rides"), rideData);

      toast.success("Votre trajet a été créé");

      router.push("/rides");
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
      <h2 className="text-xl font-semibold">Sélection de l'église</h2>
      <ChurchSelector
        onChurchSelect={(churchId, churchName) => 
          setFormData({ ...formData, churchId, churchName })}
      />
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
            value={formData.availableSeats}
            onChange={(e) =>
              setFormData({
                ...formData,
                availableSeats: parseInt(e.target.value),
              })
            }
          />
        </div>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Adresses</h2>
      <div style={{ display: currentStep === 3 ? "block" : "none" }}>
        <MapComponent
          onDepartureSelect={(address) =>
            setFormData({ ...formData, departureAddress: address })
          }
          onArrivalSelect={(address) =>
            setFormData({ ...formData, arrivalAddress: address })
          }
        />
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
