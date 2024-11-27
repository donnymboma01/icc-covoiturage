"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const customIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/2098/2098567.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface MapComponentProps {
  onDepartureSelect: (address: string) => void;
  onArrivalSelect: (address: string) => void;
}

const MapComponent = ({
  onDepartureSelect,
  onArrivalSelect,
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  const [departureAddress, setDepartureAddress] = useState<string>("");
  const [arrivalAddress, setArrivalAddress] = useState<string>("");
  const [departureMarker, setDepartureMarker] = useState<L.Marker | null>(null);
  const [arrivalMarker, setArrivalMarker] = useState<L.Marker | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number]>([
    50.85,
    4.35, // Bruxelles par défaut
  ]);

  const updateMarker = (location: Location, type: "departure" | "arrival") => {
    if (!leafletMap.current) return;

    const marker = L.marker([location.lat, location.lng], {
      icon: customIcon,
    }).addTo(leafletMap.current);

    marker
      .bindPopup(
        `<div>
          <strong>${type === "departure" ? "Départ" : "Arrivée"}</strong><br />
          ${location.address}
        </div>`
      )
      .openPopup();

    if (type === "departure") {
      departureMarker?.remove();
      setDepartureMarker(marker);
      setDepartureAddress(location.address);
      onDepartureSelect(location.address);
    } else {
      arrivalMarker?.remove();
      setArrivalMarker(marker);
      setArrivalAddress(location.address);
      onArrivalSelect(location.address);
    }
  };

  const searchAddress = async (
    address: string,
    type: "departure" | "arrival"
  ) => {
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

        updateMarker(location, type);
        leafletMap.current?.setView([location.lat, location.lng], 13);
      } else {
        alert("Aucune adresse trouvée pour votre recherche.");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
    }
  };

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current).setView(userLocation, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(leafletMap.current);

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
        console.warn("Erreur de géolocalisation :", error);
      }
    );

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div
          ref={mapRef}
          className="h-[400px] sm:h-[300px] md:h-[450px] w-full rounded-lg shadow-lg"
        />

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Input
                type="text"
                placeholder="Adresse de départ"
                value={departureAddress}
                onChange={(e) => setDepartureAddress(e.target.value)}
                className="w-full"
              />
              <Button
                onClick={() => searchAddress(departureAddress, "departure")}
                className="w-full sm:w-auto"
              >
                Chercher
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Input
                type="text"
                placeholder="Adresse d'arrivée"
                value={arrivalAddress}
                onChange={(e) => setArrivalAddress(e.target.value)}
                className="w-full"
              />
              <Button
                onClick={() => searchAddress(arrivalAddress, "arrival")}
                className="w-full sm:w-auto"
              >
                Chercher
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MapComponent;
