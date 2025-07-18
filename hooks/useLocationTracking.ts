import { useState, useEffect, useRef } from "react";
import {
  startLocationSharing,
  updateLocation,
  stopLocationSharing,
} from "@/utils/locationService";

interface UseLocationTrackingProps {
  bookingId: string;
  passengerId: string;
  driverId: string;
  sharingUserId: string;
  sharingUserType: "driver" | "passenger";
  isEnabled: boolean;
}

export const useLocationTracking = ({
  bookingId,
  passengerId,
  driverId,
  sharingUserId,
  sharingUserType,
  isEnabled,
}: UseLocationTrackingProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<GeolocationPosition | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

 
  const startTracking = async () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    try {

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setCurrentLocation(position);

          const id = await startLocationSharing(
            bookingId,
            passengerId,
            driverId,
            sharingUserId,
            sharingUserType,
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }
          );

          setSharingId(id);
          setIsTracking(true);


          watchIdRef.current = navigator.geolocation.watchPosition(
            async (newPosition) => {
              setCurrentLocation(newPosition);

  
              if (id) {
                await updateLocation(id, {
                  lat: newPosition.coords.latitude,
                  lng: newPosition.coords.longitude,
                  accuracy: newPosition.coords.accuracy,
                });
              }
            },
            (err) => {
              handleGeolocationError(err);
            },
            {
              enableHighAccuracy: true,
              maximumAge: 10000, 
              timeout: 5000,     
            }
          );
        },
        (err) => {
          handleGeolocationError(err);
        }
      );
    } catch (err) {
      setError(`Erreur lors du démarrage du suivi: ${err instanceof Error ? err.message : String(err)}`);
    }
  };


  const handleGeolocationError = (error: GeolocationPositionError) => {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        setError(
          "Accès à la localisation refusé. Veuillez autoriser l'accès à votre position dans les paramètres de votre navigateur. " +
          "Cliquez sur l'icône de cadenas dans la barre d'adresse et activez la localisation."
        );
        break;
      case error.POSITION_UNAVAILABLE:
        setError("Information de position non disponible. Vérifiez que votre GPS est activé.");
        break;
      case error.TIMEOUT:
        setError("Délai d'attente dépassé pour obtenir la position. Veuillez réessayer.");
        break;
      default:
        setError(`Erreur de géolocalisation: ${error.message}`);
    }
  };

  const stopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (sharingId) {
      await stopLocationSharing(sharingId);
    }

    setIsTracking(false);
  };


  useEffect(() => {
    if (isEnabled && !isTracking && !error) {
      startTracking();
    } else if (!isEnabled && isTracking) {
      stopTracking();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      if (isTracking && sharingId) {
        stopLocationSharing(sharingId).catch(console.error);
      }
    };
  }, [isEnabled]);

  return {
    isTracking,
    error,
    currentLocation,
    startTracking,
    stopTracking,
  };
};
