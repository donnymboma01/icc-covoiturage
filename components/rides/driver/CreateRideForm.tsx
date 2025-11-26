/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import {
  addDoc,
  collection,
  getFirestore,
  Timestamp,
  getDocs,
  query,
  where,
  getDoc,
  doc,
} from "firebase/firestore";
import { app } from "@/app/config/firebase-config";
import { toast } from "sonner";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaChair,
  FaEuroSign,
  FaCar,
  FaPhone,
  FaInfoCircle,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import RideSummary from "./RidesSummary";
import { ErrorBoundary } from "react-error-boundary";
import { geohashForLocation } from "geofire-common";
import { getCoordinates } from "../../../utils/geocoding";
import AddressAutocomplete from "@/components/maps/AddressAutocomplete";
import RoutePreview from "@/components/maps/RoutePreview";

// Dynamic import for MapboxMap to avoid SSR issues
const MapboxMap = dynamic(() => import("@/components/maps/MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
      <p className="text-slate-400">Chargement de la carte...</p>
    </div>
  ),
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

const CreateRideForm = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [churches, setChurches] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Coordinates state for Mapbox
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [endCoords, setEndCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  const [formData, setFormData] = useState<RideFormData>({
    churchId: "",
    churchName: "",
    departureAddress: "",
    arrivalAddress: "",
    departureTime: new Date(),
    availableSeats: 1,
    price: 0,
    waypoints: [],
    isRecurring: false,
    frequency: "weekly",
    serviceType: "Culte de dimanche",
    displayPhoneNumber: false,
    meetingPointNote: "",
  });

  const db = getFirestore(app);

  useEffect(() => {
    const fetchChurches = async () => {
      const churchesRef = collection(db, "churches");
      const snapshot = await getDocs(churchesRef);
      const churchesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        ...doc.data(),
      }));

      // Sort alphabetically
      churchesData.sort((a, b) => a.name.localeCompare(b.name));
      setChurches(churchesData);
    };

    const fetchVehicle = async () => {
      if (user?.uid) {
        const vehicleRef = doc(db, "vehicles", user.uid);
        const vehicleSnap = await getDoc(vehicleRef);
        if (vehicleSnap.exists()) {
          setVehicle(vehicleSnap.data() as Vehicle);
          setFormData((prev) => ({
            ...prev,
            availableSeats: Math.max(1, (vehicleSnap.data() as Vehicle).seats - 1),
          }));
        }
      }
    };

    fetchChurches();
    fetchVehicle();
  }, [user]);

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setStep((prev) => prev - 1);
  };

  const handleCreateRide = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get coordinates if not already set (fallback)
      let depLat = startCoords?.lat;
      let depLng = startCoords?.lng;
      let arrLat = endCoords?.lat;
      let arrLng = endCoords?.lng;

      if (!depLat || !depLng) {
        const depCoords = await getCoordinates(formData.departureAddress);
        depLat = depCoords.lat;
        depLng = depCoords.lng;
      }

      if (!arrLat || !arrLng) {
        const arrCoords = await getCoordinates(formData.arrivalAddress);
        arrLat = arrCoords.lat;
        arrLng = arrCoords.lng;
      }

      const departureHash = geohashForLocation([depLat, depLng]);
      const arrivalHash = geohashForLocation([arrLat, arrLng]);

      const rideData = {
        ...formData,
        driverId: user.uid,
        driverName: user.fullName || "Conducteur",
        driverPhoto: user.profilePicture || null,
        driverIsVerified: user.isVerified || false,
        driverIsStar: user.isStar || false,
        status: "active",
        createdAt: Timestamp.now(),
        departureTime: Timestamp.fromDate(new Date(formData.departureTime)),
        departureLocation: {
          lat: depLat,
          lng: depLng,
          geohash: departureHash,
        },
        arrivalLocation: {
          lat: arrLat,
          lng: arrLng,
          geohash: arrivalHash,
        },
        routeInfo: routeInfo ? {
          distanceKm: (routeInfo.distance / 1000).toFixed(1),
          durationMin: Math.round(routeInfo.duration / 60)
        } : null
      };

      await addDoc(collection(db, "rides"), rideData);
      toast.success("Trajet créé avec succès !");
      router.push("/rides/history");
    } catch (error) {
      console.error("Erreur création trajet:", error);
      toast.error("Erreur lors de la création du trajet");
    } finally {
      setLoading(false);
    }
  };

  const renderStepOne = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <Label className="text-lg font-semibold flex items-center gap-2">
          <FaMapMarkerAlt className="text-orange-500" />
          Itinéraire
        </Label>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Départ</Label>
            <AddressAutocomplete
              value={formData.departureAddress}
              onChange={(address, coords) => {
                setFormData({ ...formData, departureAddress: address });
                if (coords) {
                  setStartCoords(coords);
                  setIsMapVisible(true);
                }
              }}
              placeholder="D'où partez-vous ?"
            />
          </div>

          <div className="space-y-2">
            <Label>Arrivée</Label>
            <AddressAutocomplete
              value={formData.arrivalAddress}
              onChange={(address, coords) => {
                setFormData({ ...formData, arrivalAddress: address });
                if (coords) {
                  setEndCoords(coords);
                  setIsMapVisible(true);
                }
              }}
              placeholder="Où allez-vous ?"
            />
          </div>
        </div>

        {/* Mapbox Map Integration */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden rounded-xl shadow-lg border border-slate-200 ${isMapVisible ? 'h-[400px] opacity-100' : 'h-0 opacity-0'}`}>
          {isMapVisible && (
            <MapboxMap
              initialViewState={{
                latitude: startCoords?.lat || 50.8503,
                longitude: startCoords?.lng || 4.3517,
                zoom: 11
              }}
              markers={[
                ...(startCoords ? [{ latitude: startCoords.lat, longitude: startCoords.lng, color: "#22c55e" }] : []),
                ...(endCoords ? [{ latitude: endCoords.lat, longitude: endCoords.lng, color: "#ef4444" }] : [])
              ]}
            >
              <RoutePreview
                start={startCoords}
                end={endCoords}
                onRouteCalculated={(dist, dur) => setRouteInfo({ distance: dist, duration: dur })}
              />
            </MapboxMap>
          )}
        </div>

        {routeInfo && (
          <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between text-blue-800">
            <div className="flex items-center gap-2">
              <FaCar />
              <span className="font-semibold">Distance: {(routeInfo.distance / 1000).toFixed(1)} km</span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock />
              <span className="font-semibold">Durée: {Math.round(routeInfo.duration / 60)} min</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Église de destination (Optionnel)</Label>
          <Select
            value={formData.churchId}
            onValueChange={(value) => {
              const church = churches.find((c) => c.id === value);
              setFormData({
                ...formData,
                churchId: value,
                churchName: church?.name || "",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une église" />
            </SelectTrigger>
            <SelectContent>
              {churches.map((church) => (
                <SelectItem key={church.id} value={church.id}>
                  {church.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <Label className="text-lg font-semibold flex items-center gap-2">
          <FaClock className="text-orange-500" />
          Date et Heure
        </Label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Date et heure de départ</Label>
            <Input
              type="datetime-local"
              value={formData.departureTime.toISOString().slice(0, 16)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  departureTime: new Date(e.target.value),
                })
              }
              min={new Date().toISOString().slice(0, 16)}
              className="dark:text-white dark:bg-slate-800 dark:[color-scheme:dark]"
            />
          </div>

          <div className="space-y-2">
            <Label>Type de service</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) =>
                setFormData({ ...formData, serviceType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Type de service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Culte de dimanche">
                  Culte de dimanche
                </SelectItem>
                <SelectItem value="Etude biblique">Etude biblique</SelectItem>
                <SelectItem value="Prière">Réunion de prière</SelectItem>
                <SelectItem value="Evénement spécial">
                  Evénement spécial
                </SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-lg">
          <Switch
            checked={formData.isRecurring}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isRecurring: checked })
            }
          />
          <div className="space-y-0.5">
            <Label>Trajet récurrent</Label>
            <p className="text-sm text-muted-foreground">
              Ce trajet se répète régulièrement
            </p>
          </div>
        </div>

        {formData.isRecurring && (
          <div className="space-y-2 pl-6 border-l-2 border-orange-200">
            <Label>Fréquence</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value: "weekly" | "monthly") =>
                setFormData({ ...formData, frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <Label className="text-lg font-semibold flex items-center gap-2">
          <FaChair className="text-orange-500" />
          Détails du trajet
        </Label>

        <div className="space-y-2">
          <Label>Places disponibles</Label>
          <Input
            type="number"
            min={1}
            max={vehicle ? vehicle.seats - 1 : 4}
            value={formData.availableSeats}
            onChange={(e) =>
              setFormData({
                ...formData,
                availableSeats: parseInt(e.target.value),
              })
            }
            className="dark:text-white dark:bg-slate-800"
          />
        </div>

        <div className="space-y-2">
          <Label>Note pour le point de rendez-vous</Label>
          <Textarea
            placeholder="Ex: Je vous attends devant la boulangerie..."
            value={formData.meetingPointNote}
            onChange={(e) =>
              setFormData({ ...formData, meetingPointNote: e.target.value })
            }
          />
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-lg">
          <Switch
            checked={formData.displayPhoneNumber}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, displayPhoneNumber: checked })
            }
          />
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <FaPhone className="text-green-600" />
              Afficher mon numéro
            </Label>
            <p className="text-sm text-muted-foreground">
              Permettre aux passagers de voir votre numéro après réservation
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepFour = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <RideSummary formData={formData} />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card className="p-6 shadow-xl border-t-4 border-t-orange-500">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Proposer un trajet</h1>
            <span className="text-sm font-medium text-gray-500">
              Étape {step} sur 4
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-orange-500 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="min-h-[400px]">
          {step === 1 && renderStepOne()}
          {step === 2 && renderStepTwo()}
          {step === 3 && renderStepThree()}
          {step === 4 && renderStepFour()}
        </div>

        <div className="flex justify-between mt-8 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 1}
            className="w-32"
          >
            Précédent
          </Button>

          {step < 4 ? (
            <Button
              onClick={handleNext}
              className="w-32 bg-orange-600 hover:bg-orange-700 text-white"
              disabled={
                (step === 1 && (!formData.departureAddress || !formData.arrivalAddress)) ||
                (step === 3 && formData.availableSeats < 1)
              }
            >
              Suivant
            </Button>
          ) : (
            <Button
              onClick={handleCreateRide}
              disabled={loading}
              className="w-32 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Création..." : "Publier"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreateRideForm;
