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

  // Démarrer le suivi de localisation
  const startTracking = async () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    try {
      // Obtenir la position initiale
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setCurrentLocation(position);

          // Démarrer le partage dans Firestore
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

          // Configurer le suivi continu
          watchIdRef.current = navigator.geolocation.watchPosition(
            async (newPosition) => {
              setCurrentLocation(newPosition);

              // Mettre à jour la position dans Firestore
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
              maximumAge: 10000, // 10 secondes
              timeout: 5000,     // 5 secondes
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

  // Fonction pour gérer les erreurs de géolocalisation avec des messages plus clairs
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

  // Arrêter le suivi de localisation
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

  // Gérer l'activation/désactivation automatique
  useEffect(() => {
    if (isEnabled && !isTracking && !error) {
      startTracking();
    } else if (!isEnabled && isTracking) {
      stopTracking();
    }

    // Nettoyage lors du démontage du composant
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
