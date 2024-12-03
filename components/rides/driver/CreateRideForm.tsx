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
import { ErrorBoundary } from "react-error-boundary";

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
}

const MapWithErrorBoundary = ({
  setFormData,
  formData,
}: {
  setFormData: React.Dispatch<React.SetStateAction<RideFormData>>;
  formData: RideFormData;
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
      />
    </ErrorBoundary>
  );
};

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
    serviceType: "",
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
        serviceType: formData.serviceType,  
        ...(formData.isRecurring && { frequency: formData.frequency }),
      };
      

      const docRef = await addDoc(collection(db, "rides"), rideData);

      toast.success("Votre trajet a été créé");

      router.push("/rides/history");
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

  // const renderStepOne = () => (
  //   <div className="space-y-4">
  //     <h2 className="text-xl font-semibold">Sélection de l'église</h2>
  //     <ChurchSelector
  //       onChurchSelect={(churchId, churchName) =>
  //         setFormData({ ...formData, churchId, churchName })
  //       }
  //     />
  //   </div>
  // );
  const renderStepOne = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Type de service</h2>
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: 'culte', label: 'Culte du dimanche', icon: '🙏' },
          { id: 'priere', label: 'Réunion de prière', icon: '✝️' },
          { id: 'evenement', label: 'Événement spécial', icon: '🎉' },
          { id: 'autre', label: 'Autre', icon: '📌' },
        ].map((service) => (
          <div
            key={service.id}
            onClick={() => setFormData({ ...formData, serviceType: service.id })}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${formData.serviceType === service.id 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-200 hover:border-primary/50'}
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
        <MapWithErrorBoundary setFormData={setFormData} formData={formData} />
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
