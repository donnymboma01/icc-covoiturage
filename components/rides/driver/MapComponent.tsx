"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface MapComponentProps {
  onDepartureSelect: (address: string) => void;
  onArrivalSelect: (address: string) => void;
}

const MapComponent = ({ onDepartureSelect, onArrivalSelect }: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<{
    departure: L.Marker | null;
    arrival: L.Marker | null;
    route: L.Polyline | null;
  }>({
    departure: null,
    arrival: null,
    route: null,
  });

  const [departure, setDeparture] = useState<Location | null>(null);
  const [arrival, setArrival] = useState<Location | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([48.8566, 2.3522]);

  // Initialisation de la carte
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current).setView(userLocation, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(leafletMap.current);

    // Géolocalisation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(newLocation);
        leafletMap.current?.setView(newLocation, 13);
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
      }
    );

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);


  const updateMarker = (
    location: Location,
    type: "departure" | "arrival"
  ) => {
    if (!leafletMap.current) return;

    // Supprimer l'ancien marqueur s'il existe
    if (markersRef.current[type]) {
      markersRef.current[type]?.remove();
    }

    // Créer le nouveau marqueur
    const marker = L.marker([location.lat, location.lng]).addTo(leafletMap.current);
    markersRef.current[type] = marker;

    // Ajuster la vue pour inclure tous les marqueurs

    const bounds = L.latLngBounds([]);
    if (markersRef.current.departure) {
      bounds.extend(markersRef.current.departure.getLatLng());
    }
    if (markersRef.current.arrival) {
      bounds.extend(markersRef.current.arrival.getLatLng());
    }

    if (bounds.isValid()) {
      leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };
  // Fonction pour mettre à jour l'itinéraire
  const updateRoute = async (start: Location, end: Location) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes[0] && leafletMap.current) {
        // Supprimer l'ancien itinéraire s'il existe
        if (markersRef.current.route) {
          markersRef.current.route.remove();
        }

        // Créer le nouvel itinéraire
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]]
        );
        const polyline = L.polyline(coordinates, {
          color: "blue",
          weight: 3,
          opacity: 0.7,
        }).addTo(leafletMap.current);

        markersRef.current.route = polyline;
        leafletMap.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
    } catch (error) {
      console.error("Erreur lors du calcul de l'itinéraire:", error);
    }
  };

  // Fonction de recherche d'adresse
  const searchAddress = async (address: string, isDeparture: boolean) => {
    if (!address.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`
      );
      const data = await response.json();

      if (data && data[0]) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name,
        };

        if (isDeparture) {
          setDeparture(location);
          onDepartureSelect(location.address);
          updateMarker(location, "departure");
        } else {
          setArrival(location);
          onArrivalSelect(location.address);
          updateMarker(location, "arrival");
        }

        // Mettre à jour l'itinéraire si les deux points sont définis
        if (isDeparture && arrival) {
          updateRoute(location, arrival);
        } else if (!isDeparture && departure) {
          updateRoute(departure, location);
        }
      }
    } catch (error) {
      console.error("Erreur de recherche d'adresse:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div ref={mapRef} className="h-[400px] rounded-lg overflow-hidden" />

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Adresse de départ"
            onChange={(e) => searchAddress(e.target.value, true)}
          />
          <Button
            onClick={() => {
              const location = {
                lat: userLocation[0],
                lng: userLocation[1],
                address: "Ma position actuelle",
              };
              setDeparture(location);
              onDepartureSelect(location.address);
              updateMarker(location, "departure");
              if (arrival) {
                updateRoute(location, arrival);
              }
            }}
          >
            Ma position
          </Button>
        </div>
        <Input
          type="text"
          placeholder="Adresse d'arrivée"
          onChange={(e) => searchAddress(e.target.value, false)}
        />
      </div>
    </div>
  );
};

export default MapComponent;